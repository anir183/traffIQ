# TraffIQ Frontend — Phase 0 + 1 Execution Tracker (throwaway)

Working tracker for the current session. Authoritative spec: `docs/Implementation_Plan.md`.
Updated live as work lands. Toggle from mock → live is a single env var: `VITE_DATA_SOURCE`.

**Status legend:** `[x]` done · `[~]` in progress · `[ ]` pending

---

## Decisions locked (session)

- Minimal shell composition (`ProtectedLayout` wraps existing `header.tsx` + `body.tsx`; no file moves).
- Header search (1F) built now, mock-backed, grouped results.
- Profile (1H): identity from `useAuth()` only; dropdown deferred to Phase 2.
- Notification bell re-wired to active alerts (`useAlerts`), not a separate notifications source (Phase 2).
- Phase-2-only material deferred (users/logs/notifications/settings/blacklist handlers + hooks + RequireRole).
- `segments` + `densityForecast` shipped as mock endpoints so Overview charts render identically.
- Dev proxy `/api` → `http://localhost:8080` added (inert until backend ships).
- Env defaults: `VITE_DATA_SOURCE=mock`, `VITE_API_BASE_URL=/api`, `VITE_AUTH_ENABLED=false`.

---

## Phase 0 — Foundation

| # | File(s) | Status |
|---|---|---|
| 0A | `src/types/contract/{apiEnvelope,errorCodes,pagination,anprEvent,vehicle,trajectory,trafficSummary,alert,camera,auth,user}.ts` | [ ] |
| 0B | `src/api/env.ts`, `src/api/http.ts`, `src/api/sources.ts` (+ `services/storage.ts`) | [ ] |
| 0B | `src/api/endpoints/{anpr,vehicles,cameras,traffic,alerts,auth,search}.ts` | [ ] |
| 0B | `src/api/mock/data/{anprEvents,vehicles,cameras,traffic,segments,densityForecast,alerts,users}.ts` | [ ] |
| 0B | `src/api/mock/{handlers,middleware}.ts` | [ ] |
| 0C | `src/types/ui/{incidentStatus,severityRamp,adapters}.ts` | [ ] |
| 0D | `src/auth/{types,AuthProvider,useAuth,ProtectedRoute}.tsx/.ts` | [ ] |
| 0E | `src/hooks/{useAnprEvents,useCameras,useVehicles,useTrajectory,useAlerts,useTrafficSummary,useTrafficSegments,useTrafficDensityForecast,useSearch}.ts` | [ ] |
| 0F | `src/pages/auth/LoginPage.tsx` | [ ] |
| 0G | `src/components/layout/ProtectedLayout.tsx`, `App.tsx` routes, `main.tsx` AuthProvider | [ ] |
| 0H | `src/pages/NotFound.tsx` | [ ] |
| env | `.env.example`, `.env`, `vite.config.ts` proxy | [ ] |

**Phase 0 gate:** lint + build clean; pages render identically (nothing re-wired yet).

---

## Phase 1 — Pluggable read surfaces

| # | Surface | Files | Status |
|---|---|---|---|
| 1A | Overview | `analysis/detailF`, `analysis/stataf`, `analysis/densityforecast`, `analysis/mapp` (heatmap→alerts), `analysis/incident-queue` | [ ] |
| 1B | Live Feed | `page2/feed`, `page2/updates`, `page2/camera-view`, `body/navigation` (circuits→cameras) | [ ] |
| 1C | ANPR | `anpr/search`, `anpr/details`, `anpr/map` | [ ] |
| 1D | Incidents | `incident/incidents`, `incident/map` | [ ] |
| 1E | Analysis | `stat.tsx` (4 cards + range), `stat/cameraviewcount`, `stat/volume-speed`, `stat/vehicletype`, `stat/insights` | [ ] |
| 1F | Header search | `components/forms/SearchBar.tsx` + `SearchDropdown.tsx` + `header.tsx` + `useSearch` | [ ] |
| 1G | Bell | `header/NotificationBell.tsx` → `useAlerts(active)` | [ ] |
| 1H | Profile identity | `header/profile.tsx` → `useAuth().user` | [ ] |

**Deletions at end:** `analysis/useTrafficData.ts`, `components/map/incidentsApi.ts`, `components/map/useViewportIncidents.ts`, `incident/incidentData.ts`, `stat/analysisData.ts`, `page2/cameraData.ts`, `navigation` `AREA_NODES`.

**Phase 1 gate:** lint + build clean; demo renders identical; no page imports `api/mock/` internals; no TomTom data reads.

---

## Cross-cutting rules

- Verify `npm run lint && npm run build` after every slice.
- eslint react-hooks v7: no setState synchronously in effects; full deps.
- `verbatimModuleSyntax` → type-only imports use `import type`.
- Pure adapters in `types/ui/` (no React). Hooks own fetch + abort lifecycle.
- No new dependencies.