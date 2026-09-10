import cv2
import numpy as np

from pipeline.config import Config
from pipeline.schemas import DetectionEvent


def draw_lines(frame: np.ndarray, cfg: Config) -> np.ndarray:
    a, b = int(cfg.line_a_y), int(cfg.line_b_y)
    h, w = frame.shape[:2]
    cv2.line(frame, (0, a), (w, a), (0, 0, 255), 2)
    cv2.line(frame, (0, b), (w, b), (255, 0, 0), 2)
    cv2.putText(frame, "Line A", (10, max(16, a - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
    cv2.putText(frame, "Line B", (10, max(16, b - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 1)
    return frame


def annotate_frame(frame: np.ndarray, pipeline, emitted_speed=None) -> np.ndarray:
    annotated = frame.copy()
    speed_by_id = {}
    if emitted_speed:
        for e in emitted_speed:
            speed_by_id[int(e["local_track_id"])] = e

    for t in pipeline.last_tracks:
        cv2.rectangle(annotated, (t.x1, t.y1), (t.x2, t.y2), (0, 255, 0), 2)
        label = f"#{t.id} {t.type}"
        cv2.putText(annotated, label, (t.x1, max(20, t.y1 - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        plate = pipeline.plate_state.get(t.id)
        if plate and plate.get("text"):
            cv2.putText(annotated, plate["text"], (t.x1, t.y2 + 16),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        if t.id in speed_by_id:
            sp = speed_by_id[t.id]["speed"]
            text = f"{sp['value_kmh']} km/h {sp['direction']}"
            cv2.putText(annotated, text, (t.x1, t.y2 + 36),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
    return annotated


def write_events_summary(events, output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)
    jsonl = str(output_dir / "events.jsonl")
    csv = str(output_dir / "events.csv")
    from pipeline.pipeline import VideoProcessor

    VideoProcessor._write_jsonl(events, jsonl)
    VideoProcessor._write_csv(events, csv)
    return jsonl, csv