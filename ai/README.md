# ANPR Character Pipeline — Clean Colab Project

## User-provided files
Only these need to be supplied by the user:

- `models/best.pt` — your trained YOLO plate detector
- your dataset under `data/`

## Automatically obtained reference assets
Run `python scripts/setup_colab.py`. It downloads the reference repository code and obtains:

- `models/lpsr_best.pth` — reference LPSR checkpoint (`best_model.pth` renamed)
- `models/char.pt` — reference character detector
- `classes/ocr_class_names.txt` — character class names
- `third_party/ref_repo/` — reference implementation

## Intended architecture

```text
Your best.pt
   ↓
Plate detection
   ↓
Accurate plate crop
   ↓
LPSR (lpsr_best.pth)
   ↓
Character detection (char.pt)
   ↓
Character ordering
   ↓
Indian plate validation
   ↓
Final OCR
```

Do not put the user's `best.pt` inside `third_party/ref_repo/weights/`.

## Colab quick start

```python
%cd /content/anpr_character_pipeline
!pip install -r requirements.txt
!python scripts/setup_colab.py
```

Then upload your own `models/best.pt` and dataset into `data/`.

### Important
The reference character model was trained for the reference project's character vocabulary. It is a baseline component; benchmark it on the user's Indian dataset before treating it as final.
