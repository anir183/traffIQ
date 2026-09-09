# TraffIQ Frontend — Deep-Dive Findings & Integration Map

**Date:** 2026-09-08
**Scope:** Full read-through of `frontend/src`, `PLAN.md`, and `docs/Backend_Frontend_Handoff.md` to map every UI data element to its current source and its target backend endpoint.

---

## 1. Stack & Architecture

- **Framework:** React 19 + Vite 8, react-router-dom v7 (route-level lazy + Suspense), Tailwind CSS v4 (class-based dark variant with pre-paint theme script).
- **Charts:** Recharts (Overview), hand-rolled SVG (Analysis: donut, volume bars, avg-speed area).
- **Maps:** MapLibre GL (`maplibre-gl`). 3 maps: Overview (heatmap + severity markers), Trajectory (polyline + dots), Incident (pulse markers). Base tiles are OSM raster; dark theme via canvas filter (`invert(1) hue-rotate(180deg)`).
- **Icons:** lucide-react.
- **Shell:** `App.tsx` → header (brand `src/assets/logo.svg`, search, profile) + `body.tsx` (nav sidebar + routed `window.tsx`).

## 2. Current Data Sources

1. **Pluggable data layer** — `src/api/` client, toggled by `VITE_DATA_SOURCE=mock|backend`. All read surfaces go through hooks in `src/hooks/` (`useAlerts`, `useCameras`, `useAnprEvents`, `useTrafficSummary`, `useVehicleDetail`, `useTrajectory`, `useSearch`, …). With `VITE_DATA_SOURCE=mock` the handlers in `src/api/mock/` serve identical-shaped payloads; with `backend` the same hooks hit the live API with auto-refresh on 401.
2. **No TomTom network calls** — the Overview heatmap + incident markers and the two map layers now derive from alert payloads (`location.latitude/longitude`) via pure adapters in `src/types/ui/adapters.ts`.
3. **Auth** — `src/auth/` (JWT + refresh rotation against `/api/auth/*`); profile identity from `useAuth().user`.

## 3. Backend Contract (from `Backend_Frontend_Handoff.md`) — what exists

| Payload              | Key fields                                                                                                                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ANPR event (§1)      | `event_id`, `camera_id`, `timestamp`, `local_track_id`, `vehicle{type,type_confidence,bbox}`, `plate{text,confidence,format_valid,state_code,state_auto_corrected}`, `speed{value_kmh,estimated,direction}`, `plate_bbox`, framing |
| Global vehicle (§2)  | `global_vehicle_id`, `plate_text`, `vehicle_type`, `first_seen`, `last_seen`, `camera_sequence[]`, `is_blacklisted`                                                                                                                |
| Trajectory (§3)      | `plate_text`, `global_vehicle_id`, `query_range`, `points[{camera_id, latitude, longitude, timestamp, speed_kmh, direction}]`                                                                                                      |
| Traffic summary (§4) | `total_vehicles`, `unique_vehicles`, `avg_speed_kmh`, `congestion_score`, `density_per_km`, `vehicle_type_breakdown{car,bike,bus,truck}`; per-camera or `camera_id=ALL`                                                            |
| Alert (§5)           | `alert_id`, `alert_type{blacklisted_vehicle,route_anomaly,speed_violation}`, `plate_text`, `global_vehicle_id`, `camera_id`, `timestamp`, `severity{high,...}`, `message`, `location{lat,lng}`                                     |
| Camera meta (§7)     | `camera_id`, `name`, `latitude`, `longitude`, `status`, `stream_url`, `installed_direction`                                                                                                                                        |
| Envelope (§8)        | `{success, data, error{code,message}, meta{request_id,timestamp}}`                                                                                                                                                                 |
| REST (§6)            | `POST/GET /api/anpr/events`, `GET /api/vehicles/{plate}`, `GET /api/vehicles/{plate}/trajectory`, `GET /api/cameras`, `GET /api/traffic/summary`, `GET /api/alerts`, `POST/DELETE /api/blacklist(/{plate})`                        |

## 4. Frontend Field Inventory — current source → target endpoint

### Overview `/` (`trafficanalysis.tsx`)

| Component                                              | Current (hardcoded/TomTom)                      | Target                                                                                |
| ------------------------------------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| Critical Incidents card (`analysis/detailF`)           | "2 Suspicious activities", "1 Accident"         | ✓ `useAlerts()` → `criticalIncidentCounts()` (event-stream alerts)                    |
| Top Congested Segments bar chart (`analysis/stataf`)   | mock via `useTrafficData`                       | ✓ `useTrafficSegments` → `segmentCongestionData`                                      |
| Average Speed by Segment bar chart (`analysis/stataf`) | mock via `useTrafficData`                       | ✓ `useTrafficSegments` → `segmentSpeedData`                                           |
| Traffic Density Forecast (`analysis/densityforecast`)  | mock incl. placeholder "Future/Future+n" points | ✓ `useTrafficDensityForecast` → `forecastToDensityPoints`                             |
| Heatmap + severity markers (`analysis/mapp`)           | TomTom incidents; `magnitudeOfDelay`→0-4        | ✓ alert `location` via `mapAlertMarkers`; severity ramp in `types/ui/severityRamp.ts` |
| Incident & Event Stream (`analysis/incident-queue`)    | 10 mock rows; presentational `✕ ✓ • !` status   | ✓ `useAlerts` → `incidentStreamAlerts` → `alertToEventStream`                         |

### Live Feed `/feed` (`livefeed.tsx`) — implemented via hooks/adapters

| Component                     | Current (now implemented)                                               | Live-backend target                         |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| Node selector (nav + `page2`) | ✓ `useCameras` → `cameraCircuits()` (8 circuits, mock)                  | `GET /api/cameras` grouped by circuit/node  |
| Camera grid (`page2/feed`)    | ✓ `useCameras` tiles (`camera_id`/`name`/`circuit`), paginated          | `stream_url` (+HLS/WebRTC player — Phase 3) |
| ANPR log (`page2/updates`)    | ✓ `useAnprEvents` → `anprEventToEntry`, client-side search + pagination | `GET /api/anpr/events`                      |

### Trajectory Recognition `/anpr` (`anpr.tsx`) — plate state lifted to page

| Component                            | Current (now implemented)                                                                           | Live-backend target                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Search tabs + input (`anpr/search`)  | ✓ controlled input, Enter/Search commits plate (default `WB02AM7555`)                               | camera-tab search via `/api/anpr/events?camera_id=` (still local)      |
| Vehicle Information (`anpr/details`) | ✓ `useVehicleDetail(plate)` → `vehicleToDetails` / `vehicleToDetections` (+ camera-location lookup) | Make/Model optional in contract; detections = `camera_sequence.length` |
| Trajectory map (`anpr/map`)          | ✓ maplibre OSM + `useTrajectory` → `trajectoryPath` polyline + markers                              | camera dot = first point's `camera_id`                                 |

### Incident Management `/incident` (`incidentmngmnt.tsx`)

| Component                                             | Current (now implemented)                                                       | Live-backend target                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| Filter tabs + Recent Incidents (`incident/incidents`) | ✓ `useAlerts` → `triageAlerts()` → `alertToIncident`; client-side status filter | status field on contract (§5 gap B)      |
| Incident map (`incident/map`)                         | ✓ maplibre OSM + `mapAlertMarkers` pulse markers + legend                       | `location{longitude,latitude}` on alerts |

### Traffic Analysis `/analysis` (`stat.tsx`)

| Component                                          | Current (now implemented)                                                 | Live-backend target                           |
| -------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| 4 StatCards                                        | ✓ `useTrafficSummary` → `metricsToStatCards`                              | `GET /api/traffic/summary?camera_id=ALL`      |
| Camera-wise Vehicle Count (`stat/cameraviewcount`) | ✓ `useTrafficSummary` → `per_camera`, sorted bars                         | per-camera totals (gap D)                     |
| Traffic Volume + Avg Speed (`stat/volume-speed`)   | ✓ `timeSeriesToVolumeSpeed` SVG bars + line                               | volume + avg_speed time-series (gap E)        |
| Vehicle Type Breakdown (`stat/vehicletype`)        | ✓ `typeBreakdownToPercentages` donut + total                              | `vehicle_type_breakdown` counts → %           |
| LIVE Insights (`stat/insights`)                    | ✓ `overviewInsights` (peak/slow/fast/dominant derived from `time_series`) | stable period-over-period fields (gap C)      |
| Date picker + time range dropdown                  | local UI state (kept)                                                     | drive `window.from/to` query params (pending) |

### Header / Nav (rewired)

- Header search (`header/search.tsx`) — ✓ `useSearch` (min 2 chars), grouped results, `/` shortcut, `href` navigation.
- Profile (`header/profile.tsx`) — ✓ identity from `useAuth().user` (name/department); dropdown deferred to Phase 2.
- Bell (`header/NotificationBell.tsx`) — ✓ active-alert badge + newest 6 from `useAlerts`; mark-read is Phase 2.
- Nav (`body/navigation`) — ✓ circuits from `useCameras` → `cameraCircuits()`; Admin/Logs placeholders (future: blacklist mgmt via `POST/DELETE /api/blacklist`).

### Planned features (Phase 2 — not yet built — see §7)

| Feature                                          | Status                                                | Target contract                                                            |
| ------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| Login page + auth                                | ✓ BUILT (Phase 0)                                     | `POST /api/auth/login`, refresh, `GET /api/auth/me` (§14.1)                |
| Protected routes + auth gating                   | ✓ BUILT (Phase 0); role gating + RequireRole deferred | §14.2 roles (admin/operator/viewer)                                        |
| Admin Panel (user CRUD, blacklist mgmt, cameras) | "Coming soon" placeholder                             | `GET/POST/PUT/DELETE /api/users`, `/api/blacklist`, `/api/cameras` (§14.2) |
| System Logs (audit trail)                        | "Coming soon" placeholder                             | `GET /api/logs` (§14.4)                                                    |
| Settings (display + notification prefs)          | Not built                                             | `GET/PUT /api/settings` (§14.3)                                            |
| Notification bell/dropdown + toasts              | Bell from alerts; dropdown + mark-read Phase 2        | `GET/PUT /api/notifications` + SSE (§14.5, §14.7)                          |
| Global header search                             | ✓ BUILT (mock-backed)                                 | `GET /api/search` (§14.6)                                                  |
| Camera live preview                              | "No signal" placeholder                               | `/api/cameras.stream_url` + HLS/WebRTC relay (§7)                          |
| 404 page                                         | ✓ BUILT (catch-all route)                             | — (frontend-only)                                                          |

## 5. Gaps — status after Phase 1 (✓ = frontend resolved; backend must match contract)

- **✓ Gap A — Segment-level traffic:** Frontend shipped mock endpoints `segments` + `densityForecast` (Overview charts render); backend should implement `GET /api/traffic/segments` (see Handoff §new) to match. With `VITE_DATA_SOURCE=backend` these surfaces fall back to empty states until then.
- **✓ Gap B — Alert status:** Contract `alert.ts` now has `status` (active/investigating/resolved/monitoring) driving triage UI. Backend must populate it.
- **✓ Gap C — Trend deltas:** `TrafficMetrics` includes `*_change_pct` (drives `metricsToStatCards`).
- **✓ Gap D — Per-camera counts:** `per_camera: PerCameraCount[]` in `TrafficSummaryResponse`.
- **✓ Gap E — Time-series:** `time_series: TimeSeriesPoint[]` (`time`, `volume`, `avg_speed_kmh`) in `TrafficSummaryResponse`.
- **✓ Make/Model:** `GlobalVehicle.make/model` optional fields; adapter renders `"—"` when absent.
- **✓ alert_type enum extension:** `alert.ts` includes `accident`, `wrong_way`, `signal_malfunction`, `road_construction`, `suspicious_activity`, `blacklisted_vehicle`, `route_anomaly`, `speed_violation`.
- **✓ Location name string:** `Alert.location` = `{label, latitude, longitude}` (label drives stream/incident titles).
- **✓ Heatmap severity ramp:** `severity: high|medium|low` with `types/ui/severityRamp.ts` colors; TomTom `magnitudeOfDelay` removed.
- **✓ Pagination:** `types/contract/pagination.ts` (`offset`/`limit` + `total`) with `paginate()` helper in mock middleware.
- **Camera grouping:** `CameraMeta.circuit` added + `cameraCircuits()` in nav/selector. Backend must populate it.
- **Realtime:** still polling (visibility-aware); SSE/WebSocket remains Phase 3.
- **Error envelope:** `error.code` enumerated in `types/contract/errorCodes.ts`; http layer retries 429/5xx + auto-refresh on 401.
- **✓ Endpoint drift:** frontend aligned to `/api/traffic/summary` (old `/api/traffic/overview` shelf deleted).

## 6. Suggested Phasing (P0–P3)

- **✓ P0 — Foundation (DONE):** contract types in `src/types/contract/` (mirroring §1–§14), `src/api/` client (base URL, `ApiEnvelope<T>` unwrap, typed error codes, AbortController + retry, mock/live source factory), `VITE_API_BASE_URL` + `VITE_DATA_SOURCE` + `VITE_AUTH_ENABLED`, backend/mock toggle. Auth infrastructure (`AuthProvider`, `useAuth`, `ProtectedRoute`), login page, shell (`ProtectedLayout`, `body/window` lazy routes), 404 page.
- **✓ P1 — Pure-read surfaces (DONE):** ANPR log/vehicle-info/trajectory, Incident list + alert map, Analysis stat cards + charts, camera grid/selector, Overview heatmap + event stream from alerts, header search, notification bell, profile identity. TomTom removed (`maplibre-gl` + OSM raster).
- **P2 — Auth-gated features:** role-aware nav + `RequireRole`, admin panel (user CRUD / blacklist / cameras), audit-log viewer, settings page (display + notification prefs), toast system, notification mark-read, profile dropdown.
- **P3 — Extras:** Resolve Gap A–E against backend, SSE realtime (`/api/events/stream`), camera player (HLS/WebRTC), segments/density endpoints.

_See `docs/Implementation_Plan.md` for the authoritative, file-by-file spec of all four phases._

## 7. Concrete checklist of hardcoded locations (resolved in Phase 1)

| File                                        | Hardcoded                                        | Status                                                   |
| ------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `pages/analysis/useTrafficData.ts`          | `MOCK_DATA` + dead `/api/traffic/overview` fetch | DELETED                                                  |
| `pages/analysis/incident-queue.tsx`         | 10 `INCIDENTS`                                   | rewired → `useAlerts` stream                             |
| `pages/analysis/detailF.tsx`                | counts                                           | rewired → `useAlerts`                                    |
| `pages/incident/incidents.tsx`              | 15 `HARDCODED_INCIDENTS`                         | rewired → `useAlerts` triage                             |
| `pages/incident/incidentData.ts`            | static shelf                                     | DELETED                                                  |
| `pages/page2/updates.tsx`                   | 28 `ENTRIES`                                     | rewired → `useAnprEvents`                                |
| `pages/page2/feed.tsx` / `select.tsx`       | `CAMERAS` / `NODES`                              | rewired → `useCameras`; `cameraData.ts` DELETED          |
| `pages/anpr/search.tsx`                     | default plate                                    | controlled via lifted plate state                        |
| `pages/anpr/details.tsx`                    | `rows`                                           | rewired → `useVehicleDetail`                             |
| `pages/anpr/map.tsx`                        | `CAMERA_LOCATION`, path consts                   | rewired → `useTrajectory`                                |
| `pages/incident/map.tsx`                    | `INCIDENT_1/2`                                   | rewired → `mapAlertMarkers`                              |
| `pages/stat.tsx` + `pages/stat/*`           | stat cards, hourly DATA, cam counts, donut       | rewired → `useTrafficSummary`; `analysisData.ts` DELETED |
| `body/navigation.tsx`, `header/profile.tsx` | circuit label, user identity                     | rewired → `cameraCircuits` / `useAuth().user`            |

_(Content intentionally documentation-only; no code changed.)_
