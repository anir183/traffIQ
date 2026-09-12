import math
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Union

from pipeline.config import Config


@dataclass
class TrackedBox:
    x1: int
    y1: int
    x2: int
    y2: int
    id: int
    cx: float = 0.0
    cy: float = 0.0
    type: str = "car"
    type_confidence: float = 0.0
    meta: dict = field(default_factory=dict)


Det = Union[Tuple[int, int, int, int], List, dict]


def _normalize_det(det: Det) -> Tuple[Tuple[int, int, int, int], dict]:
    if isinstance(det, dict):
        b = tuple(int(v) for v in det.get("bbox"))
        meta = dict(det)
        meta.pop("bbox", None)
        return b, meta
    b = tuple(int(v) for v in det[:4])
    return b, {}


class CenterPointTracker:
    """Center-point tracker (port of teammate's tracker.py) with configurable threshold."""

    def __init__(self, threshold: float = 35.0):
        self.threshold = float(threshold)
        self.center_points: Dict[int, Tuple[float, float]] = {}
        self.id_count = 0

    def reset(self):
        self.center_points.clear()
        self.id_count = 0

    def update(self, detections: List[Det]) -> List[TrackedBox]:
        tracked = []
        used_ids = set()
        for det in detections:
            (x1, y1, x2, y2), meta = _normalize_det(det)
            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0
            matched_id = None
            for tid, (px, py) in self.center_points.items():
                d = math.hypot(cx - px, cy - py)
                if d < self.threshold:
                    matched_id = tid
                    break
            if matched_id is None:
                matched_id = self.id_count
                self.id_count += 1
            self.center_points[matched_id] = (cx, cy)
            used_ids.add(matched_id)
            tracked.append(TrackedBox(
                x1=x1, y1=y1, x2=x2, y2=y2, id=matched_id, cx=cx, cy=cy,
                type=str(meta.get("type", "car")),
                type_confidence=float(meta.get("type_confidence", meta.get("conf", 0.0))),
                meta=meta,
            ))
        for tid in [t for t in self.center_points if t not in used_ids]:
            del self.center_points[tid]
        return tracked


class ByteTrackAdapter:
    """Optional ByteTrack backend (ultralytics). Falls back to center tracker on any error."""

    def __init__(self, cfg: Config):
        self.cfg = cfg
        self._warned = False
        self._tracker = None
        try:
            from types import SimpleNamespace
            from ultralytics.trackers.byte_tracker import BYTETracker

            args = SimpleNamespace(
                track_buffer=cfg.bytetrack_buffer,
                match_thresh=cfg.bytetrack_match_thresh,
                min_box_area=cfg.bytetrack_min_box_area,
                mot20=False,
            )
            self._tracker = BYTETracker(args, frame_rate=30)
            self._fallback = CenterPointTracker(cfg.center_threshold)
            self._active = True
        except Exception as e:  # pragma: no cover - import env dependent
            print(f"[WARN] ByteTrack unavailable ({e}); using center-point tracker.")
            self._active = False
            self._fallback = CenterPointTracker(cfg.center_threshold)

    def update(self, detections: List[Det]) -> List[TrackedBox]:
        if not self._active:
            return self._fallback.update(detections)
        try:
            from types import SimpleNamespace

            tracks = []
            for det in detections:
                (x1, y1, x2, y2), meta = _normalize_det(det)
                tlbr = __import__("numpy").array([x1, y1, x2, y2], dtype=float)
                track = SimpleNamespace(tlbr=tlbr, conf=float(meta.get("conf", 0.9)),
                                        cls=int(meta.get("cls", 0)))
                tracks.append(track)
            out = self._tracker.update(tracks, None, None)
            tracked = []
            for t in out:
                tlbr = getattr(t, "tlbr", None)
                tid = getattr(t, "track_id", None)
                if tid is None:
                    tid = getattr(t, "id", None)
                if tlbr is None or tid is None:
                    continue
                x1, y1, x2, y2 = (int(v) for v in np_as_flat(tlbr))
                cx, cy = (x1 + x2) / 2.0, (y1 + y2) / 2.0
                tracked.append(TrackedBox(x1, y1, x2, y2, int(tid), cx, cy,
                                          "car", 0.0, {}))
            return tracked
        except Exception as e:
            if not self._warned:
                print(f"[WARN] ByteTrack update failed ({e}); using center-point tracker.")
                self._warned = True
            return self._fallback.update(detections)


def np_as_flat(arr):
    import numpy as np

    a = np.asarray(arr).reshape(-1)
    return a.tolist()


def get_tracker(cfg: Config) -> Union[CenterPointTracker, ByteTrackAdapter]:
    if cfg.tracker_kind == "bytetrack":
        return ByteTrackAdapter(cfg)
    return CenterPointTracker(cfg.center_threshold)