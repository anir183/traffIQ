# TraffIQ Frontend

Traffic-intelligence operations console: live camera feed, ANPR (trajectory recognition), incident management, and traffic analysis over a pluggable data layer.

## Stack

- React 19 + Vite 8, react-router-dom v7 (lazy routes), TypeScript (strict)
- Tailwind CSS v4 (class-based dark variant), Recharts + hand-rolled SVG charts
- MapLibre GL (`maplibre-gl`) with OSM raster tiles (dark theme via canvas filter)
- lucide-react icons

## Run

```bash
npm install
npm run dev       # dev server
npm run build     # type-check (tsc -b) + vite build
npm run lint      # prettier --check + eslint
```

Env (`.env`):

- `VITE_DATA_SOURCE=mock|backend` — swap transport with no code changes (default `mock`)
- `VITE_API_BASE_URL=/api` — live API base (default `/api`, proxied to `http://localhost:8080` in dev)
- `VITE_AUTH_ENABLED=false` — when `true`, unauthenticated users are redirected to `/login` (mock: `admin@traffiq.in` / `admin123`)

## Architecture

```
src/api/        env, http wrapper (envelope unwrap, retry, 401 auto-refresh), sources factory,
                endpoint modules, mock handlers + data
src/types/      contract/ (API payloads) + ui/ (display adapters, severity ramp)
src/hooks/      data hooks (fetch + abort lifecycle); pages never touch api/ directly
src/auth/       AuthProvider, tokens (storage), ProtectedRoute, useAuth
src/header/     search, notification bell, profile, theme toggle
src/body/       sidebar navigation (circuits from live cameras), routed content window
src/pages/      overview, feed, anpr, incident, analysis (stat), auth/login, 404
```

Pure adapters live in `src/types/ui/` (no React); hooks own fetching. With `VITE_DATA_SOURCE=mock`, all pages are demo-ready with identical payload shapes.

## Docs

Full spec / handoff / tracker: `docs/README.md` (at repo root), `frontend/PLAN.md` for the Phase 0+1 execution tracker.
