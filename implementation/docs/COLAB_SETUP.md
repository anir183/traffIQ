# Colab Setup Guide

Goal: run the three notebooks (01-03) inside Google Colab with the repo's models and a
demo video. If you copied/pasted the `.py` code manually (instead of letting notebooks
generate it), see the "run-from-repo" and "run-from-paste" variants below.

## Required inputs (upload to Colab)

| File | Needed by | Notes |
|------|-----------|-------|
| `ai/models/best.pt` | plate detector | ultralytics YOLO26m |
| `ai/models/char.pt` | character detector | yolov5 |
| `ai/models/lpsr_best.pth` | LPSR enhancement | torch checkpoint |
| `ai/classes/ocr_class_names.txt` | char labels | must match `char.pt` class order |
| `ai/third_party/ref_repo/weights/object.pt` | vehicle detector | yolov5 COCO |
| one `.mp4` demo clip | end-to-end (notebook 03) | e.g. the teammate's highway clip |

The `best.pt` / `char.pt` / `object.pt` weights can be read directly from the repo
(`ai/` on Colab) or uploaded to a single folder; `implementation/pipeline/config.py`
resolves everything either way.

## Option A — clone/mount the repo and run

Recommended: put the repo on Drive and mount it, or `git clone` into `/content`.

```
1. Open notebook 00_install_and_setup.ipynb in Colab (Runtime > Run all).
2. In the "REPO LOCATION" cell set REPO_ROOT:
      REPO_ROOT = "/content/traffIQ"          # after git clone
      REPO_ROOT = "/content/drive/MyDrive/traffIQ"  # after Drive mount
3. Set AI_DIR = f"{REPO_ROOT}/ai" and the WEIGHTS_DIR to where models live
   (defaults to the repo's ai/models + ref_repo/weights).
4. The notebook writes the implementation modules (see below), then re-imports them for
   you. Open 01, 02, 03 and run.
```

## Option B — paste `.py` modules manually

If you don't run notebook 00, create the files in Colab by running these
`%%writefile` cells exactly (the contents are embedded in notebook 00):

```
%cd /content
!mkdir -p implementation/adapters implementation/pipeline

%%writefile implementation/pipeline/config.py
# ...paste contents of implementation/pipeline/config.py ...

%%writefile implementation/pipeline/schemas.py
# ...paste contents of implementation/pipeline/schemas.py ...

%%writefile implementation/adapters/tracking_adapter.py
# ...paste contents of implementation/adapters/tracking_adapter.py ...

%%writefile implementation/adapters/speed_adapter.py
%%writefile implementation/adapters/plate_detector.py   (adapters/__init__.py optional)
%%writefile implementation/adapters/plate_recognition.py
%%writefile implementation/adapters/temporal_filter.py
%%writefile implementation/adapters/vehicle_detector.py
%%writefile implementation/pipeline/pipeline.py
%%writefile implementation/pipeline/visualization.py
```

Then, in **every** notebook, first run:

```python
import sys
sys.path.insert(0, "/content/implementation")
import os
os.environ["TRAFFIQ_AI_DIR"] = "/content/traffIQ/ai"   # or your Drive path
```

Which files must be pasted: everything under `implementation/adapters/` and
`implementation/pipeline/` (10 files). The `docs/`, `notebooks/`, `tools/` folders are
just documentation/generation helpers and don't need to be pasted. Notebook 00 embeds
those 10 files automatically, so most users never need to paste anything.

## Notebook order

- **00_install_and_setup.ipynb** — pip installs, repo/weights wiring, writes the 10
  modules, import smoke test.
- **01_component_tests.ipynb** — synthetic + real per-component tests (tracker, speed
  math, detector class/conf shapes, plate crop reading).
- **02_plate_recognition_pipeline.ipynb** — plate detector -> recognizer branches ->
  grammar/state validation -> temporal consensus; table + histogram.
- **03_full_vehicle_anpr_pipeline.ipynb** — full clip -> `events.jsonl` + `events.csv` +
  annotated video; JSON contract check.

## Where outputs land

`Config.output_dir` defaults to `<repo root>/implementation/outputs` (or
`/content/implementation/outputs`). VideoProcessor writes the JSONL/CSV there; set
explicit paths in notebook 03 if preferred.