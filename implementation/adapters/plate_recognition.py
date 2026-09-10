import os
import sys
from typing import Dict

import cv2
import numpy as np

from pipeline.config import Config
from pipeline.schemas import clamp01


class PlateRecognizerAdapter:
    """Wraps the existing ai/src pipeline (char.pt raw + LPSR-enhanced + TrOCR + grammar fix)."""

    def __init__(self, cfg: Config, use_lpsr=None, use_trocr=None):
        use_lpsr = cfg.use_lpsr if use_lpsr is None else use_lpsr
        use_trocr = cfg.use_trocr if use_trocr is None else use_trocr
        self.cfg = cfg
        cfg.ensure_ai_on_path()
        self._recognizer = None

        # Correct CWD matters: ref_repo's detection.py appends "./yolov5" to sys.path.
        prev = os.getcwd()
        try:
            if str(cfg.ref_repo_dir) not in sys.path:
                sys.path.insert(0, cfg.ref_repo_dir_str)
            os.chdir(cfg.ref_repo_dir_str)
            from src.pipeline import PlateRecognizer

            self._recognizer = PlateRecognizer(use_lpsr=use_lpsr, use_trocr=use_trocr)
        finally:
            os.chdir(prev)

    def recognize(self, plate_bgr: np.ndarray) -> Dict:
        if plate_bgr is None or plate_bgr.size == 0:
            return {"text": "", "confidence": 0.0, "format_valid": False,
                    "score": 0.0, "source": "none"}
        res = self._recognizer.recognize(plate_bgr)
        score = float(res.get("score", 0.0))
        info = res.get("valid", {})
        return {
            "text": str(res.get("final", "")),
            "confidence": clamp01(score / self.cfg.plate_conf_scale),
            "format_valid": bool(info.get("grammar_ok", False)),
            "score": score,
            "source": res.get("source", "none"),
            "raw_char_text": str(res.get("raw_char_text", "")),
            "sr_char_text": str(res.get("sr_char_text", "")),
            "trocr_text": str(res.get("trocr_text", "")),
        }