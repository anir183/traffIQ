import os
from typing import List, Optional

import cv2
import numpy as np

from pipeline.config import Config
from pipeline.schemas import (
    DetectionEvent, EventIdFactory, PlateInfo, SpeedInfo, VehicleInfo, make_timestamp,
)


class DetectionPipeline:
    """End-to-end: vehicle detect -> track -> plate detect/recognize -> temporal voting -> speed.

    process_frame() returns the list of events (JSON-shaped dicts) emitted for that frame,
    normally 0 or 1 when a tracked vehicle completes a line crossing with a read plate.
    """

    def __init__(self, cfg: Config):
        self.cfg = cfg
        from adapters.plate_detector import PlateDetector
        from adapters.plate_recognition import PlateRecognizerAdapter
        from adapters.speed_adapter import LineCrossingSpeedEstimator
        from adapters.temporal_filter import TemporalPlateFilter
        from adapters.tracking_adapter import get_tracker
        from adapters.vehicle_detector import VehicleDetector

        self.vehicle = VehicleDetector(cfg)
        self.tracker = get_tracker(cfg)
        self.plate_detector = PlateDetector(cfg)
        self.plate_recognizer = PlateRecognizerAdapter(cfg)
        self.temporal = TemporalPlateFilter(cfg)
        self.speed = LineCrossingSpeedEstimator(cfg)
        self.event_ids = EventIdFactory(prefix=cfg.event_prefix)
        self.frame_number = 0
        # vehicle id -> best plate observation
        self.plate_state = {}
        self.emitted_ids = set()
        self.last_tracks = []

    def reset(self):
        self.tracker.reset()
        self.speed.reset()
        self.plate_state.clear()
        self.emitted_ids.clear()
        self.frame_number = 0

    def _associate_plate_to_vehicle(self, tracks, plate_box):
        cx = (plate_box[0] + plate_box[2]) / 2.0
        cy = (plate_box[1] + plate_box[3]) / 2.0
        best = None
        best_area = 1e18
        for t in tracks:
            if t.x1 <= cx <= t.x2 and t.y1 <= cy <= t.y2:
                area = (t.x2 - t.x1) * (t.y2 - t.y1)
                if area < best_area:
                    best_area = area
                    best = t
        return best

    def process_frame(self, frame: np.ndarray, fps: float = 25.0) -> List[dict]:
        self.frame_number += 1
        events = []

        vehicles = self.vehicle.detect(frame)
        tracks = self.tracker.update(vehicles)
        self.last_tracks = tracks

        plates = self.plate_detector.detect(frame)
        plate_dets = []
        for p in plates:
            crop = self.plate_detector.crop(frame, p["bbox"])
            if crop.size == 0:
                continue
            rec = self.plate_recognizer.recognize(crop)
            plate_dets.append({**p, **rec})
        plate_dets = self.temporal.update(plate_dets)

        new_plate_state = {}
        for det in plate_dets:
            text = det.get("consensus_text") or det.get("text") or ""
            veh = self._associate_plate_to_vehicle(tracks, det["bbox"])
            if veh is None:
                continue
            key = veh.id
            prev = self.plate_state.get(key)
            conf = float(det.get("confidence", 0.0))
            if prev is not None and prev["skip"]:
                continue
            if text:
                new_plate_state[key] = {
                    "text": text,
                    "confidence": conf,
                    "format_valid": bool(det.get("format_valid", False)),
                    "skip": False,
                }
            elif prev is not None and prev["text"]:
                new_plate_state[key] = prev
        for k, v in new_plate_state.items():
            self.plate_state[k] = v

        for t in tracks:
            sp = self.speed.update(t, self.frame_number, fps)
            if sp is None:
                continue
            key = t.id
            if key in self.emitted_ids:
                continue
            plate = self.plate_state.get(key)
            plate_text = (plate or {}).get("text", "")
            if not plate_text:
                print(f"[EVENT-SKIP] vehicle {key} crossed lines but no plate read yet.")
                continue
            video_time = self.frame_number / fps if fps and fps > 0 else 0.0
            event = DetectionEvent(
                event_id=self.event_ids.next_id(),
                event_type=self.cfg.event_type,
                camera_id=self.cfg.camera_id,
                timestamp=make_timestamp(self.cfg.timestamp_base, video_time),
                local_track_id=key,
                vehicle=VehicleInfo(type=t.type, type_confidence=t.type_confidence),
                plate=PlateInfo(
                    text=plate_text,
                    confidence=float(plate.get("confidence", 0.0)),
                    format_valid=bool(plate.get("format_valid", False)),
                ),
                speed=SpeedInfo(
                    value_kmh=sp["value_kmh"],
                    estimated=sp["estimated"],
                    direction=sp["direction"],
                ),
            )
            self.emitted_ids.add(key)
            events.append(event.to_dict())

        return events


class VideoProcessor:
    """Runs DetectionPipeline over a video file and writes events + annotated output."""

    def __init__(self, cfg: Config, pipeline: Optional[DetectionPipeline] = None):
        self.cfg = cfg
        cfg.output_dir.mkdir(parents=True, exist_ok=True)
        self.pipeline = pipeline or DetectionPipeline(cfg)

    def run(self, video_path: str, output_video: Optional[str] = None,
            jsonl_out: Optional[str] = None, csv_out: Optional[str] = None,
            slice_frames: Optional[int] = None) -> List[dict]:
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f"Could not open {video_path}")
        fps = cap.get(cv2.CAP_PROP_FPS)
        if not fps or fps <= 0:
            fps = 20.0

        writer = None
        if output_video:
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(output_video, fourcc, fps, (w, h))

        events = []
        idx = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            idx += 1
            if slice_frames and idx > slice_frames:
                break
            emitted = self.pipeline.process_frame(frame, fps)
            events.extend(emitted)
            if writer is not None:
                from pipeline.visualization import annotate_frame, draw_lines

                annotated = annotate_frame(frame, self.pipeline, emitted_speed=emitted)
                annotated = draw_lines(annotated, self.cfg)
                writer.write(annotated)
            if idx % 50 == 0:
                print(f"frame {idx}  events_so_far={len(events)}")
        cap.release()
        if writer is not None:
            writer.release()

        if jsonl_out:
            self._write_jsonl(events, jsonl_out)
        if csv_out:
            self._write_csv(events, csv_out)
        return events

    @staticmethod
    def _write_jsonl(events: List[dict], path: str):
        import json as _json

        with open(path, "w", encoding="utf-8") as fh:
            for e in events:
                fh.write(_json.dumps(e) + "\n")

    @staticmethod
    def _write_csv(events: List[dict], path: str):
        import csv as _csv

        rows = []
        for e in events:
            rows.append({
                "event_id": e["event_id"], "event_type": e["event_type"],
                "camera_id": e["camera_id"], "timestamp": e["timestamp"],
                "local_track_id": e["local_track_id"],
                "vehicle_type": e["vehicle"]["type"],
                "vehicle_conf": e["vehicle"]["type_confidence"],
                "plate_text": e["plate"]["text"],
                "plate_conf": e["plate"]["confidence"],
                "plate_format_valid": e["plate"]["format_valid"],
                "speed_kmh": e["speed"]["value_kmh"],
                "speed_estimated": e["speed"]["estimated"],
                "speed_direction": e["speed"]["direction"],
            })
        with open(path, "w", newline="", encoding="utf-8") as fh:
            writer = _csv.DictWriter(fh, fieldnames=list(rows[0]) if rows else [
                "event_id", "event_type", "camera_id", "timestamp", "local_track_id",
                "vehicle_type", "vehicle_conf", "plate_text", "plate_conf",
                "plate_format_valid", "speed_kmh", "speed_estimated", "speed_direction"])
            writer.writeheader()
            if rows:
                writer.writerows(rows)