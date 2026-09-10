import sys
from dataclasses import dataclass
from typing import List, Dict

import cv2
import numpy as np

from config import REF_REPO_DIR, CHAR_WEIGHTS, CHAR_NAMES, CHAR_CONF, CHAR_IOU, CHAR_W, CHAR_H

if str(REF_REPO_DIR) not in sys.path:
    sys.path.insert(0, str(REF_REPO_DIR))


@dataclass
class Character:
    label: str
    conf: float
    x1: float
    y1: float
    x2: float
    y2: float

    @property
    def cx(self): return 0.5 * (self.x1 + self.x2)
    @property
    def cy(self): return 0.5 * (self.y1 + self.y2)
    @property
    def h(self): return max(1.0, self.y2 - self.y1)


def _reference_char_detector():
    from my_models.detection import Detection
    return Detection(
        size=[CHAR_H, CHAR_W],
        weights_path=str(CHAR_WEIGHTS),
        device="cuda" if __import__("torch").cuda.is_available() else "cpu",
        iou_thres=CHAR_IOU,
        conf_thres=CHAR_CONF,
    )


class ReferenceCharacterDetector:
    def __init__(self):
        self.model = _reference_char_detector()
        self.names = [x.strip() for x in open(CHAR_NAMES, encoding="utf-8") if x.strip()]

    def detect(self, image_bgr: np.ndarray) -> List[Character]:
        # The reference detector returns boxes in XYXY form. bb_scale=True
        # maps its 128x128 detection canvas back to the supplied image size.
        results, _ = self.model.detect(image_bgr, bb_scale=True, agnostic_nms=False)
        out = []
        for label, conf, box in results:
            vals = [float(v) for v in box]
            if len(vals) != 4:
                continue
            x1, y1, x2, y2 = vals
            h, w = image_bgr.shape[:2]
            x1, x2 = sorted((max(0.0, x1), min(float(w), x2)))
            y1, y2 = sorted((max(0.0, y1), min(float(h), y2)))
            if x2 <= x1 or y2 <= y1:
                continue
            out.append(Character(str(label).upper(), float(conf), x1, y1, x2, y2))
        return out


def _iou(a, b):
    ix1, iy1 = max(a.x1,b.x1), max(a.y1,b.y1)
    ix2, iy2 = min(a.x2,b.x2), min(a.y2,b.y2)
    inter = max(0, ix2-ix1) * max(0, iy2-iy1)
    aa = max(1,(a.x2-a.x1)*(a.y2-a.y1)); ab = max(1,(b.x2-b.x1)*(b.y2-b.y1))
    return inter / (aa+ab-inter)


def _deduplicate(chars):
    kept=[]
    for c in sorted(chars, key=lambda x:x.conf, reverse=True):
        if any(_iou(c,k) > 0.35 or ((c.cx-k.cx)**2+(c.cy-k.cy)**2)**0.5 < 0.15*max(c.h,k.h) for k in kept):
            continue
        kept.append(c)
    return kept


def _row_cluster(chars):
    if not chars: return []
    med_h = float(np.median([c.h for c in chars]))
    threshold = max(6.0, 0.55*med_h)
    rows=[]
    for c in sorted(chars, key=lambda x:x.cy):
        for row in rows:
            if abs(c.cy - float(np.mean([r.cy for r in row]))) <= threshold:
                row.append(c); break
        else:
            rows.append([c])
    return [sorted(r,key=lambda x:x.cx) for r in rows]


def order_characters(chars: List[Character]) -> Dict:
    chars = _deduplicate(chars)
    rows = _row_cluster(chars)
    rows.sort(key=lambda r: float(np.mean([x.cy for x in r])) if r else 0)
    if len(rows) > 2:
        rows = sorted(rows,key=len,reverse=True)[:2]
        rows.sort(key=lambda r: float(np.mean([x.cy for x in r])))
    text = ''.join(c.label for row in rows for c in row)
    return {
        'characters':[c.__dict__ for row in rows for c in row],
        'rows':[[c.__dict__ for c in row] for row in rows],
        'text':text,
        'layout':'two' if len(rows)==2 else 'single' if len(rows)==1 else 'unknown',
        'mean_conf':float(np.mean([c.conf for c in chars])) if chars else 0.0,
        'n_chars':len(chars),
    }
