> [!IMPORTANT]
> This is the state of the project when the prototype was submitted to SIH 2026
> First Internal Selection Round in TMSL, and we were selected.

# TraffIQ — City-Wide ANPR & Traffic Intelligence

TraffIQ processes traffic-camera footage into vehicle detections, number-plate (ANPR)
reads, alerts and traffic analytics, and surfaces them live in a single operations
console. One repository with four cooperating components:

| Path              | Role                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `frontend/`       | React operations console — live feed, ANPR, incidents, analytics, maps                    |
| `backend/`        | Spring Boot API + STOMP WebSocket broker; stores detections, vehicles, alerts (PostgreSQL) |
| `ai/`             | ANPR character pipeline — plate detection through OCR                                       |
| `implementation/` | Colab harness wrapping `ai/`, emitting backend-compatible detection events                  |
| `docs/`           | Specs, handoff contracts, implementation plan, this index                                 |

## Architecture

```
traffic camera / demo clip
        │
        ▼
AI & ANPR pipeline  (ai/ + implementation/)
  detect vehicles → track → detect plates → OCR (char.pt + LPSR + TrOCR)
  → temporal plate consensus → two-line speed estimate
        │  POST /api/ml/detections  (MlDetectionRequest JSON)
        ▼
Spring Boot backend  (backend/)
  persist Vehicle / Camera / Detection / Alert (PostgreSQL + JPA)
  alert rules (speed violation, blacklist) · dashboard + traffic analysis
        │  REST /api/*          │  STOMP /ws → /topic/{detections,alerts,dashboard}
        ▼
React frontend  (frontend/)
  pluggable data layer (mock | backend, via VITE_DATA_SOURCE)
  live camera feed + HLS · ANPR log (STOMP, mock fallback) · incident mgmt · maps
```

## Technology

- **Frontend** — React 19 + Vite 8 + TypeScript (strict) + Tailwind CSS v4, react-router-dom v7, recharts, maplibre-gl + @tomtom-org/maps-sdk, hls.js, @stomp/stompjs, lucide-react
- **Backend** — Spring Boot 4.1 (Java 21, Maven), Spring Data JPA, Spring Security, WebSocket/STOMP, PostgreSQL
- **AI/ML** — Python: ultralytics (YOLO plate/vehicle detectors), yolov5 character detector, LPSR plate restoration, TrOCR fallback, OpenCV + PyTorch

## Components

**Frontend** surfaces: Overview (stat cards, congestion/density, viewport-linked stats, road heatmaps + incident markers) · Live Feed (camera wall with HLS video / snapshots / simulated feeds, ANPR detection log with STOMP live feed falling back to mock/rest) · Trajectory Recognition (plate search, vehicle details + detection history, trajectory map) · Incident Management (filterable list + map) · Traffic Analysis (volume/speed, vehicle-type breakdown, per-camera counts, insights).

**Backend** API: `POST /api/ml/detections` ingests pipeline events (upsert by `event_id`, auto-creates cameras/vehicles, runs alert rules, pushes WebSocket updates); `GET` read endpoints for detections, vehicles, alerts, dashboard, traffic analysis; STOMP `/ws` publishes `/topic/detections`, `/topic/alerts`, `/topic/dashboard`.

**AI pipeline**: plate detection (`best.pt`) → LPSR low-res restoration → character detection (`char.pt`) → reading-order clustering → Indian plate grammar/state validation → OCR (with TrOCR fallback); `TemporalPlateConsensus` stabilizes reads across frames. Models live in `ai/models/`; `scripts/setup_colab.py` pulls reference assets.

**Implementation harness**: thin adapters (vehicle detection, tracking, two-line speed, plate detection/recognition, temporal filtering) + `DetectionPipeline`; emits events in the backend's exact `MlDetectionRequest` shape; Colab notebooks 00–03.

## Running

- `frontend/` — `npm install`, `npm run dev` (mock data by default; `VITE_DATA_SOURCE=backend` for the live API)
- `backend/` — Maven (`./mvnw spring-boot:run`), requires local PostgreSQL `trafficiq_db`
- `ai/` + `implementation/` — via the Colab notebooks; see `implementation/docs/`

## Status & roadmap

Phase 0 (pluggable data layer + auth scaffold) and Phase 1 (all read surfaces) are complete and gate-clean (`tsc`, prettier, eslint, vite build). Realtime ANPR (STOMP) and HLS camera playback landed during Phase 1. Phase 2 (auth-gated users/logs/settings, blacklist handlers) and further realtime work are pending (`docs/Implementation_Plan.md`).

## Documentation

| File                               | Purpose                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `docs/Frontend_Requirements.md`    | Frontend architecture, data sources, surface-by-surface inventory       |
| `docs/Implementation_Plan.md`      | Authoritative file-by-file spec for Phases 0–3 + verification checklists |
| `docs/Backend_Frontend_Handoff.md` | API contract (envelopes, endpoints, types) and Phase 2 extensions        |
| `frontend/PLAN.md`                 | Live execution tracker for Phase 0 + 1                                   |
| `ai/README.md`, `implementation/docs/` | AI pipeline and integrated-harness guides                            |
