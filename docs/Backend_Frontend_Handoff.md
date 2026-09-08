# City-Wide ANPR & Traffic Intelligence — Handoff Contracts

**Purpose:** This document gives the backend and frontend teams everything needed to start building the API, database schema, and dashboard *today*, independent of ongoing OCR/detection accuracy work. All payloads below are the agreed shape — fields may gain new optional keys later, but existing keys and types should be treated as stable.

---

## 1. Core Event: Single-Camera ANPR Detection

This is the atomic unit produced every time a plate is read on one camera. This is what the AI pipeline emits per vehicle per camera pass.

```json
{
  "event_id": "evt_8f3a1c2e",
  "event_type": "vehicle_anpr",
  "camera_id": "CAM_001",
  "timestamp": "2026-09-06T14:32:10.412Z",
  "local_track_id": 17,
  "vehicle": {
    "type": "car",
    "type_confidence": 0.93,
    "bbox": [140, 220, 410, 480]
  },
  "plate": {
    "text": "WB02AM7555",
    "confidence": 91.2,
    "format_valid": true,
    "state_code": "WB",
    "state_auto_corrected": false
  },
  "speed": {
    "value_kmh": 34.5,
    "estimated": true,
    "direction": "north"
  },
  "plate_bbox": [412, 287, 561, 326],
  "frame_number": 1042,
  "source_video_timestamp_ms": 41680
}
```

**Field notes:**
- `local_track_id` — ByteTrack ID, valid only within this camera's session. Not unique city-wide.
- `plate.confidence` — 0-100 scale, our internal OCR consensus score (not a probability).
- `plate.format_valid` — whether the plate matches expected Indian plate structure (state+RTO+series+number). `false` doesn't mean the read is wrong — it means treat it as lower-trust / flag for review.
- `speed` — owned by teammate's module. `estimated: true` should always be present for now since we don't have calibrated camera geometry yet.
- This event is emitted **once per vehicle per camera**, after temporal fusion locks in a consensus (not per-frame).

---

## 2. Global Vehicle Identity (Cross-Camera)

Once the same plate is seen on more than one camera, backend merges local track IDs into one global identity.

```json
{
  "global_vehicle_id": "GV_00017",
  "plate_text": "WB02AM7555",
  "vehicle_type": "car",
  "first_seen": "2026-09-06T14:30:02.000Z",
  "last_seen": "2026-09-06T14:47:55.000Z",
  "camera_sequence": [
    { "camera_id": "CAM_001", "timestamp": "2026-09-06T14:30:02.000Z", "local_track_id": 17 },
    { "camera_id": "CAM_004", "timestamp": "2026-09-06T14:41:18.000Z", "local_track_id": 8 },
    { "camera_id": "CAM_002", "timestamp": "2026-09-06T14:47:55.000Z", "local_track_id": 31 }
  ],
  "is_blacklisted": false
}
```

MVP association rule: same `plate_text` across cameras = same `global_vehicle_id`. No re-identification model needed yet.

---

## 3. Trajectory Reconstruction (query response for a specific plate)

This is what the frontend calls when a user searches for a plate on the GIS map.

```json
{
  "plate_text": "WB02AM7555",
  "global_vehicle_id": "GV_00017",
  "query_range": {
    "from": "2026-09-06T00:00:00Z",
    "to": "2026-09-06T23:59:59Z"
  },
  "points": [
    {
      "camera_id": "CAM_001",
      "latitude": 22.5726,
      "longitude": 88.3639,
      "timestamp": "2026-09-06T14:30:02.000Z",
      "speed_kmh": 32.1,
      "direction": "north"
    },
    {
      "camera_id": "CAM_004",
      "latitude": 22.5810,
      "longitude": 88.3701,
      "timestamp": "2026-09-06T14:41:18.000Z",
      "speed_kmh": 41.0,
      "direction": "east"
    }
  ]
}
```

Frontend plots `points` as a polyline on the GIS map, ordered by `timestamp`.

---

## 4. Traffic Analytics Summary (dashboard metrics)

```json
{
  "camera_id": "CAM_001",
  "window": { "from": "2026-09-06T14:00:00Z", "to": "2026-09-06T15:00:00Z" },
  "metrics": {
    "total_vehicles": 127,
    "unique_vehicles": 91,
    "avg_speed_kmh": 32.4,
    "congestion_score": 68,
    "density_per_km": 45.2,
    "vehicle_type_breakdown": {
      "car": 71,
      "bike": 38,
      "bus": 9,
      "truck": 9
    }
  }
}
```

Also expose a **city-wide** version of this same shape with `"camera_id": "ALL"` or a dedicated `/traffic/summary` endpoint (see Section 6) that aggregates across all cameras.

---

## 5. Alert Event (blacklist / anomaly)

```json
{
  "alert_id": "alrt_44a1",
  "alert_type": "blacklisted_vehicle",
  "plate_text": "WB02AM7555",
  "global_vehicle_id": "GV_00017",
  "camera_id": "CAM_002",
  "timestamp": "2026-09-06T14:47:55.000Z",
  "severity": "high",
  "message": "Blacklisted vehicle detected",
  "location": { "latitude": 22.5810, "longitude": 88.3701 }
}
```

`alert_type` enum (extend as needed): `blacklisted_vehicle`, `route_anomaly`, `speed_violation`.

---

## 6. REST API Endpoints (backend to implement)

```
POST   /api/anpr/events                 → ingest a new ANPR event (Section 1 payload)
GET    /api/anpr/events                 → list/filter recent events (query params: camera_id, from, to, plate_text)
GET    /api/vehicles/{plate_text}       → global vehicle identity (Section 2)
GET    /api/vehicles/{plate_text}/trajectory  → trajectory reconstruction (Section 3)
GET    /api/cameras                     → list of cameras with status/location
GET    /api/traffic/summary             → analytics (Section 4), query param camera_id=ALL for city-wide
GET    /api/alerts                      → list active/recent alerts (Section 5)
POST   /api/blacklist                   → add plate to blacklist
DELETE /api/blacklist/{plate_text}      → remove from blacklist
```

---

## 7. Camera Metadata (static config, backend seeds this)

```json
{
  "camera_id": "CAM_001",
  "name": "MG Road Junction - North",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "status": "online",
  "stream_url": "rtsp://example/cam001",
  "installed_direction": "north-facing"
}
```

---

## 8. Standard API Response Wrapper

Use this envelope for every endpoint so frontend error-handling is consistent:

```json
{
  "success": true,
  "data": { },
  "error": null,
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-09-06T14:50:00Z"
  }
}
```

On failure:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "PLATE_NOT_FOUND",
    "message": "No events found for this plate in the given time range."
  },
  "meta": { "request_id": "req_abc124", "timestamp": "2026-09-06T14:50:05Z" }
}
```

---

## 9. Suggested Database Tables (backend, starting point)

```
cameras            (camera_id PK, name, lat, lng, status, stream_url)
vehicles           (global_vehicle_id PK, plate_text, vehicle_type, first_seen, last_seen, is_blacklisted)
anpr_events        (event_id PK, camera_id FK, global_vehicle_id FK, local_track_id, plate_text,
                     plate_confidence, format_valid, timestamp, bbox, plate_bbox)
speed_records      (event_id FK, speed_kmh, estimated, direction)
alerts             (alert_id PK, alert_type, plate_text, camera_id, timestamp, severity, message)
traffic_metrics    (camera_id FK, window_start, window_end, total_vehicles, unique_vehicles,
                     avg_speed_kmh, congestion_score, density_per_km)
```

---

## 10. What's Confirmed vs. Still In Progress

**Confirmed / stable — safe to build against now:**
- Section 1 (ANPR event) field names and types
- Section 6 (API endpoint list)
- Section 8 (response wrapper)

**In progress — shape is stable, values will improve in accuracy:**
- `plate.confidence` and `plate.format_valid` — scoring logic still being tuned, but the fields themselves won't change shape
- `speed` block — teammate is actively building this; confirm exact field names with them directly since this doc assumes `value_kmh` / `estimated` / `direction`

**Not yet implemented — build UI placeholders, don't block on it:**
- Cross-camera trajectory (Section 2/3) is MVP-simple (plate-text matching only) — no re-identification model yet
- Blacklist/alerts (Section 5) — schema is ready, detection logic not wired up yet

---

## 11. Immediate Ask for Backend Team

1. Stand up the endpoints in Section 6 accepting/returning the exact payload shapes above, using mock data if needed.
2. Confirm the DB schema in Section 9 or propose changes — reply before implementing so both sides stay in sync.
3. Frontend can build the dashboard, GIS map, and search UI entirely against these mock shapes starting now.

We'll push real events into `POST /api/anpr/events` from tonight's video test once temporal fusion is running — real payloads should match Section 1 exactly, so no contract changes should be needed on your end at that point.
