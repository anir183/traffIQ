from pathlib import Path
from typing import Optional, Dict

import cv2
import numpy as np

from .character_pipeline import ReferenceCharacterDetector, order_characters
from .lpsr import LPSRRestorer
from .plate_logic import score_text, conservative_fix


class PlateRecognizer:
    def __init__(self, use_lpsr=True, use_trocr=True):
        self.char = ReferenceCharacterDetector()
        self.lpsr = LPSRRestorer() if use_lpsr else None
        self.trocr = None
        if use_trocr:
            try:
                from .trocr_fallback import TrOCRFallback
                self.trocr = TrOCRFallback()
            except Exception as e:
                print(f"[WARN] TrOCR disabled: {e}")

    def _char_branch(self, image):
        chars = self.char.detect(image)
        ordered = order_characters(chars)
        return ordered

    def recognize(self, plate_bgr: np.ndarray) -> Dict:
        raw_info = self._char_branch(plate_bgr)
        raw_text, raw_score, raw_valid = score_text(raw_info["text"], raw_info["mean_conf"])

        sr_info = None
        sr_text = ""
        sr_score = -1e9
        sr_valid = {}
        sr_img = None
        if self.lpsr is not None:
            try:
                sr_img = self.lpsr.enhance(plate_bgr)
                sr_info = self._char_branch(sr_img)
                sr_text, sr_score, sr_valid = score_text(sr_info["text"], sr_info["mean_conf"])
            except Exception as e:
                print(f"[WARN] LPSR branch failed: {e}")

        trocr_text = ""
        trocr_score = -1e9
        trocr_valid = {}
        if self.trocr is not None:
            try:
                trocr_raw = self.trocr.read(sr_img if sr_img is not None else plate_bgr)
                trocr_text, trocr_score, trocr_valid = score_text(trocr_raw, 0.0)
            except Exception as e:
                print(f"[WARN] TrOCR branch failed: {e}")

        candidates = []
        if raw_info["n_chars"] > 0:
            candidates.append((raw_text, raw_score, "char_raw", raw_info))
        if sr_info is not None and sr_info["n_chars"] > 0:
            candidates.append((sr_text, sr_score, "char_sr", sr_info))
        if trocr_text:
            candidates.append((trocr_text, trocr_score, "trocr", None))

        # Prefer valid grammar, then character detector evidence, then score.
        candidates.sort(key=lambda x: (
            bool(score_text(x[0], 0.0)[2]["grammar_ok"]),
            x[1],
        ), reverse=True)
        if candidates:
            final_text, final_score, source, final_info = candidates[0]
        else:
            final_text, final_score, source, final_info = "", 0.0, "none", None

        return {
            "final": conservative_fix(final_text),
            "source": source,
            "score": float(final_score),
            "raw_char_text": raw_text,
            "sr_char_text": sr_text,
            "trocr_text": trocr_text,
            "raw_char_info": raw_info,
            "sr_char_info": sr_info,
            "sr_image": sr_img,
            "valid": score_text(final_text, 0.0)[2],
        }
