import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional


def default_ai_dir() -> Path:
    """Prefer TRAFFIQ_AI_DIR env var, else the repo's ai/ dir next to this file, else a Colab clone path."""
    env = os.environ.get("TRAFFIQ_AI_DIR")
    if env:
        return Path(env).resolve()
    p = Path(__file__).resolve().parent.parent.parent / "ai"
    if p.exists():
        return p.resolve()
    return Path("/content/traffIQ/ai").resolve()


@dataclass
class Config:
    # ---- directories -------------------------------------------------
    ai_dir: Path = field(default_factory=default_ai_dir)
    ref_repo_dir: Path = None  # ai/third_party/ref_repo
    # ---- model weights ----------------------------------------------
    plate_weights: Path = None     # best.pt  (YOLO26m number-plate detector, ultralytics)
    char_weights: Path = None      # char.pt  (yolov5 character detector)
    lpsr_weights: Path = None      # lpsr_best.pth
    char_names: Path = None        # classes/ocr_class_names.txt
    vehicle_weights: Path = None   # object.pt (yolov5 COCO-style detector)
    # ---- recognition toggles ----------------------------------------
    use_lpsr: bool = True
    use_trocr: bool = True
    # ---- detector thresholds ----------------------------------------
    plate_det_conf: float = 0.25
    vehicle_conf: float = 0.25
    vehicle_iou: float = 0.45
    vehicle_size: int = 640
    # ---- tracking ----------------------------------------------------
    tracker_kind: str = "center"                # "center" (default) | "bytetrack"
    center_threshold: float = 35.0              # px distance for center-point tracker
    bytetrack_buffer: int = 30
    bytetrack_match_thresh: float = 0.8
    bytetrack_min_box_area: int = 100
    # ---- speed (two virtual lines) -----------------------------------
    line_a_y: int = 198                         # first line y (px, image space)
    line_b_y: int = 268                         # second line y (px)
    line_offset: int = 6                        # band half-height around each line
    distance_meters: float = 10.0               # real-world distance between the lines
    speed_estimated: bool = True                # calibration-based estimate -> JSON "estimated"
    direction_ab: str = "NORTH"                 # compass string when crossing A->B
    direction_ba: str = "SOUTH"                 # compass string when crossing B->A
    rearm_frames: int = 30                      # min frames between two events for one track id
    prune_missed: int = 45                      # forget speed state after N unseen frames
    # ---- event contract ---------------------------------------------
    camera_id: str = "CAM-007"
    event_type: str = "vehicle_detection"
    event_prefix: str = "evt"
    timestamp_base: Optional[str] = None        # "YYYY-MM-DDTHH:MM:SS" start-of-video, else "now"
    # ---- plate confidence normalization ------------------------------
    # score from plate_logic is mean char conf + grammar/state bonuses,
    # roughly bounded above by plate_conf_scale; we clamp to [0,1] for the contract.
    plate_conf_scale: float = 16.0
    # ---- temporal plate consensus -----------------------------------
    temporal_max_missed: int = 8
    temporal_match_iou: float = 0.15
    temporal_max_center_ratio: float = 0.75
    # ---- io ----------------------------------------------------------
    output_dir: Path = None

    def __post_init__(self):
        ai = Path(self.ai_dir)
        self.ai_dir = ai.resolve()
        if self.ref_repo_dir is None:
            self.ref_repo_dir = (self.ai_dir / "third_party" / "ref_repo").resolve()
        else:
            self.ref_repo_dir = Path(self.ref_repo_dir).resolve()
        if self.plate_weights is None:
            self.plate_weights = (self.ai_dir / "models" / "best.pt").as_posix()
        if self.char_weights is None:
            self.char_weights = (self.ai_dir / "models" / "char.pt").as_posix()
        if self.lpsr_weights is None:
            self.lpsr_weights = (self.ai_dir / "models" / "lpsr_best.pth").as_posix()
        if self.char_names is None:
            self.char_names = (self.ai_dir / "classes" / "ocr_class_names.txt").as_posix()
        if self.vehicle_weights is None:
            self.vehicle_weights = (self.ref_repo_dir / "weights" / "object.pt").as_posix()
        if self.output_dir is None:
            self.output_dir = (Path(self.ai_dir).parent / "implementation" / "outputs").resolve()
        else:
            self.output_dir = Path(self.output_dir).resolve()
        binary_fields = ["plate_weights", "char_weights", "lpsr_weights", "vehicle_weights", "char_names"]
        for name in binary_fields:
            p = Path(getattr(self, name))
            if not p.suffix:
                setattr(self, name, p.as_posix())
        self.ref_repo_dir_str = str(self.ref_repo_dir)
        self.ai_dir_str = str(self.ai_dir)

    def ensure_ai_on_path(self):
        if self.ai_dir_str not in sys.path:
            sys.path.insert(0, self.ai_dir_str)

    def validate(self, require_all=True):
        missing = [p for label, p in [
            ("plate_weights", self.plate_weights),
            ("char_weights", self.char_weights),
            ("lpsr_weights", self.lpsr_weights),
            ("char_names", self.char_names),
            ("vehicle_weights", self.vehicle_weights),
        ] if not Path(p).exists()]
        if missing:
            msg = "Missing model files: " + ", ".join(missing)
            if require_all:
                raise FileNotFoundError(msg)
            print("[WARN]", msg)
        return self


def colab_config(weights_dir="/content/assets", ai_dir="/content/traffIQ/ai",
                 camera_id="CAM-007", **overrides) -> Config:
    """Build a Config assuming the four model files were uploaded to weights_dir."""
    kw = dict(
        ai_dir=ai_dir,
        plate_weights=str(Path(weights_dir) / "best.pt"),
        char_weights=str(Path(weights_dir) / "char.pt"),
        lpsr_weights=str(Path(weights_dir) / "lpsr_best.pth"),
        vehicle_weights=str(Path(weights_dir) / "object.pt"),
        char_names=str(Path(weights_dir) / "ocr_class_names.txt"),
        camera_id=camera_id,
    )
    kw.update(overrides)
    return Config(**kw)