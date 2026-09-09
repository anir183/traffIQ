# City-Wide ANPR & Traffic Intelligence — Handoff Contracts

**Purpose:** This document gives the backend and frontend teams everything needed to start building the API, database schema, and dashboard _today_, independent of ongoing OCR/detection accuracy work. All payloads below are the agreed shape — fields may gain new optional keys later, but existing keys and types should be treated as stable.

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
    {
      "camera_id": "CAM_001",
      "timestamp": "2026-09-06T14:30:02.000Z",
      "local_track_id": 17
    },
    {
      "camera_id": "CAM_004",
      "timestamp": "2026-09-06T14:41:18.000Z",
      "local_track_id": 8
    },
    {
      "camera_id": "CAM_002",
      "timestamp": "2026-09-06T14:47:55.000Z",
      "local_track_id": 31
    }
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
      "latitude": 22.581,
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
  "location": { "latitude": 22.581, "longitude": 88.3701 }
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
  "data": {},
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

---

## 12. Frontend Requirements (added by frontend team — 2026-09-08)

These are the fields/endpoints the dashboard needs to render every existing UI surface. Where a feature has **no contract counterpart yet**, it's flagged **`[NEEDED]`** so the backend team can either add it or confirm a substitute. Treat this section as additive — it does not change Sections 1–11.

### 12.1 Endpoints the frontend will actually call

```
GET    /api/anpr/events?from&to&camera_id&plate_text&limit&offset&sort=desc
GET    /api/vehicles/{plate_text}
GET    /api/vehicles/{plate_text}/trajectory?from&to
GET    /api/cameras
GET    /api/traffic/summary?camera_id=ALL&from&to
GET    /api/alerts?from&to&limit&offset      ← also by status / alert_type
POST   /api/alerts/{alert_id}/status         [NEEDED] update triage status
POST   /api/blacklist
DELETE /api/blacklist/{plate_text}
```

**List conventions:** every list endpoint (`anpr/events`, `alerts`, `vehicles` search) must support `limit`/`offset` and return the **total count** so the UI can render "Showing X–Y of Z" + page controls. Default ordering: newest first.

### 12.2 Alert Event additions (Section 5 extension)

Frontend expects these keys in addition to Section 5:

```json
{
  "alert_id": "alrt_44a1",
  "alert_type": "blacklisted_vehicle",
  "status": "active", // [NEEDED] triage: active | investigating | resolved
  "severity": "high", // high | medium | low (UI needs ≥3 levels for marker ramp)
  "location_name": "Park Street", // [NEEDED] display road name (Section 5 only has lat/lng)
  "speed_kmh": 41.0, // [OPTIONAL] shown on map legend / detail
  "route": { "from": "A", "to": "B" } // [OPTIONAL] display in stream rows
}
```

- **`alert_type` enum must be extended** (UI currently surfaces): `accident`, `wrong_way`, `signal_malfunction`, `road_construction`, `suspicious_activity` — in addition to the existing `blacklisted_vehicle`, `route_anomaly`, `speed_violation`.
- `status` is the UI's Active/Investigating/Resolved triage model. **Backend owning it is strongly preferred** (so operators can update it via `POST /api/alerts/{id}/status`); if backend builds first without it, frontend will fall back to local triage state.

### 12.3 Vehicle additions (Section 2 extension)

```json
{
  "make": "Maruti", // [NEEDED] Vehicle Information card shows Make/Model
  "model": "Swift", // [NEEDED]
  "detection_count": 3 // [OPTIONAL] default = camera_sequence.length
}
```

Frontend's "Status: Normal" chip is derived from `is_blacklisted` (Normal = not blacklisted). No extra field required.

### 12.4 Traffic summary additions (Section 4 extension)

Frontend needs the following to fill the "Traffic Analysis" page:

```json
{
  "camera_id": "ALL",
  "window": { "from": "...", "to": "..." },
  "metrics": {
    "total_vehicles": 125430,
    "unique_vehicles": 91245,
    "avg_speed_kmh": 32.4,
    "congestion_score": 68,
    "density_per_km": 45.2,
    "vehicle_type_breakdown": { "car": 71, "bike": 38, "bus": 9, "truck": 9 },
    "trend": {
      // [NEEDED] stat-card ±% vs previous window
      "total_vehicles_pct": 14,
      "unique_vehicles_pct": 11,
      "avg_speed_kmh_pct": -6,
      "congestion_score_pct": 6
    },
    "per_camera": [
      // [NEEDED] camera-wise vehicle count bars
      { "camera_id": "CAM_001", "total_vehicles": 18234 }
    ],
    "time_series": [
      // [NEEDED] hourly/daily buckets for volume + avg-speed graphs
      {
        "bucket": "2026-09-06T14:00:00Z",
        "total_vehicles": 9800,
        "avg_speed_kmh": 30.1
      }
    ]
  }
}
```

### 12.5 Segment / forecast — new endpoint [NEEDED]

The Overview shows "Top Congested Segments", "Average Speed by Segment", and a **density forecast** (current + projected days). No counterpart exists. Proposed:

```
GET /api/traffic/segments?window_from&window_to&limit=6
→ { "segments": [ { "name": "VIP Road", "congestion_score": 80, "avg_speed_kmh": 25, "density": 62 } ] }

GET /api/traffic/density-forecast?horizon_days=3
→ { "forecast": [ { "day": "2026-09-09", "density": 45, "is_projection": false } ] }
```

If segment-level congestion isn't feasible yet, frontend will drop those charts and keep summary-based cards instead.

### 12.6 Camera meta additions (Section 7 extension)

```json
{
  "camera_id": "CAM_001",
  "name": "MG Road Junction - North",
  "circuit": "Esplanade", // [NEEDED] node/area selector + nav "Active Circuit"
  "group": "CAM_001",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "status": "online",
  "stream_url": "rtsp://example/cam001",
  "installed_direction": "north-facing"
}
```

### 12.7 Error codes (Section 8 extension)

Frontend branches on `error.code`. Please use a stable, documented set, incl.:

```
PLATE_NOT_FOUND   CAMERA_NOT_FOUND   NO_DATA   INVALID_PARAMS
UNAUTHORIZED      RATE_LIMITED       INTERNAL
```

### 12.8 Realtime (roadmap)

Live Feed and the alert stream would ideally `SSE`: `GET /api/events/stream?types=anpr&types=alert`. If not available, the frontend will poll the list endpoints (30s, visibility-aware). No blocking dependency.

## 13. Sync Notes

- Frontend is now aligned to `/api/traffic/summary` (the old `/api/traffic/overview` shelf `useTrafficData.ts` was deleted in Phase 1).
- Frontend's pluggable data layer is documented in `docs/Frontend_Requirements.md` + `docs/Implementation_Plan.md`. All read surfaces consume hooks in `src/hooks/`; `VITE_DATA_SOURCE=mock|backend` swaps the transport with zero shape changes.
- Once endpoints above are live, the frontend can attach the backend source with identical payload shapes — existing keys/types in Sections 1–8 remain the source of truth. Contract extensions already implemented client-side (frontend mock serves them): `alert.status`, `alert.location{label,latitude,longitude}`, extended `alert_type` enum, `TrafficMetrics.*_change_pct`, `TrafficSummaryResponse.time_series` + `per_camera`, `GlobalVehicle.make/model`, `CameraMeta.circuit`, segment + density-forecast endpoints (`GET /api/traffic/segments`, `GET /api/traffic/density-forecast`), and `limit/offset` pagination.

---

## 14. Frontend Requirements — Phase 2 (Auth, Users, Settings, Logs, Notifications)

Added by frontend team (2026-09-08) alongside `docs/Implementation_Plan.md`. Auth flow is JWT with refresh-token rotation. All fields below are additive to Sections 1–12.

### 14.1 Authentication

```
POST   /api/auth/login    { email, password }           → LoginResponse
POST   /api/auth/refresh  { refresh_token }             → RefreshResponse
POST   /api/auth/logout   { refresh_token }             → 204
GET    /api/auth/me                                      → User (session restoration)
```

```json
// LoginResponse / RefreshResponse
{
  "access_token": "eyJhbGciOi...",
  "expires_in": 900,
  "refresh_token": "rft_abc123",
  "token_type": "Bearer",
  "user": {
    "id": "usr_001",
    "name": "Rudraneel",
    "email": "admin@traffiq.in",
    "role": "admin"
  }
}
```

**Token storage contract:** `access_token` lives in frontend memory only; `refresh_token` is set as an **httpOnly cookie** by the backend on login (path `/api/auth/refresh`). Backend rotates it on every refresh. 401 on any endpoint triggers silent refresh + retry once; refresh failure clears session → frontend redirects to `/login`.

### 14.2 User + Roles

`UserRole` enum: `admin | operator | viewer`.

Permissions:

- `admin` — all pages + user CRUD + blacklist management + audit logs + settings
- `operator` — dashboards + alert triage (update `status`)
- `viewer` — read-only dashboards

```json
{
  "id": "usr_001",
  "name": "Rudraneel",
  "email": "admin@traffiq.in",
  "role": "admin",
  "avatar_url": "https://.../avatar.png",
  "circuits": ["Esplanade", "Joka"],
  "created_at": "2026-09-01T10:00:00Z",
  "is_active": true
}
```

```
GET    /api/users?limit&offset&search&role             → Paginated<User>   (admin)
POST   /api/users                                      → User               (admin; creates with password)
PUT    /api/users/{user_id}                            → User               (admin; update name/role/password/is_active)
DELETE /api/users/{user_id}                            → 204                (admin)
```

**Accounts are admin-created only — no self-registration.** Backend enforces password policy: ≥8 chars, ≥1 uppercase, ≥1 lowercase, ≥1 number.

### 14.3 User Settings

```
GET    /api/settings/{user_id}                          → UserSettings
PUT    /api/settings/{user_id}                          → UserSettings
```

```json
{
  "theme": "system",
  "timezone": "Asia/Kolkata",
  "layout_density": "compact",
  "notification_prefs": {
    "alert_high": true,
    "alert_medium": true,
    "plate_detected": false,
    "system": true
  }
}
```

### 14.4 Audit Logs

```
GET    /api/logs?user_id&action&entity_type&from&to&limit&offset&sort   → Paginated<AuditLogEntry>  (admin)
```

```json
{
  "id": "log_001",
  "user_id": "usr_001",
  "user_name": "Rudraneel",
  "action": "create",
  "entity_type": "blacklist",
  "entity_id": "WB02AM7555",
  "details": "Added plate to blacklist",
  "timestamp": "2026-09-06T14:50:00Z",
  "ip_address": "192.168.1.10"
}
```

`action` enum: `login | logout | create | update | delete`.
`entity_type` enum: `user | blacklist | alert | camera | settings`.

### 14.5 Notifications

```
GET    /api/notifications?limit&offset&unread_only     → Paginated<Notification>
PUT    /api/notifications/{id}/read                    → 204
PUT    /api/notifications/read-all                     → 204
```

```json
{
  "id": "ntf_001",
  "type": "alert",
  "severity": "high",
  "title": "Blacklisted vehicle detected",
  "message": "WB02AM7555 at CAM_002, Park Street",
  "read": false,
  "entity_type": "alert",
  "entity_id": "alrt_44a1",
  "created_at": "2026-09-06T14:47:55Z"
}
```

`type` enum: `alert | plate_detected | system`.

### 14.6 Global Search

```
GET    /api/search?q=WB02&types=plate,camera,alert&limit=8
→ { "results": [
    { "type": "plate", "label": "WB02AM7555", "subtitle": "GV_00017 · Car · Active", "href": "/anpr?plate=WB02AM7555" },
    { "type": "camera", "label": "CAM_001", "subtitle": "MG Road Junction - North", "href": "/feed?camera=CAM_001" }
  ] }
```

`type` enum: `plate | camera | alert`.

### 14.7 Realtime (roadmap)

`GET /api/events/stream` — SSE channel. Events: `alert.created`, `notification.created`. Connection authenticated via cookie. Auto-reconnect with exponential backoff.

### 14.8 Error codes (extend §12.7)

Add: `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `PASSWORD_WEAK`, `FORBIDDEN`, `NOT_FOUND`.

### 14.9 Backend security requirements

1. `refresh_token` delivered/rotated via httpOnly cookie — never exposed to JS.
2. CSRF token (double-submit cookie) for `POST/PUT/DELETE` mutations when using cookie auth.
3. Rate-limit login (+ account lockout after N failures).
4. All admin endpoints enforce `admin` role server-side (frontend gating is UX only).
5. Audit-log every mutation + login/logout.

### 14.10 Alert triage ownership

`alerts.status` (`active | investigating | resolved`, §12.2) is **backend-owned**, updated via `POST /api/alerts/{alert_id}/status` and recorded in audit logs. Frontend renders triage from backend state — no local override.
