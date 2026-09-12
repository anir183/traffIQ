# SIH traffIQ — Model Pipeline Audit

Audit of the existing AI codebase at `ai/`, done before building the integrated
Colab pipeline in `implementation/`.

## Models inventory

| File | Format | Role | Notes |
|------|--------|------|-------|
| `ai/models/best.pt` | YOLO26m (ultralytics) | Number-plate detector | Single class `number_plate`. Loaded via `ultralytics.YOLO`. Does **not** read characters. |
| `ai/models/char.pt` | yolov5 | Character detector | 36 classes (`0-9`, `a-z`), 128x128 canvas. Detect + order only; **not** a text matcher. Runs independently on raw crops and on LPSR-enhanced crops. |
| `ai/models/lpsr_best.pth` | torch checkpoint | Low-resolution plate restoration | In `ai/src/lpsr.py`. Resizes crop to 192x32, autoencoder+RDN+CSAR, outputs 1-channel grayscale back to BGR. |
| `ai/third_party/ref_repo/weights/object.pt` | yolov5 | COCO-style vehicle detector | Vendored reference model; names = COCO 80 classes (car, truck, bus, motorcycle...). |
| `ai/models/lpsr_best.pth` | (see LPSR row) | | |
| TrOCR `microsoft/trocr-base-printed` | HuggingFace | Fallback whole-plate OCR | ~550 MB first download; needs `transformers`. `ai/requirements.txt` is **missing** `transformers`. |

## Pipeline facts (verified against source)

- `ai/src/plate_logic.py`: `score_text(text, confidence)` returns a **heuristic** score = mean
  character confidence + bonuses (+3 if length 7-10, +4 if Indian state code, +8 if grammar
  matches `LLDDDDDD` / `LLDDLDDDD` / `LLDDLLDDDD`). This is **not an accuracy metric**.
  `conservative_fix` only context-corrects OCR confusions, never inserts characters.
- `ai/src/pipeline.py::PlateRecognizer.recognize(plate_bgr)` runs three branches:
  1. char.pt on the raw crop
  2. char.pt on the LPSR-enhanced crop
  3. TrOCR on the enhanced crop (or raw if enhancement failed)
  Best candidate picked by (grammar_ok, heuristic score).
- `ai/src/temporal.py::TemporalPlateConsensus` does **plate-level** matching across frames
  (IoU >= 0.15 or center <= 0.75*diag, greedy), then exact-string plurality voting.
- `ai/src/character_pipeline.py` uses the vendored ref_repo `Detection` wrapper, which does
  `sys.path.append("./yolov5")` — the working directory must be `ai/third_party/ref_repo`
  when the char/LPSR models are created.

## Import/CWD hazards

- `plate_logic.py` / `character_pipeline.py` / `lpsr.py` / `trocr_fallback.py` do
  `from config import ...` → `ai/` must be on `sys.path`.
- `ref_repo/my_models/detection.py` appends `./yolov5` relative to the CWD → the ref_repo
  dir must be the CWD when loading yolov5-based detectors.
- `object.pt` is **yolov5-format**; it cannot be loaded by `ultralytics.YOLO`. Use the
  ref_repo `Detection` wrapper only.
- The wrappers in `implementation/adapters/` handle both hazards internally
  (`ensure_ai_on_path()` + `os.chdir()` around model construction).

## Gaps that this project fills

- Vehicle detection (object.pt) was never wired into the plate pipeline.
- No vehicle tracker and no speed module existed in `ai/` before `implementation/`.
- The teammate's `tracker.py` (center-point, 35 px threshold) and
  `Speed(up_down).ipynb` (two virtual lines, 10 m apart) provide the validated
  tracking + speed approach that `implementation/` wraps.

## Backend contract

`backend/.../MlDetectionRequest.java` defines the JSON shape (see
`docs/INTEGRATED_PIPELINE.md`). Fields: `event_id`, `event_type`, `camera_id`,
`timestamp`, `local_track_id`, `vehicle{type,type_confidence}`,
`plate{text,confidence,format_valid}`, `speed{value_kmh,estimated,direction}`.
All nested confidences are 0-1 floats; `plate.confidence` is clamped because the
internal heuristic score can exceed 1 due to grammar bonuses.