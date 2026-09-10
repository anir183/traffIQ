from typing import Optional
import cv2
import torch
from PIL import Image
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from config import TROCR_MODEL_NAME


class TrOCRFallback:
    def __init__(self, device: Optional[str] = None):
        self.device = torch.device(device or ("cuda" if torch.cuda.is_available() else "cpu"))
        self.processor = TrOCRProcessor.from_pretrained(TROCR_MODEL_NAME)
        self.model = VisionEncoderDecoderModel.from_pretrained(TROCR_MODEL_NAME).to(self.device).eval()

    def read(self, plate_bgr):
        rgb = cv2.cvtColor(plate_bgr, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(rgb)
        pixels = self.processor(images=image, return_tensors="pt").pixel_values.to(self.device)
        with torch.inference_mode():
            ids = self.model.generate(pixels, num_beams=1, max_new_tokens=12)
        return self.processor.batch_decode(ids, skip_special_tokens=True)[0].strip().upper()
