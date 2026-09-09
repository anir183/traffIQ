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

| #   | File(s)                                                                                                                                                | Status |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 0A  | `src/types/contract/{apiEnvelope,errorCodes,pagination,anprEvent,vehicle,trajectory,trafficSummary,alert,camera,auth,user}.ts`                         | [x]    |
| 0B  | `src/api/env.ts`, `src/api/http.ts`, `src/api/sources.ts` (+ `services/storage.ts`)                                                                    | [x]    |
| 0B  | `src/api/endpoints/{anpr,vehicles,cameras,traffic,alerts,auth,search}.ts`                                                                              | [x]    |
| 0B  | `src/api/mock/data/{anprEvents,vehicles,cameras,traffic,segments,densityForecast,alerts,users}.ts`                                                     | [x]    |
| 0B  | `src/api/mock/{handlers,middleware}.ts`                                                                                                                | [x]    |
| 0C  | `src/types/ui/{incidentStatus,severityRamp,adapters}.ts`                                                                                               | [x]    |
| 0D  | `src/auth/{types,AuthProvider,useAuth,ProtectedRoute}.tsx/.ts`                                                                                         | [x]    |
| 0E  | `src/hooks/{useAnprEvents,useCameras,useVehicles,useTrajectory,useAlerts,useTrafficSummary,useTrafficSegments,useTrafficDensityForecast,useSearch}.ts` | [x]    |
| 0F  | `src/pages/auth/LoginPage.tsx`                                                                                                                         | [x]    |
| 0G  | `src/components/layout/ProtectedLayout.tsx`, `App.tsx` routes, `main.tsx` AuthProvider                                                                 | [x]    |
| 0H  | `src/pages/NotFound.tsx`                                                                                                                               | [x]    |
| env | `.env.example`, `.env`, `vite.config.ts` proxy                                                                                                         | [x]    |

**Phase 0 gate:** lint + build clean; pages render identically (nothing re-wired yet).

---

## Phase 1 — Pluggable read surfaces

| #   | Surface          | Files                                                                                                                          | Status |
| --- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 1A  | Overview         | `analysis/detailF`, `analysis/stataf`, `analysis/densityforecast`, `analysis/mapp` (heatmap→alerts), `analysis/incident-queue` | [x]    |
| 1B  | Live Feed        | `page2/feed`, `page2/updates`, `page2/camera-view`, `body/navigation` (circuits→cameras)                                       | [x]    |
| 1C  | ANPR             | `anpr/search`, `anpr/details`, `anpr/map`                                                                                      | [x]    |
| 1D  | Incidents        | `incident/incidents`, `incident/map`                                                                                           | [x]    |
| 1E  | Analysis         | `stat.tsx` (4 cards + range), `stat/cameraviewcount`, `stat/volume-speed`, `stat/vehicletype`, `stat/insights`                 | [x]    |
| 1F  | Header search    | `header/search.tsx` (`useSearch` dropdown) + `header.tsx`                                                                      | [x]    |
| 1G  | Bell             | `header/NotificationBell.tsx` → `useAlerts` (active count + 6 newest)                                                          | [x]    |
| 1H  | Profile identity | `header/profile.tsx` → `useAuth().user`                                                                                        | [x]    |

**Deleted (Phase 0/1):** [`x`] `analysis/useTrafficData.ts`, [`x`] `incident/incidentData.ts`, [`x`] `stat/analysisData.ts`, [`x`] `page2/cameraData.ts`, [`x`] `navigation` `AREA_NODES`.

**Restored for the mock map viewer:** [`x`] `components/map/incidentsApi.ts`, [`x`] `components/map/useViewportIncidents.ts`, [`x`] `src/config.ts` (`VITE_TOMTOM_API_KEY`), [`x`] dependency `@tomtom-org/maps-sdk`.

**Phase 1 gate:** [`x`] PASSED — lint + build clean; demo renders identical; no page imports `api/mock/` internals.

**Map render modes:** [`x`] `mapRenderMode` in `api/sources.ts` = `isMock ? "tomtom" : "custom"`. `mock` → real TomTom SDK viewer (`TomTomMap` + `TrafficFlowModule` + `useViewportIncidents` incidents heatmap via `HEATMAP_TOMTOM` + severity markers w/ popups; needs `VITE_TOMTOM_API_KEY`); `backend` → custom maplibre renderer (OSM raster + `HEATMAP_CUSTOM` red heatmap from `useAlerts()`). Shared `components/map/heatmap.ts` gates all source/layer mutations behind the map `load` event.

**Mock API simulation:** [`x`] `mockDelay()` in `api/mock/middleware.ts` is the single choke point all mock handlers funnel through. It applies random latency (`VITE_MOCK_LATENCY_MIN_MS`/`MAX_MS`, default 300–700; `MAX=0` disables) and a random failure rate (`VITE_MOCK_FAILURE_RATE`, default 5, percent; `0` disables). Auth handlers (`login`/`refresh`/`logout`/`getMe`) opt out of failure injection (`{ failure: false }`) so boot/login is deterministic; latency still applies. Endpoint files wrap mock branches with `abortable(mock…, signal)` so aborted in-flight calls settle immediately (parity with real `fetch`). `useAsyncResource` got a per-run "latest wins" id guard so stale resolutions (search-as-you-type, refetch, future polling) never overwrite newer data. Pages surface loading/error via `components/ui/fetch-status.tsx` (`InlineFetchStatus`) instead of misleading empty states.

---

## Cross-cutting rules

- Verify `npm run lint && npm run build` after every slice.
- eslint react-hooks v7: no setState synchronously in effects; full deps.
- `verbatimModuleSyntax` → type-only imports use `import type`.
- Pure adapters in `types/ui/` (no React). Hooks own fetch + abort lifecycle.
- Map viewers: mock mode ships `@tomtom-org/maps-sdk` (real traffic viewer; `VITE_TOMTOM_API_KEY` in gitignored `.env`); `maplibre-gl` stays for the backend/custom renderer + incident/ANPR maps. No new dependencies beyond these.
