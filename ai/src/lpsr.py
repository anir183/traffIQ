import sys
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import torch
from PIL import Image
import torchvision.transforms as T

from config import REF_REPO_DIR, LPSR_WEIGHTS, SR_W, SR_H

if str(REF_REPO_DIR) not in sys.path:
    sys.path.insert(0, str(REF_REPO_DIR))


class LPSRRestorer:
    """Loads the reference project's pretrained LPSR implementation."""

    def __init__(self, device: Optional[str] = None):
        from my_models.lpsr import LPSR
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.model = LPSR(
            num_channels=3,
            num_features=32,
            growth_rate=16,
            num_blocks=4,
            num_layers=4,
            scale_factor=None,
            out_channels=1,
        ).to(self.device)
        checkpoint = torch.load(LPSR_WEIGHTS, map_location=self.device)
        state = checkpoint.get("model_state_dict", checkpoint)
        self.model.load_state_dict(state, strict=True)
        self.model.eval()

    def enhance(self, plate_bgr: np.ndarray) -> np.ndarray:
        if plate_bgr is None or plate_bgr.size == 0:
            return plate_bgr
        rgb = cv2.cvtColor(plate_bgr, cv2.COLOR_BGR2RGB)
        pil = Image.fromarray(rgb).resize((SR_W, SR_H), Image.BICUBIC)
        x = T.ToTensor()(pil).unsqueeze(0).to(self.device)
        with torch.inference_mode():
            y = self.model(x).squeeze(0).clamp(0, 1).cpu().numpy()
        # LPSR checkpoint produces a single-channel grayscale image.
        out = (y.squeeze(0) * 255.0).round().astype(np.uint8)

        # Convert grayscale back to BGR so the downstream
        # character detector can receive a 3-channel image.
        return cv2.cvtColor(out, cv2.COLOR_GRAY2BGR)
