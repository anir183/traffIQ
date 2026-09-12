# Troubleshooting

Common issues when running the integrated pipeline in Colab.

## 1. yolov5 vs ultralytics import collisions

`object.pt` / `char.pt` load through the vendored reference repo, whose
`my_models/detection.py` does `sys.path.append("./yolov5")` **relative to the CWD**.
`best.pt` loads through `ultralytics.YOLO`.

Symptom: `ModuleNotFoundError: No module named 'models.experimental'` (or a clash with
the wrong `models` package).
Fix: keep the CWD at the reference repo while loading yolov5 models (the adapters do
this automatically via `os.chdir`), and import `ultralytics` before the yolov5 models
run. Don't `pip uninstall` yolov5 inside the ref_repo `yolov5/` directory.

## 2. `from config import ...` failing in `ai/src`

`plate_logic.py`, `character_pipeline.py`, `lpsr.py`, `trocr_fallback.py` import a
top-level module named `config` (i.e. `ai/config.py`). The `ai/` directory must be on
`sys.path`. The adapters call `cfg.ensure_ai_on_path()` — if you import `PlateRecognizer`
directly, do it the same way.

## 3. TrOCR pull (transformers missing)

`ai/requirements.txt` doesn't list `transformers`. The first time `use_trocr=True`, Colab
downloads `microsoft/trocr-base-printed` (~550 MB). If the download fails or you want
fast tests, set `Config(use_trocr=False)`. The pipeline is designed to work without it
(char.pt raw + LPSR branches remain).

## 4. No events / no speed values

- `"vehicle crossed the lines but no plate read yet"` in the log → the vehicle needs a
  read plate for the event to be emitted (backend requires `plate.text` not blank).
  Improve plate crops (`plate_det_conf`, crop margins), or run notebook 02 first to check
  whether the recognizer reads plates at all on your clip.
- `elapsed <= 0`: the same track id re-entered the first line's band; increase
  `rearm_frames`, or pre-tune `line_a_y`/`line_b_y`/`line_offset` to your clip.
- Speeds look wrong: `distance_meters` is a fixed calibration constant — measure the real
  distance between your two lines and set it accordingly.

## 5. Vehicle detector never fires

`object.pt` must be loaded with the ref_repo `Detection` wrapper, **not** `ultralytics.YOLO`
(it's a yolov5 artifact). Typical symptoms: channel/size errors or empty results.
Check the weights path (`cfg.vehicle_weights`) and that `object.pt` exists on Colab.

## 6. Colab: no GPU (silent CPU)

If the runtime is a CPU-only Colab, torch will still run everything on CPU (slow). Start
`Runtime > Change runtime type > Hardware accelerator = GPU` before running notebook 03.

## 7. ByteTrack backend

ByteTrack is the optional tracker (`tracker_kind="bytetrack"`). It depends on
`ultralytics.trackers.byte_tracker` (available with `ultralytics>=8.4`). If it errors at
runtime it logs a one-time warning and falls back to the center-point tracker — the
notebooks still run. If you get persistent ByteTrack errors, keep `tracker_kind="center"`.

## 8. JSON contract mismatch

The emitter writes exactly the `MlDetectionRequest` shape. If the backend rejects it,
compare against `backend/src/.../dto/input/MlDetectionRequest.java`. Remember nested
confidences are 0-1 (plate score is clamped to [0,1]) and `timestamp` has no timezone.
To flip `speed.estimated` to `false`, set `Config(speed_estimated=False)`.