import argparse
import csv
import os
from pathlib import Path
import cv2
from src.pipeline import PlateRecognizer


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--input_dir", required=True)
    ap.add_argument("--output_csv", default="results_crops.csv")
    ap.add_argument("--save_sr", default="sr_output")
    args = ap.parse_args()

    recognizer = PlateRecognizer(use_lpsr=True, use_trocr=True)
    Path(args.save_sr).mkdir(parents=True, exist_ok=True)
    rows = []

    for name in sorted(os.listdir(args.input_dir)):
        if not name.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".webp")):
            continue
        path = os.path.join(args.input_dir, name)
        img = cv2.imread(path)
        if img is None:
            continue
        print("\n" + "="*90)
        print("[PLATE]", name)
        result = recognizer.recognize(img)
        print("RAW CHAR :", result["raw_char_text"])
        print("SR CHAR  :", result["sr_char_text"])
        print("TrOCR    :", result["trocr_text"])
        print("FINAL    :", result["final"], "source=", result["source"])
        print("LAYOUT   :", result["raw_char_info"]["layout"])
        print("VALID    :", result["valid"])
        if result["sr_image"] is not None:
            cv2.imwrite(os.path.join(args.save_sr, name), result["sr_image"], [cv2.IMWRITE_JPEG_QUALITY, 98])
        rows.append({
            "file": name,
            "raw_char": result["raw_char_text"],
            "sr_char": result["sr_char_text"],
            "trocr": result["trocr_text"],
            "final": result["final"],
            "source": result["source"],
            "layout": result["raw_char_info"]["layout"],
            "valid": result["valid"]["grammar_ok"],
        })

    with open(args.output_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=rows[0].keys() if rows else ["file"])
        w.writeheader()
        w.writerows(rows)
    print(f"\n[DONE] {args.output_csv}")


if __name__ == "__main__":
    main()
