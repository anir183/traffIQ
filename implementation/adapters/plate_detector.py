from typing import List

import cv2
import numpy as np

from pipeline.config import Config


class PlateDetector:
    """Wrapper around best.pt (ultralytics YOLO26m, class number_plate)."""

    def __init__(self, cfg: Config, conf: float = None):
        from ultralytics import YOLO

        self.cfg = cfg
        self.conf = cfg.plate_det_conf if conf is None else conf
        self.model = YOLO(str(cfg.plate_weights))
        self.names = self.model.names

    def detect(self, frame_bgr: np.ndarray) -> List[dict]:
        results = self.model.predict(frame_bgr, conf=self.conf, verbose=False)
        out = []
        for r in results:
            for b in r.boxes:
                x1, y1, x2, y2 = (int(v) for v in b.xyxy[0].tolist())
                conf = float(b.conf[0])
                out.append({"bbox": (x1, y1, x2, y2), "confidence": conf})
        return out

    def crop(self, frame_bgr: np.ndarray, bbox) -> np.ndarray:
        h, w = frame_bgr.shape[:2]
        x1, y1, x2, y2 = bbox
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        return frame_bgr[y1:y2, x1:x2]