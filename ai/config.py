from pathlib import Path

ROOT = Path(__file__).resolve().parent
MODELS = ROOT / "models"
DATA = ROOT / "data"
CLASSES = ROOT / "classes"
THIRD_PARTY = ROOT / "third_party"
REF_REPO_DIR = THIRD_PARTY / "ref_repo"
OUTPUTS = ROOT / "outputs"

# User-supplied model
PLATE_DETECTOR_WEIGHTS = MODELS / "best.pt"

# Reference models downloaded by scripts/setup_colab.py
LPSR_WEIGHTS = MODELS / "lpsr_best.pth"
CHAR_WEIGHTS = MODELS / "char.pt"
CHAR_NAMES = CLASSES / "ocr_class_names.txt"

# Reference preprocessing sizes
SR_W, SR_H = 192, 32
CHAR_W, CHAR_H = 128, 128

CHAR_CONF = 0.05
CHAR_IOU = 0.05

TROCR_MODEL_NAME = "microsoft/trocr-base-printed"

# Dataset contains valid 7–10 character examples.
ALLOWED_LENGTHS = set(range(7, 11))

INDIAN_STATE_CODES = {
    "AN","AP","AR","AS","BR","CH","CG","DD","DL","DN","GA","GJ","HP","HR","JH","JK",
    "KA","KL","LA","LD","MH","ML","MN","MP","MZ","NL","OD","OR","PB","PY","RJ","SK",
    "TN","TR","TS","UK","UA","UP","WB"
}
