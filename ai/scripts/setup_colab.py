from pathlib import Path
import subprocess, urllib.request

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / 'models'
CLASSES = ROOT / 'classes'
THIRD = ROOT / 'third_party'
MODELS.mkdir(exist_ok=True); CLASSES.mkdir(exist_ok=True); THIRD.mkdir(exist_ok=True)

REPO = 'https://github.com/nhanth301/License-Plate-Detection-and-Recognition-with-Image-Enhancement.git'
REF = THIRD / 'ref_repo'
if not REF.exists():
    subprocess.run(['git','clone','--depth','1',REPO,str(REF)], check=True)

assets = {
 'lpsr_best.pth': 'https://raw.githubusercontent.com/nhanth301/License-Plate-Detection-and-Recognition-with-Image-Enhancement/main/weights/best_model.pth',
 'char.pt': 'https://raw.githubusercontent.com/nhanth301/License-Plate-Detection-and-Recognition-with-Image-Enhancement/main/weights/char.pt',
}
for name,url in assets.items():
    dest = MODELS/name
    if not dest.exists():
        print('Downloading', name)
        urllib.request.urlretrieve(url, dest)

cls = CLASSES/'ocr_class_names.txt'
if not cls.exists():
    urllib.request.urlretrieve('https://raw.githubusercontent.com/nhanth301/License-Plate-Detection-and-Recognition-with-Image-Enhancement/main/yolo_classes/ocr_class_names.txt', cls)

print('\nSETUP COMPLETE')
print('Required user upload: models/best.pt')
print('Dataset location: data/')
print('Reference repo:', REF)
print('Models:', list(MODELS.iterdir()))
print('Classes:', cls)
