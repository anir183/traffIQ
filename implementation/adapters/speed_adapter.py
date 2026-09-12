from typing import Dict, Optional

from pipeline.config import Config
from adapters.tracking_adapter import TrackedBox


class LineCrossingSpeedEstimator:
    """Two-virtual-line speed estimator (same method as Speed(up_down).ipynb).

    A tracked vehicle's centre records the video-time when it enters the band of the
    first line; crossing the second line yields elapsed time -> speed = distance / time.
    Returns one event per (track, direction) pass, with a re-arm cooldown.
    """

    def __init__(self, cfg: Config):
        self.cfg = cfg
        self.line_a_y = int(cfg.line_a_y)
        self.line_b_y = int(cfg.line_b_y)
        self.offset = int(cfg.line_offset)
        self.distance_m = float(cfg.distance_meters)
        self.rearm = int(cfg.rearm_frames)
        self.prune_missed = int(cfg.prune_missed)
        # pending[track_id] = (line_x1|line_x2, video_time, frame_index)
        self.pending: Dict[int, tuple] = {}
        self.last_frame_seen: Dict[int, int] = {}
        self.last_event_frame: Dict[int, int] = {}

    def reset(self):
        self.pending.clear()
        self.last_frame_seen.clear()
        self.last_event_frame.clear()

    def in_band(self, y: float, line_y: int) -> bool:
        return abs(y - line_y) <= self.offset

    def update(self, track: TrackedBox, frame_index: int, fps: float) -> Optional[dict]:
        fps = float(fps) if fps and fps > 0 else 20.0
        t = frame_index / fps
        self.last_frame_seen[track.id] = frame_index

        hit_a = self.in_band(track.cy, self.line_a_y)
        hit_b = self.in_band(track.cy, self.line_b_y)
        if hit_a == hit_b:
            self._prune(frame_index)
            return None

        pending = self.pending.get(track.id)
        if hit_b and pending is not None and pending[0] == "a":
            self.pending.pop(track.id, None)
            return self._emit(track, "ab", pending[1], t, frame_index)
        if hit_a and pending is not None and pending[0] == "b":
            self.pending.pop(track.id, None)
            return self._emit(track, "ba", pending[1], t, frame_index)

        if hit_a and pending is None:
            if frame_index - self.last_event_frame.get(track.id, -1e9) >= self.rearm:
                self.pending[track.id] = ("a", t, frame_index)
        elif hit_b and pending is None:
            if frame_index - self.last_event_frame.get(track.id, -1e9) >= self.rearm:
                self.pending[track.id] = ("b", t, frame_index)

        self._prune(frame_index)
        return None

    def _emit(self, track, direction_key, start_time, end_time, frame_index) -> dict:
        elapsed = end_time - start_time
        if elapsed <= 0:
            return None
        speed_ms = self.distance_m / elapsed
        speed_kmh = speed_ms * 3.6
        if direction_key == "ab":
            direction = self.cfg.direction_ab
        else:
            direction = self.cfg.direction_ba
        self.last_event_frame[track.id] = frame_index
        return {
            "value_kmh": float(speed_kmh),
            "estimated": bool(self.cfg.speed_estimated),
            "direction": direction,
            "elapsed_s": float(elapsed),
        }

    def _prune(self, frame_index: int):
        stale = [tid for tid, f in self.last_frame_seen.items()
                 if frame_index - f > self.prune_missed]
        for tid in stale:
            self.pending.pop(tid, None)
            self.last_frame_seen.pop(tid, None)
            self.last_event_frame.pop(tid, None)