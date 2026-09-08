# TraffIQ Frontend — Deep-Dive Findings & Integration Map

**Date:** 2026-09-08
**Scope:** Full read-through of `frontend/src`, `PLAN.md`, and `docs/Backend_Frontend_Handoff.md` to map every UI data element to its current source and its target backend endpoint.

---

## 1. Stack & Architecture

- **Framework:** React 19 + Vite 8, react-router-dom v7 (route-level lazy + Suspense), Tailwind CSS v4 (class-based dark variant with pre-paint theme script).
- **Charts:** Recharts (Overview), hand-rolled SVG (Analysis: donut, volume bars, avg-speed area).
- **Maps:** MapLibre GL via `@tomtom-org/maps-sdk` (npm). 3 maps: Overview (heatmap + severity markers), Trajectory (polyline + dots), Incident (pulse markers). Theme-aware via `setStyle('standardDark'|'standardLight')`.
- **Icons:** lucide-react.
- **Shell:** `App.tsx` → header (brand `src/assets/logo.svg`, search, profile) + `body.tsx` (nav sidebar + routed `window.tsx`).

## 2. Current Data Sources (exactly two)

1. **TomTom REST** — the only real network call: `useViewportIncidents.ts` → `incidentsApi.ts` → `traffic/services/5/incidentDetails` powers the Overview heatmap + top-12 severity markers. **Currently HTTP 403 (API credits exhausted; user-confirmed — not a code bug).**
2. **Hardcoded mock arrays/constants** everywhere else (detailed inventory in §4).

One dead scaffold: `useTrafficData.ts` contains `fetch("/api/traffic/overview")` + polling, but no caller passes `pollMs` and the URL is not in the handoff contract.

## 3. Backend Contract (from `Backend_Frontend_Handoff.md`) — what exists

| Payload | Key fields |
|---|---|
| ANPR event (§1) | `event_id`, `camera_id`, `timestamp`, `local_track_id`, `vehicle{type,type_confidence,bbox}`, `plate{text,confidence,format_valid,state_code,state_auto_corrected}`, `speed{value_kmh,estimated,direction}`, `plate_bbox`, framing |
| Global vehicle (§2) | `global_vehicle_id`, `plate_text`, `vehicle_type`, `first_seen`, `last_seen`, `camera_sequence[]`, `is_blacklisted` |
| Trajectory (§3) | `plate_text`, `global_vehicle_id`, `query_range`, `points[{camera_id, latitude, longitude, timestamp, speed_kmh, direction}]` |
| Traffic summary (§4) | `total_vehicles`, `unique_vehicles`, `avg_speed_kmh`, `congestion_score`, `density_per_km`, `vehicle_type_breakdown{car,bike,bus,truck}`; per-camera or `camera_id=ALL` |
| Alert (§5) | `alert_id`, `alert_type{blacklisted_vehicle,route_anomaly,speed_violation}`, `plate_text`, `global_vehicle_id`, `camera_id`, `timestamp`, `severity{high,...}`, `message`, `location{lat,lng}` |
| Camera meta (§7) | `camera_id`, `name`, `latitude`, `longitude`, `status`, `stream_url`, `installed_direction` |
| Envelope (§8) | `{success, data, error{code,message}, meta{request_id,timestamp}}` |
| REST (§6) | `POST/GET /api/anpr/events`, `GET /api/vehicles/{plate}`, `GET /api/vehicles/{plate}/trajectory`, `GET /api/cameras`, `GET /api/traffic/summary`, `GET /api/alerts`, `POST/DELETE /api/blacklist(/{plate})` |

## 4. Frontend Field Inventory — current source → target endpoint

### Overview `/` (`trafficanalysis.tsx`)
| Component | Current (hardcoded/TomTom) | Target |
|---|---|---|
| Critical Incidents card (`analysis/detailF`) | "2 Suspicious activities", "1 Accident" | Counts from `GET /api/alerts` grouped by `alert_type` |
| Top Congested Segments bar chart (`analysis/stataf`) | mock via `useTrafficData` | ❗ No per-segment endpoint in contract (see §5 gap A) |
| Average Speed by Segment bar chart (`analysis/stataf`) | mock via `useTrafficData` | ❗ Same gap |
| Traffic Density Forecast (`analysis/densityforecast`) | mock incl. placeholder "Future/Future+n" points | ❗ Forecast not in contract |
| Heatmap + severity markers (`analysis/mapp`) | TomTom incidents; `magnitudeOfDelay`→0-4 | Alert `location` from `GET /api/alerts`; needs severity scale mapping |
| Incident & Event Stream (`analysis/incident-queue`) | 10 mock rows; presentational `✕ ✓ • !` status | `GET /api/alerts` (+`GET /api/anpr/events`); map `message`/`camera_id`/`timestamp`/`severity` |

### Live Feed `/feed` (`livefeed.tsx`)
| Component | Current | Target |
|---|---|---|
| Node selector (`page2/select`) | `["Esplanade Circuit","Joka Circuit"]` | `GET /api/cameras` grouped by circuit/node |
| Camera grid (`page2/feed`) | 4 "No signal" boxes | `GET /api/cameras` `stream_url` (+HLS/WebRTC player; dependency missing) |
| ANPR log (`page2/updates`) | 28 mock rows | `GET /api/anpr/events` → `timestamp`, `plate.text`, `camera_id`, `vehicle.type`, `plate.confidence` |

### Trajectory Recognition `/anpr` (`anpr.tsx`)
| Component | Current | Target |
|---|---|---|
| Search tabs + input (`anpr/search`) | tabs + static "WB02AM7555"; button only `console.log` | `GET /api/vehicles/{plate}/trajectory` (plate tab) / `/api/anpr/events?camera_id=` (camera tab) |
| Vehicle Information (`anpr/details`) | mock rows (plate, type, Make/Model, First/Last Seen, 3 detections, Status:Normal) | `GET /api/vehicles/{plate}` — ❗ Make/Model not in contract; Status derives from `is_blacklisted`; detections = `camera_sequence.length` |
| Trajectory map (`anpr/map`) | hardcoded camera dot + 3-point polyline | `trajectory.points[]` polyline ordered by `timestamp`; camera dot = first point's `camera_id` |

### Incident Management `/incident` (`incidentmngmnt.tsx`)
| Component | Current | Target |
|---|---|---|
| Filter tabs + Recent Incidents (`incident/incidents`) | 15 mocks; `status: Active/Investigating/Resolved` | `GET /api/alerts` — ❗ status not in contract (see §5 gap B); titles map to `alert_type` |
| Incident map (`incident/map`) | 2 hardcoded pulse markers + legend | Alert `location`; legend Normal/Moderate/Heavy/Incident from severity/speed |

### Traffic Analysis `/analysis` (`stat.tsx`)
| Component | Current | Target |
|---|---|---|
| 4 StatCards | "125,430 / 91,245 / 32.4 km/h / 68/100" + trend % | `GET /api/traffic/summary?camera_id=ALL` — ❗ trend % not in contract (gap C) |
| Camera-wise Vehicle Count (`stat/cameraviewcount`) | 5 mocked cam counts | Per-camera totals (gap D / derived from events) |
| Traffic Volume bar chart (`stat/trafficvolume`) | hourly mock | ❗ volume time-series not in §4 shape (gap E) |
| Average Speed graph (`stat/avgspeedgraph`) | hourly mock | Bucketed `avg_speed_kmh` time-series (gap E) |
| Vehicle Type Breakdown donut (`stat/vehicletype`) | 58/26/8/6/2% + "125,430" | `vehicle_type_breakdown` counts → % |
| Date picker + time range dropdown | local UI state only | Drive `window.from/to` query params |

### Header / Nav (static today)
- Header search (`header/midsection`) — non-functional.
- Profile (`header/profile`) — "Rudraneel / Traffic Control" hardcoded.
- Nav (`body/navigation`) — "Active Circuit: Esplanade-Joka Circuit" hardcoded; Admin/Logs placeholders (future home of blacklist management via `POST/DELETE /api/blacklist`).

### Planned features (not yet built — see §7)
| Feature | Status | Target contract |
|---|---|---|
| Login page + auth | Not built — no auth code exists | `POST /api/auth/login`, refresh, `GET /api/auth/me` (§14.1) |
| Protected routes + role gating | Not built | §14.2 roles (admin/operator/viewer) |
| Admin Panel (user CRUD, blacklist mgmt, cameras) | "Coming soon" placeholder | `GET/POST/PUT/DELETE /api/users`, `/api/blacklist`, `/api/cameras` (§14.2) |
| System Logs (audit trail) | "Coming soon" placeholder | `GET /api/logs` (§14.4) |
| Settings (display + notification prefs) | Not built | `GET/PUT /api/settings` (§14.3) |
| Notification bell/dropdown + toasts | Static Bell icon only | `GET/PUT /api/notifications` + SSE (§14.5, §14.7) |
| Global header search | Non-functional input | `GET /api/search` (§14.6) |
| Camera live preview | "No signal" placeholder | `/api/cameras.stream_url` + HLS/WebRTC relay (§7) |
| 404 page | No catch-all route | — (frontend-only) |

## 5. Gaps that need Backend decisions (reflected in updated Handoff)

- **Gap A — Segment-level traffic:** "Top Congested Segments", "Average Speed by Segment", and "Traffic Density Forecast" have no endpoint. Need either `GET /api/traffic/segments` or an expanded summary payload.
- **Gap B — Alert status:** UI triage model `Active/Investigating/Resolved` is absent from contract (which only has `severity`). Recommend backend `status` field (most actionable) OR frontend-only local state.
- **Gap C — Trend deltas:** Stat cards show ±% vs previous period; contract has no period-over-period values.
- **Gap D — Per-camera counts:** Camera-wise counts need per-camera totals.
- **Gap E — Time-series:** Traffic Volume / Average Speed graphs need bucketed series over the selected window.
- **Make/Model:** Vehicle info shows make/model; contract (§2) lacks it → new optional field or frontend drops it.
- **alert_type enum extension:** UI showcases `accident`, `wrong_way`, `signal_malfunction`, `road_construction`, `suspicious_activity` which are not in the §5 enum.
- **Location name string:** Incidents/streams display road names ("Park Street") but contract only has `location{lat,lng}` → add `location_name`.
- **Heatmap severity ramp:** TomTom `magnitudeOfDelay` (0–4) drives colors; backend must expose a comparable scale or the frontend maps `severity: high|medium|low`.
- **Camera grouping:** Node selector + nav "Active Circuit" need `circuit`/`group` fields on camera meta.
- **Pagination:** Long lists (ANPR log, incident stream, incident list) use page-size pagination → standard `limit`/`offset` (+ total count) convention required.
- **Realtime:** Live feed + alerts would benefit from SSE/WebSocket push; otherwise frontend will poll (already has a visibility-aware polling pattern).
- **Error envelope:** `error.code` values should be enumerated (e.g. `PLATE_NOT_FOUND`, `NO_DATA`, `CAMERA_NOT_FOUND`) so the UI can branch on them.
- **Endpoint drift:** frontend scaffold references `/api/traffic/overview`; contract says `/api/traffic/summary` (frontend must be aligned to contract).

## 6. Suggested Phasing (P0–P3, for when build begins)

- **P0 — Foundation:** contract types in `src/types/contract/` (mirroring §1–§14), `src/api/` client (base URL, `ApiEnvelope<T>` unwrap, typed error codes, AbortController + retry, mock/live source factory), `VITE_API_BASE_URL` + `VITE_DATA_SOURCE` + `VITE_AUTH_ENABLED`, backend/mock toggle. Auth infrastructure (`AuthProvider`, `useAuth`, `ProtectedRoute`, `RequireRole`), login page, shell refactor (Header/NavSidebar/ContentWindow), 404 page. Delete dead `useTrafficData`. *(Full file-level spec: `docs/Implementation_Plan.md` Phase 0.)*
- **P1 — Pure-read surfaces:** ANPR log (`/api/anpr/events`), Vehicle info + trajectory search/map (`/api/vehicles/...`), Incident Management list + alert map markers (`/api/alerts`), Analysis stat cards + charts (`/api/traffic/summary`), camera grid/selector (`/api/cameras`), Overview heatmap + event stream from alerts, header search, notification bell, profile dropdown. Delete TomTom `fetchIncidents`/`useViewportIncidents`.
- **P2 — Auth-gated features:** role-aware nav, admin panel (user CRUD / blacklist / cameras), audit-log viewer, settings page (display + notification prefs), toast system, notification mark-read.
- **P3 — Extras:** Resolve Gap A–E with backend, SSE realtime (`/api/events/stream`), camera player (HLS/WebRTC), segments/density endpoints.

*See `docs/Implementation_Plan.md` for the authoritative, file-by-file spec of all four phases.*

## 7. Concrete checklist of hardcoded locations (future replacements)

| File | Hardcoded |
|---|---|
| `pages/analysis/useTrafficData.ts` | `MOCK_DATA` + dead `/api/traffic/overview` fetch |
| `pages/analysis/incident-queue.tsx` | 10 `INCIDENTS` |
| `pages/analysis/detailF.tsx` | counts |
| `pages/incident/incidents.tsx` | 15 `HARDCODED_INCIDENTS` |
| `pages/page2/updates.tsx` | 28 `ENTRIES` |
| `pages/page2/feed.tsx` / `select.tsx` | `CAMERAS` / `NODES` |
| `pages/anpr/search.tsx` | default plate |
| `pages/anpr/details.tsx` | `rows` |
| `pages/anpr/map.tsx` | `CAMERA_LOCATION`, `VEHICLE_START/MID/END`, paths |
| `pages/incident/map.tsx` | `INCIDENT_1/2` |
| `pages/stat.tsx` + `pages/stat/*` | stat cards, hourly DATA, 5 cam counts, donut segments, `TOTAL_VEHICLES` |
| `body/navigation.tsx`, `header/profile.tsx` | circuit label, user identity |

*(Content intentionally documentation-only; no code changed.)*