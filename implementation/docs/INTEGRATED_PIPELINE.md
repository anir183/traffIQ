# Integrated Pipeline Architecture

`implementation/` is a self-contained Colab testing harness. It wraps the existing
`ai/` models **without modifying them** and emits events in the exact JSON shape the
backend expects (`MlDetectionRequest.java`).

## Layout

```
implementation/
├── requirements.txt
├── adapters/                 # model wrappers (thin, replaceable)
│   ├── vehicle_detector.py   # object.pt yolo5 -> {bbox, type, type_confidence}
│   ├── tracking_adapter.py   # CenterPointTracker (default) + optional ByteTrack
│   ├── speed_adapter.py      # two virtual lines, distance/time -> km/h
│   ├── plate_detector.py     # best.pt (ultralytics) -> plate bboxes
│   ├── plate_recognition.py  # ai/src PlateRecognizer -> {text, confidence, format_valid}
│   └── temporal_filter.py    # ai/src TemporalPlateConsensus
├── pipeline/
│   ├── config.py             # paths, thresholds, line geometry, contract settings
│   ├── schemas.py            # event dataclasses mirroring the backend JSON
│   ├── pipeline.py           # DetectionPipeline (orchestrator) + VideoProcessor
│   └── visualization.py      # frame overlays + annotated video + summaries
├── notebooks/                # Colab notebooks 00-03
├── docs/                     # this doc set
└── data_demo/                # placeholder / upload notes for demo media
```

## Per-frame flow

`DetectionPipeline.process_frame(frame, fps)`:

1. **Detect vehicles** — `object.pt` (COCO classes) → vehicle bboxes + type + conf.
2. **Track** — center-point tracker (teammate's `Tracker` port) assigns stable
   `local_track_id`. Set `tracker_kind="bytetrack"` for the Kalman/IoU backend.
3. **Detect plates** — `best.pt` → plate bboxes.
4. **Recognize plates** — adapter wraps `PlateRecognizer` (char.pt raw + LPSR-enhanced +
   TrOCR fallback, grammar/state fix) → `{text, confidence, format_valid}`.
5. **Temporal vote** — `TemporalPlateConsensus` over plate boxes; each tracked vehicle
   keeps its best plate observation.
6. **Speed** — each tracked vehicle's centre crossing the two virtual lines (configurable
   `line_a_y`, `line_b_y`, band `line_offset`, real `distance_meters`) yields
   `speed_kmh = distance_meters / elapsed_video_time * 3.6`. Direction = crossing order,
   mapped to a compass string per camera (e.g. A->B `"NORTH"`, B->A `"SOUTH"`).
7. **Emit** — when a vehicle completes a crossing *and* has a read plate, one event is
   emitted (once per track). Events with no plate text are skipped (backend requires
   non-blank `plate.text`).

## Output contract (backend `MlDetectionRequest`)

```json
{
  "event_id": "evt-20260910-000001",
  "event_type": "vehicle_detection",
  "camera_id": "CAM-007",
  "timestamp": "2026-09-10T20:45:30",
  "local_track_id": 42,
  "vehicle": { "type": "car", "type_confidence": 0.96 },
  "plate":   { "text": "WB12AB1234", "confidence": 0.91, "format_valid": true },
  "speed":   { "value_kmh": 47.5, "estimated": true, "direction": "NORTH" }
}
```

Notes:
- `event_id` is auto-incremented (`evt-<yyyyMMdd>-<6-digit>`).
- `timestamp` follows the example (no timezone/fractional seconds). Set
  `timestamp_base` to a "YYYY-MM-DDTHH:MM:SS" start time to simulate a real wall clock
  from `timestamp_base + video time`; otherwise "now" is used.
- Confidences are 0-1. `plate.confidence` is the heuristic score from
  `plate_logic.score_text` **clamped** to [0,1] (the raw score includes grammar bonuses
  and can exceed 1). `format_valid` = grammar-ok.
- `speed.estimated` defaults `true` (calibration-based). Set `speed_estimated=False` if
  the backend requires the literal value from the example.

## Tracking backends (balance for SIH demo + final implementation)

`tracking_adapter.get_tracker(cfg)`:

- `tracker_kind="center"` (default): center-point tracker ported from the teammate's
  `tracker.py`, threshold configurable (`center_threshold`, default 35 px). Cheap, proven
  on the demo clip, no dependencies.
- `tracker_kind="bytetrack"`: `ultralytics.trackers.byte_tracker.BYTETracker` (Kalman +
  IoU), geared toward the final implementation. Requires `ultralytics`. If it fails to
  import or update, it warns once and falls back to the center tracker so notebooks keep
  running.

## Known limits (demo semantics)

- Speed assumes the measured segment's real-world length (`distance_meters`); pick line
  positions and calibrate that constant per camera for meaningful km/h.
- The center-point tracker may swap IDs when vehicles cross; acceptable for the demo.
- One event per completed crossing and plate read — a video with unreadable plates will
  produce few/no events; see `docs/TROUBLESHOOTING.md`.