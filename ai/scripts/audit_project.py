from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from config import *

print('=== ANPR PROJECT AUDIT ===')
for name, path in [('best.pt', PLATE_DETECTOR_WEIGHTS), ('lpsr_best.pth', LPSR_WEIGHTS), ('char.pt', CHAR_WEIGHTS), ('ocr_class_names.txt', CHAR_NAMES)]:
    print(f'{name:20} : {"OK" if path.exists() else "MISSING"}  {path}')
print('reference repo       :', 'OK' if REF_REPO_DIR.exists() else 'MISSING', REF_REPO_DIR)
print('dataset files        :', sum(1 for p in DATA.rglob('*') if p.is_file()))

if not PLATE_DETECTOR_WEIGHTS.exists():
    print('\nACTION: upload your own best.pt to models/best.pt')
