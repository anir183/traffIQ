import os
import sys
from typing import List

import cv2
import numpy as np
import torch

from pipeline.config import Config

VEHICLE_TYPES = {"car", "truck", "bus", "motorcycle", "motorbike"}


class VehicleDetector:
    """Wrapper around ref_repo object.pt (vendored yolov5, COCO-style classes)."""

    def __init__(self, cfg: Config, conf: float = None):
        self.cfg = cfg
        self.conf_thres = cfg.vehicle_conf if conf is None else conf
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._model = self._load(cfg.vehicle_weights)

    def _import_detection(self):
        prev = os.getcwd()
        self.cfg.ensure_ai_on_path()
        try:
            if str(self.cfg.ref_repo_dir) not in sys.path:
                sys.path.insert(0, self.cfg.ref_repo_dir_str)
            os.chdir(self.cfg.ref_repo_dir_str)
            from my_models.detection import Detection

            return Detection
        finally:
            os.chdir(prev)

    def _load(self, weights_path):
        Detection = self._import_detection()
        return Detection(
            size=[self.cfg.vehicle_size, self.cfg.vehicle_size],
            weights_path=str(weights_path),
            device=self.device,
            iou_thres=self.cfg.vehicle_iou,
            conf_thres=self.conf_thres,
        )

    def detect(self, frame_bgr: np.ndarray) -> List[dict]:
        """Returns [{bbox:(x1,y1,x2,y2), type, type_confidence, conf}] for vehicle classes."""
        results, _ = self._model.detect(frame_bgr, bb_scale=True)
        out = []
        for name, conf_str, box in results:
            name = str(name).strip().lower()
            if name not in VEHICLE_TYPES:
                continue
            vals = [float(v) for v in box]
            if len(vals) != 4:
                continue
            x1, y1, x2, y2 = vals
            x1, x2 = sorted((max(0.0, x1), float(frame_bgr.shape[1])))
            y1, y2 = sorted((max(0.0, y1), float(frame_bgr.shape[0])))
            if x2 <= x1 or y2 <= y1:
                continue
            out.append({
                "bbox": (int(x1), int(y1), int(x2), int(y2)),
                "type": name,
                "type_confidence": float(conf_str),
                "conf": float(conf_str),
            })
        return out