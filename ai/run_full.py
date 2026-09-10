import argparse
from pathlib import Path
import csv
import cv2
import numpy as np
from ultralytics import YOLO

from src.pipeline import PlateRecognizer
from src.temporal import TemporalPlateConsensus


def process_image(path, detector, recognizer, out_path):
    image = cv2.imread(str(path))
    if image is None:
        raise FileNotFoundError(path)
    results = detector.predict(image, conf=0.25, verbose=False)
    annotated = image.copy()
    rows = []
    plate_idx = 0
    for r in results:
        for b in r.boxes:
            plate_idx += 1
            x1, y1, x2, y2 = map(int, b.xyxy[0].tolist())
            conf = float(b.conf[0])
            crop = image[max(0,y1):min(image.shape[0],y2), max(0,x1):min(image.shape[1],x2)]
            if crop.size == 0:
                continue
            result = recognizer.recognize(crop)
            label = result["final"] or "?"
            cv2.rectangle(annotated, (x1,y1), (x2,y2), (0,255,0), 2)
            cv2.putText(annotated, f"{label} | {conf:.2f}", (x1, max(20,y1-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
            rows.append({
                "plate_index": plate_idx,
                "det_conf": conf,
                "final": label,
                "source": result["source"],
                "raw_char": result["raw_char_text"],
                "sr_char": result["sr_char_text"],
                "trocr": result["trocr_text"],
            })
            print(f"[PLATE {plate_idx}] det={conf:.3f} raw={result['raw_char_text']} sr={result['sr_char_text']} trocr={result['trocr_text']} FINAL={label}")
    cv2.imwrite(str(out_path), annotated)
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True)
    ap.add_argument("--plate_weights", required=True)
    ap.add_argument("--output", default="annotated.jpg")
    args = ap.parse_args()

    detector = YOLO(args.plate_weights)
    recognizer = PlateRecognizer(use_lpsr=True, use_trocr=True)
    src = Path(args.source)
    if src.is_file() and src.suffix.lower() in {".jpg", ".jpeg", ".png", ".bmp", ".webp"}:
        rows = process_image(src, detector, recognizer, Path(args.output))
        print("[DONE] saved", args.output)
        return

    cap = cv2.VideoCapture(args.source)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open {args.source}")
    writer = None
    idx = 0
    tracker = TemporalPlateConsensus()
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        idx += 1
        frame_dets=[]
        results = detector.predict(frame, conf=0.25, verbose=False)
        for r in results:
            for b in r.boxes:
                x1,y1,x2,y2 = map(int, b.xyxy[0].tolist())
                crop = frame[max(0,y1):min(frame.shape[0],y2), max(0,x1):min(frame.shape[1],x2)]
                if crop.size == 0:
                    continue
                out = recognizer.recognize(crop)
                frame_dets.append({
                    'bbox': (x1,y1,x2,y2),
                    'text': out['final'],
                    'score': out['score'],
                    'source': out['source'],
                    'raw_char': out['raw_char_text'],
                    'sr_char': out['sr_char_text'],
                    'trocr': out['trocr_text'],
                })
        tracker.update(frame_dets)
        for d in frame_dets:
            x1,y1,x2,y2=d['bbox']
            txt=d.get('consensus_text') or d.get('text') or '?'
            cv2.rectangle(frame, (x1,y1), (x2,y2), (0,255,0), 2)
            tid=d.get('track_id','?')
            cv2.putText(frame, f"#{tid} {txt}", (x1,max(20,y1-8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)
        if writer is None:
            h,w = frame.shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            writer = cv2.VideoWriter(args.output, fourcc, cap.get(cv2.CAP_PROP_FPS) or 25.0, (w,h))
        writer.write(frame)
        if idx % 10 == 0:
            print("processed frame", idx, "active_tracks=", len(tracker.tracks))
    cap.release()
    if writer:
        writer.release()
    print("[DONE] saved", args.output)


if __name__ == "__main__":
    main()
