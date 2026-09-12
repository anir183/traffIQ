from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, Optional


def clamp01(x: float) -> float:
    return min(1.0, max(0.0, float(x)))


@dataclass
class VehicleInfo:
    type: str
    type_confidence: float = 0.0


@dataclass
class PlateInfo:
    text: str = ""
    confidence: float = 0.0
    format_valid: bool = False


@dataclass
class SpeedInfo:
    value_kmh: float = 0.0
    estimated: bool = True
    direction: str = ""


@dataclass
class DetectionEvent:
    event_id: str
    event_type: str
    camera_id: str
    timestamp: str
    local_track_id: int
    vehicle: VehicleInfo = field(default_factory=VehicleInfo)
    plate: PlateInfo = field(default_factory=PlateInfo)
    speed: SpeedInfo = field(default_factory=SpeedInfo)

    def to_dict(self) -> dict:
        return {
            "event_id": self.event_id,
            "event_type": self.event_type,
            "camera_id": self.camera_id,
            "timestamp": self.timestamp,
            "local_track_id": self.local_track_id,
            "vehicle": {
                "type": self.vehicle.type,
                "type_confidence": round(clamp01(self.vehicle.type_confidence), 4),
            },
            "plate": {
                "text": self.plate.text,
                "confidence": round(clamp01(self.plate.confidence), 4),
                "format_valid": self.plate.format_valid,
            },
            "speed": {
                "value_kmh": round(float(self.speed.value_kmh), 2),
                "estimated": bool(self.speed.estimated),
                "direction": self.speed.direction,
            },
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict())


class EventIdFactory:
    """Sequential ids shaped like backend example: evt-20260910-000001."""

    def __init__(self, prefix: str = "evt", start: int = 1, day: Optional[datetime] = None):
        self.prefix = prefix or "evt"
        self.next = start
        self.day = day or datetime.utcnow()

    def next_id(self) -> str:
        n = self.next
        self.next += 1
        return f"{self.prefix}-{self.day.strftime('%Y%m%d')}-{n:06d}"


def make_timestamp(start_base: Optional[str], video_time_s: float) -> str:
    """Timestamp string matching the backend example ('YYYY-MM-DDTHH:MM:SS')."""
    if start_base:
        try:
            base = datetime.strptime(start_base, "%Y-%m-%dT%H:%M:%S")
            return (base + timedelta(seconds=video_time_s)).strftime("%Y-%m-%dT%H:%M:%S")
        except ValueError:
            pass
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S")