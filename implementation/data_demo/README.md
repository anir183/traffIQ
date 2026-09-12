# data_demo

This folder is a placeholder for SIH demo media. Do **not** commit large videos here.

Expected inputs when running notebook 03:

- `highway.mp4` (or any traffic clip) — vehicles moving across two lines
- Calibration chosen so the lines in `Config` match the clip: set `line_a_y`,
  `line_b_y`, `line_offset`, and `distance_meters` (real metres between the two lines)
  per camera id.

Suggested layout on Colab (matching `colab_config(weights_dir=...)`):

```
/content/assets/
├── best.pt
├── char.pt
├── lpsr_best.pth
├── object.pt
└── ocr_class_names.txt
/content/
└── highway.mp4
```

The teammate's demo used a clip whose frames were resized to 1020x500 with red line at
y=198 and blue line at y=268 (10 m apart) for speed estimation — those values are the
`Config` defaults.