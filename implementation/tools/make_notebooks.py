"""Generate the four Colab notebooks under implementation/notebooks.

Notebook 00 embeds every adapter/pipeline .py module through %%writefile cells, so a user
can run 00 in Colab and never manually paste code. Module files remain the source of truth;
rerun this script after editing them to regenerate the notebooks.

Usage:  python tools/make_notebooks.py
"""
from __future__ import annotations

import json
import json as _json
from pathlib import Path

HERE = Path(__file__).resolve().parent
IMPL = HERE.parent
NOTEBOOKS = IMPL / "notebooks"

MODULES = [
    "adapters/__init__.py",
    "adapters/vehicle_detector.py",
    "adapters/tracking_adapter.py",
    "adapters/speed_adapter.py",
    "adapters/plate_detector.py",
    "adapters/plate_recognition.py",
    "adapters/temporal_filter.py",
    "pipeline/__init__.py",
    "pipeline/config.py",
    "pipeline/schemas.py",
    "pipeline/pipeline.py",
    "pipeline/visualization.py",
]

SETUP = """import os, sys, pathlib

# --- point these at the real locations on Colab -----------------------------
AI_DIR = os.environ.get("TRAFFIQ_AI_DIR", "/content/traffIQ/ai")
WEIGHTS_DIR = os.environ.get("TRAFFIQ_WEIGHTS_DIR", "")

# /content/implementation is where notebook 00 wrote the modules (or your
# cloned/Mounted repo if you prefer to import from there instead).
sys.path.insert(0, "/content/implementation")
os.environ["TRAFFIQ_AI_DIR"] = str(AI_DIR)

from pipeline.config import Config, colab_config

if WEIGHTS_DIR:
    cfg = colab_config(weights_dir=WEIGHTS_DIR, ai_dir=AI_DIR)
else:
    cfg = Config(ai_dir=AI_DIR)
cfg.validate(require_all=False)
print("ai_dir      :", cfg.ai_dir)
print("ref_repo    :", cfg.ref_repo_dir)
print("plate_weights:", cfg.plate_weights)
print("vehicle_weights:", cfg.vehicle_weights)
"""


def _code(source: str):
    out = source.splitlines(keepends=True)
    if out and not out[-1].endswith("\n"):
        out[-1] += "\n"
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": out,
    }


def _md(source: str):
    out = source.splitlines(keepends=True)
    if out and not out[-1].endswith("\n"):
        out[-1] += "\n"
    return {"cell_type": "markdown", "metadata": {}, "source": out}


def _kernel_meta():
    return {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.11"},
    }


def _dump(name: str, cells: list):
    nb = {
        "cells": cells,
        "metadata": _kernel_meta(),
        "nbformat": 4,
        "nbformat_minor": 0,
    }
    out = NOTEBOOKS / name
    out.write_text(_json.dumps(nb, indent=1), encoding="utf-8")
    print("wrote", out)


# ---------------------------------------------------------------------------
def build_00():
    cells = []
    cells.append(_md(
        "# 00 - Install & Setup\n\n"
        "This notebook installs dependencies, tells the pipeline where the repo/models/python "
        "modules live, and **writes the 10 wrapper modules into `/content/implementation`** "
        "using `%%writefile` cells.\n\n"
        "After running this once you never have to paste code manually.\n"
    ))
    cells.append(_md("## 1. Install dependencies"))
    cells.append(_code(
        "!pip install -q ultralytics>=8.4.0 opencv-python pandas numpy matplotlib pillow \"transformers>=4.36\""
    ))
    cells.append(_md("## 2. Repo location\n\n"
                     "Set `REPO_ROOT` to where the traffIQ repo is on Colab (after `git clone` or Drive mount)."))
    cells.append(_code(
        "import os\n"
        "REPO_ROOT = \"/content/traffIQ\"        # after:  !git clone <repo-url> /content/traffIQ\n"
        "# REPO_ROOT = \"/content/drive/MyDrive/traffIQ\"   # after Drive mount\n\n"
        "os.environ[\"TRAFFIQ_AI_DIR\"] = f\"{REPO_ROOT}/ai\"\n"
        "print(\"REPO_ROOT =\", REPO_ROOT)\n"
        "print(\"TRAFFIQ_AI_DIR =\", os.environ[\"TRAFFIQ_AI_DIR\"])\n"
    ))
    cells.append(_md("## 3. (Optional) upload model weights / demo clip\n\n"
                     "If the repo is already on Colab with `ai/models`, `ai/third_party/ref_repo/weights/`, "
                     "and `ai/classes/`, skip this. Otherwise upload the five files listed in "
                     "`docs/COLAB_SETUP.md` into a single folder and set `WEIGHTS_DIR` below."))
    cells.append(_code(
        "# from google.colab import files\n"
        "# files.upload()   # pick best.pt, char.pt, lpsr_best.pth, object.pt, ocr_class_names.txt\n\n"
        "# WEIGHTS_DIR = \"/content/assets\"   # if you uploaded them somewhere\n"
    ))
    cells.append(_md("## 4. Materialise the wrapper modules\n\n"
                     "The cells below write the adapter/pipeline modules. Do not edit them in the notebook — "
                     "edit the real files under `implementation/` in the repo and rerun "
                     "`python tools/make_notebooks.py`."))
    cells.append(_code(
        "!mkdir -p /content/implementation/adapters /content/implementation/pipeline\n"
        "import sys; sys.path.insert(0, \"/content/implementation\")\n"
    ))

    for rel in MODULES:
        src = (IMPL / rel).read_text(encoding="utf-8")
        cells.append(_code(f"%%writefile /content/implementation/{rel}\n" + src))

    cells.append(_md("## 5. Import smoke test"))
    cells.append(_code(
        "from pipeline.config import Config\n"
        "from pipeline.schemas import DetectionEvent, VehicleInfo, PlateInfo, SpeedInfo, EventIdFactory\n"
        "from adapters.tracking_adapter import CenterPointTracker, TrackedBox\n"
        "from adapters.speed_adapter import LineCrossingSpeedEstimator\n"
        "import json\n\n"
        "cfg = Config()\n"
        "tracker = CenterPointTracker(35.0)\n"
        "a = tracker.update([(10, 10, 60, 60)])\n"
        "b = tracker.update([(12, 12, 62, 62)])\n"
        "assert a[0].id == b[0].id, \"tracker lost the ID\"\n\n"
        "speed = LineCrossingSpeedEstimator(cfg)\n"
        "speed.update(TrackedBox(0, 0, 50, 50, 1, 25, cfg.line_a_y), 100, 25.0)\n"
        "ev = speed.update(TrackedBox(0, 0, 50, 50, 1, 25, cfg.line_b_y), 108, 25.0)\n"
        "assert ev is not None and abs(ev[\"value_kmh\"] - 112.5) < 1.0, ev\n\n"
        "evt = DetectionEvent(\n"
        "    event_id=EventIdFactory().next_id(), event_type=\"vehicle_detection\",\n"
        "    camera_id=\"CAM-007\", timestamp=\"2026-09-10T20:45:30\", local_track_id=42,\n"
        "    vehicle=VehicleInfo(\"car\", 0.96), plate=PlateInfo(\"WB12AB1234\", 0.91, True),\n"
        "    speed=SpeedInfo(47.5, True, \"NORTH\"))\n"
        "print(\"SMOKE OK\\n\", json.dumps(evt.to_dict(), indent=2))\n"
    ))
    cells.append(_md("## Next\n\nOpen `01_component_tests.ipynb`, then `02_plate_recognition_pipeline.ipynb`, "
                     "then `03_full_vehicle_anpr_pipeline.ipynb`."))
    _dump("00_install_and_setup.ipynb", cells)


# ---------------------------------------------------------------------------
def build_01():
    cells = []
    cells.append(_md("# 01 - Component Tests\n\nUnit/smoke tests for each adapter. Synthetic checks never need "
                     "weights/video; real-model checks are skipped with a message if files are missing."))
    cells.append(_md("## Setup"))
    cells.append(_code(SETUP))

    cells.append(_md("## Test 1 - CenterPointTracker (ID persistence / reassign / prune)"))
    cells.append(_code(
        "from adapters.tracking_adapter import CenterPointTracker\n"
        "tracker = CenterPointTracker(35.0)\n"
        "t1 = tracker.update([(10, 10, 60, 60)])\n"
        "t2 = tracker.update([(12, 12, 62, 62)])     # near previous -> same ID\n"
        "t3 = tracker.update([(400, 400, 450, 450)]) # far -> new ID\n"
        "assert t1[0].id == t2[0].id, (t1, t2)\n"
        "assert t3[0].id != t2[0].id, (t2, t3)\n"
        "n_centers = len(tracker.center_points)\n"
        "_ = tracker.update([])                      # nothing matched -> prune unused\n"
        "assert len(tracker.center_points) == 0, tracker.center_points\n"
        "print(f\"Test 1 OK: same_id={t2[0].id} new_id={t3[0].id} pruned={n_centers}->{len(tracker.center_points)}\")\n"
    ))

    cells.append(_md("## Test 2 - LineCrossingSpeedEstimator (synthetic, video time)"))
    cells.append(_code(
        "from adapters.tracking_adapter import TrackedBox\n"
        "from adapters.speed_adapter import LineCrossingSpeedEstimator\n\n"
        "# Vehicle crosses line A at frame 100 (t=4.0s) and line B at frame 108 (t=4.32s).\n"
        "# distance 10 m / 0.32 s -> 31.25 m/s -> 112.5 km/h\n"
        "speed = LineCrossingSpeedEstimator(cfg)\n"
        "assert speed.update(TrackedBox(0, 0, 50, 50, 1, 25, cfg.line_a_y), 100, 25.0) is None\n"
        "ev = speed.update(TrackedBox(0, 0, 50, 50, 1, 25, cfg.line_b_y), 108, 25.0)\n"
        "assert ev is not None and ev[\"direction\"] == cfg.direction_ab\n"
        "assert abs(ev[\"value_kmh\"] - 112.5) < 1.0, ev\n"
        "print(f\"Test 2 OK: {ev}\")\n"
    ))

    cells.append(_md("## Test 3 - VehicleDetector on a sample frame (skips if weights/video missing)"))
    cells.append(_code(
        "import cv2, glob\n"
        "VIDEO = glob.glob(\"/content/[Hh]ighway*.mp4\")\n"
        "VIDEO += glob.glob(\"/content/drive/MyDrive/**/[Hh]ighway*.mp4\", recursive=True)\n"
        "sample = None\n"
        "if pathlib.Path(cfg.vehicle_weights).exists() and VIDEO:\n"
        "    cap = cv2.VideoCapture(VIDEO[0]); ok, sample = cap.read(); cap.release()\n"
        "if sample is None:\n"
        "    print(\"Test 3 SKIPPED: need object.pt weights + a highway mp4\")\n"
        "else:\n"
        "    from adapters.vehicle_detector import VehicleDetector\n"
        "    det = VehicleDetector(cfg)\n"
        "    vehicles = det.detect(sample)\n"
        "    assert isinstance(vehicles, list)\n"
        "    for v in vehicles:\n"
        "        assert set(v) >= {\"bbox\", \"type\", \"type_confidence\"}\n"
        "        assert len(v[\"bbox\"]) == 4 and 0.0 <= v[\"type_confidence\"] <= 1.0\n"
        "    print(f\"Test 3 OK: {len(vehicles)} vehicles in first frame in {VIDEO[0]}\")\n"
    ))

    cells.append(_md("## Test 4 - PlateDetector + PlateRecognizer on a plate crop (skips if weights/video missing)"))
    cells.append(_code(
        "if sample is None:\n"
        "    print(\"Test 4 SKIPPED (no sample frame)\")\n"
        "else:\n"
        "    from adapters.plate_detector import PlateDetector\n"
        "    from adapters.plate_recognition import PlateRecognizerAdapter\n"
        "    pd_ = PlateDetector(cfg)\n"
        "    pr_ = PlateRecognizerAdapter(cfg)\n"
        "    plates = pd_.detect(sample)\n"
        "    print(f\"plates detected: {len(plates)}\")\n"
        "    for p in plates[:3]:\n"
        "        crop = pd_.crop(sample, p[\"bbox\"])\n"
        "        rec = pr_.recognize(crop)\n"
        "        assert \"text\" in rec and \"format_valid\" in rec and \"confidence\" in rec\n"
        "        print(\"plate:\", p[\"bbox\"], \"->\", rec)\n"
    ))

    cells.append(_md("## Test 5 - JSON contract (exact backend shape)"))
    cells.append(_code(
        "from pipeline.schemas import DetectionEvent, VehicleInfo, PlateInfo, SpeedInfo, EventIdFactory, make_timestamp\n"
        "import json\n"
        "evt = DetectionEvent(\n"
        "    event_id=EventIdFactory().next_id(), event_type=cfg.event_type, camera_id=cfg.camera_id,\n"
        "    timestamp=make_timestamp(\"2026-09-10T20:45:00\", 30.0), local_track_id=42,\n"
        "    vehicle=VehicleInfo(\"car\", 0.96), plate=PlateInfo(\"WB12AB1234\", 0.91, True),\n"
        "    speed=SpeedInfo(47.5, True, \"NORTH\"))\n"
        "d = evt.to_dict()\n"
        "expected = {\"event_id\", \"event_type\", \"camera_id\", \"timestamp\", \"local_track_id\",\n"
        "            \"vehicle\", \"plate\", \"speed\"}\n"
        "assert set(d) == expected, set(d)\n"
        "assert set(d[\"vehicle\"]) == {\"type\", \"type_confidence\"}\n"
        "assert set(d[\"plate\"]) == {\"text\", \"confidence\", \"format_valid\"}\n"
        "assert set(d[\"speed\"]) == {\"value_kmh\", \"estimated\", \"direction\"}\n"
        "assert \"Z\" not in d[\"timestamp\"]\n"
        "print(\"Test 5 OK:\\n\", json.dumps(d, indent=2))\n"
    ))
    cells.append(_md("All tests passed if no assertion failed."))
    _dump("01_component_tests.ipynb", cells)


# ---------------------------------------------------------------------------
def build_02():
    cells = []
    cells.append(_md("# 02 - Plate Recognition Pipeline\n\n"
                     "Plate detection (`best.pt`) -> `PlateRecognizer` (char.pt raw + LPSR-enhanced + TrOCR) "
                     "-> grammar/state validation -> temporal consensus across frames. Reads plates from the "
                     "first demo video found, or from any JPEG in `/content`."))
    cells.append(_md("## Setup"))
    cells.append(_code(SETUP))
    cells.append(_code(
        "import cv2, glob, pathlib\n"
        "from adapters.plate_detector import PlateDetector\n"
        "from adapters.plate_recognition import PlateRecognizerAdapter\n"
        "from adapters.temporal_filter import TemporalPlateFilter\n\n"
        "plate_det = PlateDetector(cfg)\n"
        "rec = PlateRecognizerAdapter(cfg)\n"
        "temporal = TemporalPlateFilter(cfg)\n"
    ))

    cells.append(_md("## 1. Collect plates from a short burst of frames"))
    cells.append(_code(
        "VIDEO = glob.glob(\"/content/[Hh]ighway*.mp4\") or glob.glob(\"/content/**/[Hh]ighway*.mp4\", recursive=True)\n"
        "IMAGES = glob.glob(\"/content/**/*.jpg\", recursive=True) + glob.glob(\"/content/**/*.png\", recursive=True)\n"
        "frames = []\n"
        "if IMAGES:\n"
        "    frames = [(i, cv2.imread(IMAGES[0])) for i in [0]]\n"
        "elif VIDEO:\n"
        "    cap = cv2.VideoCapture(VIDEO[0])\n"
        "    want = 15\n"
        "    n = 0\n"
        "    while n < want:\n"
        "        ok, f = cap.read()\n"
        "        if not ok:\n"
        "            break\n"
        "        if n % 1 == 0 or True:\n"
        "            if n % (want // 3 or 1) == 0:\n"
        "                frames.append((cap.get(cv2.CAP_PROP_POS_FRAMES), f))\n"
        "        n += 1\n"
        "    cap.release()\n"
        "print(\"using\", len(frames), \"frames from\", (VIDEO if VIDEO else IMAGES)[:1])\n"
    ))

    cells.append(_md("## 2. Detect + recognize + vote"))
    cells.append(_code(
        "import pandas as pd\n"
        "rows, burstdets = [], []\n"
        "for frame_no, frame in frames:\n"
        "    dets = []\n"
        "    for p in plate_det.detect(frame):\n"
        "        crop = plate_det.crop(frame, p[\"bbox\"])\n"
        "        if crop.size == 0:\n"
        "            continue\n"
        "        r = rec.recognize(crop)\n"
        "        dets.append({\"bbox\": p[\"bbox\"], \"text\": r[\"text\"], \"score\": r[\"score\"],\n"
        "                     \"source\": r[\"source\"]})\n"
        "        rows.append({\"frame\": int(frame_no), \"bbox\": p[\"bbox\"], \"text\": r[\"text\"],\n"
        "                     \"confidence\": r[\"confidence\"], \"format_valid\": r[\"format_valid\"],\n"
        "                     \"source\": r[\"source\"], \"raw\": r[\"raw_char_text\"],\n"
        "                     \"sr\": r[\"sr_char_text\"], \"trocr\": r[\"trocr_text\"]})\n"
        "    burstdets.extend(temporal.update(dets))\n"
        "df = pd.DataFrame(rows)\n"
        "print(f\"{len(df)} plate detections\")\n"
        "df.head(10)\n"
    ))

    cells.append(_md("## 3. Stats: read rate / grammar validity"))
    cells.append(_code(
        "if not df.empty:\n"
        "    read = df[df.text != \"\"]\n"
        "    print(\"detections            :\", len(df))\n"
        "    print(\"non-empty reads       :\", len(read))\n"
        "    print(\"grammar-valid reads   :\", int(read.format_valid.sum()))\n"
        "    print(\"unique texts          :\", read.text.nunique())\n"
        "    print(read.source.value_counts().to_dict())\n"
        "    read[[\"text\", \"confidence\", \"format_valid\", \"source\"]].head(15)\n"
    ))

    cells.append(_md("## 4. Confidence histogram"))
    cells.append(_code(
        "import matplotlib.pyplot as plt\n"
        "if not df.empty:\n"
        "    read = df[df.text != \"\"]\n"
        "    ax = read.confidence.plot.hist(bins=20, title=\"Plate confidence (heuristic, clamped 0-1)\")\n"
        "    ax.set_xlabel(\"confidence\"); ax.set_ylabel(\"count\")\n"
        "    plt.show()\n"
        "else:\n"
        "    print(\"no plate detections to plot\")\n"
    ))

    cells.append(_md("## 5. Temporal consensus on a per-plate burst"))
    cells.append(_code(
        "from collections import Counter\n"
        "texts = [d.get(\"consensus_text\") or \"\" for d in burstdets if d.get(\"consensus_text\")]\n"
        "if texts:\n"
        "    print(\"consensus texts per plate-box track:\", Counter(texts))\n"
        "else:\n"
        "    print(\"no consensus texts on this burst (no repeated tracked plate)\")\n"
    ))
    _dump("02_plate_recognition_pipeline.ipynb", cells)


# ---------------------------------------------------------------------------
def build_03():
    cells = []
    cells.append(_md("# 03 - Full Vehicle + ANPR Pipeline\n\n"
                     "End-to-end over a video: vehicle detect -> track -> plate recognize -> temporal vote -> "
                     "speed via two virtual lines -> events in the backend JSON contract -> annotated video + "
                     "JSONL/CSV."))
    cells.append(_md("## Setup"))
    cells.append(_code(SETUP))
    cells.append(_md("## 1. Choose the demo clip + camera calibration"))
    cells.append(_code(
        "import glob\n"
        "VIDEO = glob.glob(\"/content/[Hh]ighway*.mp4\")\n"
        "VIDEO += glob.glob(\"/content/drive/MyDrive/**/[Hh]ighway*.mp4\", recursive=True)\n"
        "assert VIDEO, \"drop a highway mp4 into /content first\"\n"
        "video_path = VIDEO[0]\n"
        "print(\"video:\", video_path)\n\n"
        "# Calibration per camera (edit for your clip):\n"
        "cfg.line_a_y = 198\n"
        "cfg.line_b_y = 268\n"
        "cfg.line_offset = 6\n"
        "cfg.distance_meters = 10.0\n"
        "cfg.direction_ab = \"NORTH\"   # crossing A->B\n"
        "cfg.direction_ba = \"SOUTH\"   # crossing B->A\n"
        "cfg.camera_id = \"CAM-007\"\n"
        "cfg.speed_estimated = True\n"
        "print(\"calibration set\")\n"
    ))

    cells.append(_md("## 2. Build the pipeline"))
    cells.append(_code(
        "from pipeline.pipeline import DetectionPipeline, VideoProcessor\n"
    ))

    cells.append(_md("## 3. Run the video"))
    cells.append(_code(
        "import os, pathlib\n"
        "out_dir = pathlib.Path(\"/content/outputs\")\n"
        "out_dir.mkdir(exist_ok=True)\n"
        "cfg.output_dir = out_dir\n"
        "vp = VideoProcessor(cfg)\n"
        "events = vp.run(\n"
        "    video_path,\n"
        "    output_video=str(out_dir / \"annotated.mp4\"),\n"
        "    jsonl_out=str(out_dir / \"events.jsonl\"),\n"
        "    csv_out=str(out_dir / \"events.csv\"),\n"
        "    slice_frames=None,   # e.g. 400 to test quickly\n"
        ")\n"
        "print(\"events:\", len(events))\n"
    ))

    cells.append(_md("## 4. Inspect the emitted events"))
    cells.append(_code(
        "import json\n"
        "for e in events[:5]:\n"
        "    print(json.dumps(e, indent=2))\n"
        "print(\"...\\nTOTAL EVENTS:\", len(events))\n"
    ))

    cells.append(_md("## 5. Contract + summary metrics"))
    cells.append(_code(
        "import pandas as pd\n"
        "from collections import Counter\n"
        "df = pd.read_csv(str(out_dir / \"events.csv\")) if events else pd.DataFrame()\n"
        "if not df.empty:\n"
        "    print(\"directions:\", Counter(df.speed_direction).most_common())\n"
        "    print(\"speed km/h  : min/max/mean =\", round(df.speed_kmh.min(),1),\n"
        "          round(df.speed_kmh.max(),1), round(df.speed_kmh.mean(),1))\n"
        "    print(\"plate formats valid:\", int(df.plate_format_valid.sum()), \"/\", len(df))\n"
        "    print(df[[\"event_id\", \"local_track_id\", \"vehicle_type\", \"plate_text\", \"speed_kmh\", \"speed_direction\"]].head(10))\n"
        "else:\n"
        "    print(\"No events - see docs/TROUBLESHOOTING.md section 4.\")\n"
    ))

    cells.append(_md("## 6. Annotated video preview"))
    cells.append(_code(
        "from IPython.display import Video\n"
        "if pathlib.Path(str(out_dir / \"annotated.mp4\")).exists():\n"
        "    Video(str(out_dir / \"annotated.mp4\"), width=720)\n"
    ))
    _dump("03_full_vehicle_anpr_pipeline.ipynb", cells)


if __name__ == "__main__":
    NOTEBOOKS.mkdir(parents=True, exist_ok=True)
    build_00()
    build_01()
    build_02()
    build_03()
    print("done")