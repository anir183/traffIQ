# TraffIQ Frontend — Implementation Plan

**Date:** 2026-09-08
**Status:** Planning complete — ready for execution
**Prerequisites:** `docs/Backend_Frontend_Handoff.md` (§1–§14), `docs/Frontend_Requirements.md`

---

## Goals

1. **Zero-shape-change swap:** flip from mock → real backend with one env var, no per-component rewiring.
2. **Contract-first types:** handoff §1–§14 become typed source of truth in `src/types/contract/`.
3. **Display vs. domain separation:** UI concepts (triage status, severity ramp) adapt from backend fields via pure adapter functions — never bloating the contract.
4. **Auth-ready architecture:** login, role-based access, protected routes scaffolded from Phase 0 — toggleable via env var.
5. **Demo must not break:** `VITE_DATA_SOURCE=mock` renders identical UI to today's hardcoded version.
6. Preserve working patterns (`useListPageSize`, pagination, visibility-aware polling) and satisfy eslint react-hooks v7 rules.

---

## Environment Configuration

```
# .env (default — demo mode, no backend)
VITE_DATA_SOURCE=mock           # "mock" | "backend" (explicit, no auto)
VITE_API_BASE_URL=/api
VITE_AUTH_ENABLED=false         # mock map viewer uses TomTom SDK: set VITE_TOMTOM_API_KEY (maplibre-gl OSM raster used only for backend/custom renderer)

# Mock API simulation (mock source only)
VITE_MOCK_LATENCY_MIN_MS=300    # random latency range; MAX=0 disables
VITE_MOCK_LATENCY_MAX_MS=700
VITE_MOCK_FAILURE_RATE=5        # percent 0-100; failures skipped for auth calls

# .env.local (when backend is ready)
VITE_DATA_SOURCE=backend
VITE_API_BASE_URL=http://localhost:8000/api
VITE_AUTH_ENABLED=true
```

---

## Mock API Simulation

✓ DONE — the mock data layer simulates a real network so loading/error states are visible in demos.

- **Single choke point:** every mock handler wraps its result in `mockDelay()` (`api/mock/middleware.ts`). It applies a random latency in `[VITE_MOCK_LATENCY_MIN_MS, VITE_MOCK_LATENCY_MAX_MS]` (default 300–700ms, `MAX=0` disables) and — with probability `VITE_MOCK_FAILURE_RATE` (default 5%, percent; `0` disables) — throws `ApiError("Simulated server failure", INTERNAL, 500)`.
- **No component imports `api/mock/data` directly**, so the choke point covers all mock reads/writes.
- **Auth is deterministic:** `login`/`refresh`/`logout`/`getMe` call `mockDelay(…, { failure: false })` — latency still applies (good for the "Signing in…" UX), but no random failures on boot/login.
- **Abort parity:** all endpoint mock branches wrap the handler call with `abortable(mock…, options.signal)` (`api/mock/middleware.ts`), so an aborted request (unmount, deps change, disabled toggle, search-as-you-type) settles immediately with an `ApiError("Request aborted", INTERNAL, 0)` — mirroring real `fetch` semantics.
- **Latest-wins guard:** `useAsyncResource` tags each run with a sequence id and ignores any resolution that is no longer the latest (or arrived after cleanup) — prevents stale results under latency, fast keystrokes, refetch, and any future polling overlap.
- **UI states:** new `components/ui/fetch-status.tsx` (`InlineFetchStatus`) renders Loading… / Failed to load + Retry / empty-note, and returns `null` when data exists. Adopted by incident list, event stream, camera feed, ANPR log, insights, header search (error vs "No matches"), vehicle details, and the fullscreen camera viewer (`page2/camera-view.tsx`, whose "not found" overlay now also shows load/error states). Chart pages intentionally keep "—" placeholders / fill-in behavior.
- The camera viewer overlay (`/feed/cam/:id`) is now theme-aware (light defaults + `dark:` variants) instead of dark-only.

---

## Target Directory Structure

```
src/
├── api/                              ← data access layer (THE plug point)
│   ├── env.ts                        env vars + data-source toggle
│   ├── http.ts                       fetch wrapper: envelope unwrap, error codes, retry
│   ├── sources.ts                    factory: selects mock or live per data source
│   ├── endpoints/                    interfaces + live implementations
│   │   ├── anpr.ts                   GET/POST /api/anpr/events
│   │   ├── vehicles.ts               GET /api/vehicles/{plate}, /trajectory
│   │   ├── cameras.ts                GET /api/cameras
│   │   ├── traffic.ts                GET /api/traffic/summary (+segments/density P3)
│   │   ├── alerts.ts                 GET /api/alerts, PUT status
│   │   ├── auth.ts                   POST login/refresh/logout, GET me
│   │   ├── users.ts                  CRUD /api/users
│   │   ├── blacklist.ts              GET/POST/DELETE /api/blacklist
│   │   ├── logs.ts                   GET /api/logs
│   │   ├── notifications.ts          GET/PUT /api/notifications
│   │   ├── settings.ts               GET/PUT /api/settings
│   │   └── search.ts                 GET /api/search
│   └── mock/                         mock implementations
│       ├── data/                     raw hardcoded arrays (moved from components)
│       │   ├── anprEvents.ts
│       │   ├── vehicles.ts
│       │   ├── cameras.ts
│       │   ├── traffic.ts            (metrics, time_series, per_camera)
│       │   ├── segments.ts           (congested + speed segment charts)
│       │   ├── densityForecast.ts    (Overview density chart)
│       │   ├── alerts.ts             (EVENT_STREAM + TRIAGE alert sets)
│       │   ├── users.ts
│       │   └── (settings/logs/notifications/blacklist.ts — Phase 2)
│       ├── handlers.ts               mock endpoint implementations
│       └── middleware.ts              simulated latency, auth mock
│
├── auth/                             ← authentication infrastructure
│   ├── AuthProvider.tsx              context: user, tokens, login/logout, refresh
│   ├── useAuth.ts                    hook to consume auth context
│   ├── ProtectedRoute.tsx            wrapper: redirect if unauthenticated
│   ├── RequireRole.tsx               wrapper: 403 if wrong role
│   └── types.ts                      User, Role, AuthTokens, AuthState
│
├── types/
│   ├── contract/                     mirror Backend_Frontend_Handoff §1–§14
│   │   ├── anprEvent.ts
│   │   ├── vehicle.ts
│   │   ├── trajectory.ts
│   │   ├── trafficSummary.ts
│   │   ├── alert.ts
│   │   ├── camera.ts
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── settings.ts
│   │   ├── auditLog.ts
│   │   ├── notification.ts
│   │   ├── apiEnvelope.ts
│   │   ├── errorCodes.ts
│   │   └── pagination.ts
│   └── ui/                           display-only types + adapters
│       ├── incidentStatus.ts
│       ├── severityRamp.ts
│       ├── adapters.ts               contract → UI mappers
│       └── theme.ts
│
├── hooks/                            data hooks (consume api/, expose to components)
│   ├── useAnprEvents.ts
│   ├── useVehicles.ts
│   ├── useTrajectory.ts
│   ├── useCameras.ts
│   ├── useTrafficSummary.ts
│   ├── useAlerts.ts
│   ├── useUsers.ts
│   ├── useAuditLogs.ts
│   ├── useNotifications.ts
│   ├── useSettings.ts
│   ├── useBlacklist.ts
│   ├── useSearch.ts
│   ├── useRealtimeStream.ts
│   └── useListPageSize.ts            (existing — unchanged)
│
├── components/
│   ├── layout/
│   │   ├── ProtectedLayout.tsx       sidebar + header shell (wraps protected routes)
│   │   ├── Header.tsx                refactored: profile dropdown, notifications, search
│   │   ├── NavSidebar.tsx            refactored: role-aware admin section
│   │   ├── ContentWindow.tsx         refactored: routes + 404
│   │   ├── ProfileMenu.tsx           NEW: avatar + dropdown (Settings, Logout)
│   │   └── NotificationBell.tsx      NEW: badge + dropdown + mark-read
│   ├── ui/
│   │   ├── Card.tsx                  existing
│   │   ├── StatCard.tsx              existing
│   │   ├── Badge.tsx                 existing
│   │   ├── DataTable.tsx             NEW: reusable paginated table (generic <T>)
│   │   ├── EmptyState.tsx            NEW
│   │   ├── LoadingState.tsx          NEW
│   │   └── ErrorBoundary.tsx         NEW
│   ├── map/
│   │   ├── helpers.ts                maplibre-gl + TomTom helpers (baseStyle/applyMapTheme + ensureTomTomConfig/applyTomTomTheme/markers/fitBounds)
│   │   ├── heatmap.ts                shared heatmap controller (HEATMAP_TOMTOM/HEATMAP_CUSTOM, ensure/update, alert geo points)
│   │   ├── incidentsApi.ts           RESTORED for mock viewer (TomTom incidents by bbox)
│   │   └── useViewportIncidents.ts   RESTORED for mock viewer (viewport incidents polling)
│   ├── forms/
│   │   ├── SearchBar.tsx             NEW: debounced header search
│   │   └── SearchDropdown.tsx        NEW: grouped results dropdown
│   └── camera/
│       └── VideoPlayer.tsx           NEW: HLS/WebRTC player (Phase 3)
│
├── pages/
│   ├── auth/
│   │   └── LoginPage.tsx             NEW
│   ├── overview/                     (renamed from trafficanalysis.tsx)
│   │   ├── index.tsx
│   │   ├── CriticalIncidents.tsx
│   │   ├── Charts.tsx
│   │   ├── DensityForecast.tsx
│   │   ├── OverviewMap.tsx
│   │   └── EventStream.tsx
│   ├── feed/                         (renamed from livefeed.tsx)
│   │   ├── index.tsx
│   │   ├── CameraGrid.tsx
│   │   ├── NodeSelector.tsx
│   │   └── AnprLog.tsx
│   ├── anpr/                         (existing — rewired)
│   ├── incident/                     (existing — rewired)
│   ├── analysis/                     (renamed from stat.tsx)
│   ├── admin/
│   │   ├── index.tsx                 admin dashboard
│   │   ├── UserManagement.tsx        CRUD users + roles
│   │   ├── BlacklistManagement.tsx   add/remove plates
│   │   └── CameraManagement.tsx      view camera status
│   ├── logs/
│   │   ├── index.tsx                 audit log viewer
│   │   └── LogFilters.tsx
│   ├── settings/
│   │   ├── index.tsx                 settings tabs
│   │   ├── DisplaySettings.tsx       theme, timezone, density
│   │   └── NotificationPrefs.tsx     per-type toggles
│   └── NotFound.tsx                  404
│
├── services/
│   ├── storage.ts                    localStorage abstraction
│   ├── date.ts                       formatting helpers
│   └── validators.ts                 form validation (password, email, plate)
│
├── theme/                            (existing — unchanged)
├── index.css
├── main.tsx                          (add AuthProvider)
└── App.tsx                           (restructure routes)
```

---

## PHASE 0 — Foundation: Pluggable Data Layer + Auth Infrastructure

**Goal:** Every future phase builds on this. App renders identically to today (all mocks). Data flows through switchable layer. Auth shell exists but doesn't gate anything.

**Verification:** `npm run lint && npm run build` clean. All pages render. `/login` exists. `VITE_AUTH_ENABLED=false` → no gating.

---

### 0A. Contract Types (`src/types/contract/`)

14 files mirroring handoff §1–§14:

| File                | Source   | Key types                                                                             |
| ------------------- | -------- | ------------------------------------------------------------------------------------- |
| `anprEvent.ts`      | §1       | `AnprEvent`, `Vehicle`, `Plate`, `Speed`, `AnprEventList`                             |
| `vehicle.ts`        | §2+§12.3 | `GlobalVehicle`, `CameraSequenceEntry` + optional `make`/`model`                      |
| `trajectory.ts`     | §3       | `TrajectoryResponse`, `TrajectoryPoint`                                               |
| `trafficSummary.ts` | §4+§12.4 | `TrafficSummary`, `TrafficMetrics` (incl. `trend`, `per_camera[]`, `time_series[]`)   |
| `alert.ts`          | §5+§12.2 | `Alert`, `AlertType` (full enum), `AlertSeverity`, `AlertStatus`, `AlertList`         |
| `camera.ts`         | §7+§12.6 | `CameraMeta` with `circuit`/`group`                                                   |
| `apiEnvelope.ts`    | §8       | `ApiEnvelope<T>`, `ApiSuccess<T>`, `ApiFailure`                                       |
| `errorCodes.ts`     | §12.7    | `ErrorCode` union                                                                     |
| `pagination.ts`     | §12.1    | `Paginated<T>`, `PaginatedParams`                                                     |
| `auth.ts`           | §14      | `LoginRequest`, `LoginResponse`, `RefreshRequest`, `RefreshResponse`, `LogoutRequest` |
| `user.ts`           | §14      | `User`, `UserRole`, `UserCreate`, `UserUpdate`, `UserList`                            |
| `settings.ts`       | §14      | `UserSettings` (theme/timezone/notification_prefs/layout_density)                     |
| `auditLog.ts`       | §14      | `AuditLogEntry`, `LogAction`, `LogEntityType`, `AuditLogList`                         |
| `notification.ts`   | §14      | `Notification`, `NotificationType`, `NotificationList`, `NotificationPrefs`           |

**Rule:** These are read-only mirrors of the backend contract. Never contain UI-only fields.

### 0B. API Layer (`src/api/`)

#### `api/env.ts`

```
Exports: DATA_SOURCE ("mock"|"backend"), API_BASE_URL, AUTH_ENABLED
Source: VITE_* env vars
Default: "mock", "/api", false
```

#### `api/http.ts`

```
Exports:
  class ApiError extends Error { code: ErrorCode; retryable: boolean }
  async function request<T>(path, init?): Promise<T>
  async function requestPaginated<T>(path, params, init?): Promise<Paginated<T>>

Behavior:
  - Prepends API_BASE_URL
  - If AUTH_ENABLED: attaches Bearer token
  - Unwraps ApiEnvelope<T>: data on success, ApiError on failure
  - On 401: auto-refresh → retry once → on failure: clear tokens → /login
  - Retry once on 429/5xx
  - AbortController passthrough
```

#### `api/sources.ts`

```
Factory — single import point for all hooks:
  export const anprSource = createAnprSource();     // mock or live
  export const vehiclesSource = createVehiclesSource();
  ... (12 sources total)
```

#### Endpoint Interfaces (`api/endpoints/`)

| File               | Interface methods                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `anpr.ts`          | `list(params, signal?): Promise<Paginated<AnprEvent>>`                                                                                          |
| `vehicles.ts`      | `getByPlate(plate, signal?): Promise<GlobalVehicle>`, `getTrajectory(plate, from?, to?, signal?): Promise<TrajectoryResponse>`                  |
| `cameras.ts`       | `list(signal?): Promise<CameraMeta[]>`                                                                                                          |
| `traffic.ts`       | `summary(params, signal?): Promise<TrafficSummary>`                                                                                             |
| `alerts.ts`        | `list(params, signal?): Promise<Paginated<Alert>>`, `updateStatus(id, status): Promise<Alert>`                                                  |
| `auth.ts`          | `login(req): Promise<LoginResponse>`, `refresh(req): Promise<RefreshResponse>`, `logout(req): Promise<void>`, `me(signal?): Promise<User>`      |
| `users.ts`         | `list(params?, signal?): Promise<Paginated<User>>`, `create(req): Promise<User>`, `update(id, req): Promise<User>`, `delete(id): Promise<void>` |
| `blacklist.ts`     | `list(signal?): Promise<string[]>`, `add(plate): Promise<void>`, `remove(plate): Promise<void>`                                                 |
| `logs.ts`          | `list(params, signal?): Promise<Paginated<AuditLogEntry>>`                                                                                      |
| `notifications.ts` | `list(params, signal?): Promise<Paginated<Notification>>`, `markRead(id): Promise<void>`, `markAllRead(): Promise<void>`                        |
| `settings.ts`      | `get(signal?): Promise<UserSettings>`, `update(req): Promise<UserSettings>`                                                                     |
| `search.ts`        | `global(q, types?, limit?, signal?): Promise<SearchResult[]>`                                                                                   |

Each exports a `create*Source()` factory that returns mock or live impl based on `DATA_SOURCE`.

#### Mock Data (`api/mock/data/`)

Move every hardcoded array verbatim. Same values, same shape. Add mock data for new entities:

| File               | Moved from                                                                             | Mock additions                                           |
| ------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `anprEvents.ts`    | `page2/updates.tsx` ENTRIES (28)                                                       | —                                                        |
| `vehicles.ts`      | `anpr/details.tsx` rows + `anpr/map.tsx` consts                                        | —                                                        |
| `cameras.ts`       | `page2/feed.tsx` CAMERAS + `page2/select.tsx` NODES                                    | add `circuit` field                                      |
| `traffic.ts`       | `stat.tsx` values + `stat/*.tsx` DATA (shelf `useTrafficData.ts` deleted)              | adds `time_series`, `per_camera`, `metrics.*_change_pct` |
| `alerts.ts`        | `analysis/incident-queue.tsx` INCIDENTS + `incident/incidents.tsx` HARDCODED_INCIDENTS | merge + add `status`/`location_name`                     |
| `users.ts`         | —                                                                                      | 3 users: admin ("Rudraneel"), operator, viewer           |
| `settings.ts`      | —                                                                                      | default settings per user                                |
| `logs.ts`          | —                                                                                      | ~20 audit entries                                        |
| `notifications.ts` | —                                                                                      | ~10 notifications (mix read/unread)                      |
| `blacklist.ts`     | —                                                                                      | ~5 blacklisted plates                                    |

#### Mock Handlers (`api/mock/handlers.ts`)

All mock endpoint implementations. Each implements same interface as live. Simulates:

- Pagination (slices by limit/offset)
- Filtering (by status, type, date range)
- `DELAY_MS` (default 200ms) for realistic loading
- `LOGIN_CREDENTIALS`: `{ "admin@traffiq.in": "admin123" }`

### 0C. Adapters (`types/ui/`)

| File                | Functions                                                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `incidentStatus.ts` | `AlertStatus` → `IncidentStatus` ("Active"/"Investigating"/"Resolved")                                                                                                                                                                        |
| `severityRamp.ts`   | `severityToColor(severity, theme)`, `severityToLabel(severity)`, `severityToRank(severity)`                                                                                                                                                   |
| `adapters.ts`       | `alertToTriageStatus()`, `alertToIncidentTitle()`, `metricsToStatCards()`, `typeBreakdownToPercentages()`, `cameraToFeed()`, `vehicleToDetails()`, `pointsToTrajectory()`, `alertToIncident()`, `alertToEventStream()`, `alertToGeoFeature()` |

### 0D. Auth Infrastructure (`src/auth/`)

#### `auth/types.ts`

```ts
type UserRole = "admin" | "operator" | "viewer";
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  loading: boolean;
}
```

#### `auth/AuthProvider.tsx`

```
On mount:
  AUTH_ENABLED=false → loading=false, user=null (no gating)
  AUTH_ENABLED=true → call authSource.me() with stored refresh token
    Success → set user, loading=false
    401 → user=null, loading=false

login(email, password):
  call authSource.login() → store tokens → set user

logout():
  call authSource.logout() → clear tokens → user=null

hasRole(role): user?.role === role
hasPermission(action): role-based (future-proofed)
```

#### `auth/useAuth.ts`

Context consumer: `useContext(AuthContext)`

#### `auth/ProtectedRoute.tsx`

```
AUTH_ENABLED=false → render children
AUTH_ENABLED=true + user=null → Navigate to /login
AUTH_ENABLED=true + user + wrong role → Navigate to /
Otherwise → render children
```

#### `auth/RequireRole.tsx`

Same as ProtectedRoute but role is mandatory. Wraps admin routes.

### 0E. Data Hooks (`src/hooks/`)

Each hook: accepts params → calls `*Source.method()` → returns `{ data, loading, error, refetch }` + AbortController lifecycle.

| Hook                               | Source                           | Returns                                                           |
| ---------------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| `useAnprEvents(params)`            | `anprSource.list()`              | `{ data, total, loading, error, refetch }`                        |
| `useVehicles(plate)`               | `vehiclesSource.getByPlate()`    | `{ data, loading, error }`                                        |
| `useTrajectory(plate, from?, to?)` | `vehiclesSource.getTrajectory()` | `{ data, loading, error }`                                        |
| `useCameras()`                     | `camerasSource.list()`           | `{ data, loading, error }`                                        |
| `useTrafficSummary(params)`        | `trafficSource.summary()`        | `{ data, loading, error }`                                        |
| `useAlerts(params)`                | `alertsSource.list()`            | `{ data, total, loading, error, refetch }`                        |
| `useUsers(params)`                 | `usersSource.list()`             | `{ data, total, loading, error, refetch }`                        |
| `useAuditLogs(params)`             | `logsSource.list()`              | `{ data, total, loading, error, refetch }`                        |
| `useNotifications(params)`         | `notificationsSource.list()`     | `{ data, total, loading, error, refetch, markRead, markAllRead }` |
| `useSettings()`                    | `settingsSource.get/update()`    | `{ data, loading, error, update }`                                |
| `useBlacklist()`                   | `blacklistSource.*`              | `{ data, loading, error, add, remove }`                           |
| `useSearch(q, types?)`             | `searchSource.global()`          | `{ data, loading }` (debounced 300ms)                             |
| `useRealtimeStream()`              | `EventSource` (Phase 3)          | `{ connected, lastEvent }`                                        |

### 0F. Login Page (`pages/auth/LoginPage.tsx`)

```
Layout: centered card on dark background
Content: TraffIQ logo, email input, password input, "Sign in" button, error area
Behavior: submit → login() → success → /; error → display message
Mock: admin@traffiq.in / admin123 only
Validation: email format, password ≥8 chars
AUTH_ENABLED=false → redirect to / immediately
```

### 0G. Shell Refactor (`components/layout/`)

#### `ProtectedLayout.tsx`

Replaces `body.tsx` + `header.tsx` composition:

```
<Header />
<div>
  <NavSidebar />     (role-aware)
  <ContentWindow />  (routes + 404)
</div>
```

#### `Header.tsx` (refactored)

```
Name (logo) + SearchBar + ThemeToggle + NotificationBell + ProfileMenu
```

#### `NavSidebar.tsx` (refactored)

Admin section visible only if `user.role === "admin"`. Remove hardcoded circuit footer.

#### `ContentWindow.tsx` (refactored)

Add `<Route path="*" element={<NotFound />} />`.

### 0H. 404 Page (`pages/NotFound.tsx`)

Centered: "404 — Page not found" + link to `/`.

### 0I. File Changes Summary (Phase 0)

**Create:** ~80 files (types, api, auth, hooks, layout components, login, 404, services)
**Modify:** `main.tsx` (AuthProvider), `App.tsx` (route restructure), `navigation.tsx` (circuits → cameras), `header.tsx` (search + bell), `.env.example`
**Delete:** ✓ `useTrafficData.ts` (done in Phase 1)
**Keep:** All existing page components (rewired in Phase 1)

---

## PHASE 1 — Pluggable Read Surfaces

**Goal:** Every component that reads hardcoded data now reads through hooks + adapters. App renders identically (same data) but data path is: `component → hook → adapter → api/sources → (mock|live)`.

**Verification:** `npm run lint && npm run build` clean. All pages render. No component imports from `api/mock/` directly.

---

### 1A. Overview Page

| Component               | Old source                           | New hook                      | Adapter                                           |
| ----------------------- | ------------------------------------ | ----------------------------- | ------------------------------------------------- |
| `CriticalIncidents`     | hardcoded counts                     | `useAlerts({ alertType })`    | `group by alertType → count`                      |
| `Charts`                | `useTrafficData().congestedSegments` | `useTrafficSegments()`        | `segmentCongestionData()`                         |
| `DensityForecastChart`  | `useTrafficData().densityForecast`   | `useTrafficDensityForecast()` | `forecastToDensityPoints()`                       |
| `OverviewMap` (heatmap) | TomTom `useViewportIncidents`        | `useAlerts()`                 | `alertGeoPoints()` / `geoPointsToFeatures()`      |
| `EventStream`           | hardcoded INCIDENTS                  | `useAlerts()`                 | `incidentStreamAlerts()` → `alertToEventStream()` |

**Heatmap:** ✓ DONE — renderer is data-source driven (`mapRenderMode` in `src/api/sources.ts`): `mock` → **`tomtom`** (real TomTom SDK: `TomTomMap` + `TrafficFlowModule` + `useViewportIncidents` incidents heatmap fed via `heatmap.ts` (`HEATMAP_TOMTOM`) + severity markers w/ popups; needs `VITE_TOMTOM_API_KEY`), `backend` → **`custom`** (maplibre OSM raster + red heatmap (`HEATMAP_CUSTOM`) from `useAlerts()` → `alertGeoPoints()` / `geoPointsToFeatures()`). Shared `src/components/map/heatmap.ts` ensures the source/layer only after the map `load` event.

### 1B. Live Feed

| Component      | Old source             | New hook                            |
| -------------- | ---------------------- | ----------------------------------- |
| `CameraGrid`   | hardcoded CAMERAS      | `useCameras()`                      |
| `NodeSelector` | hardcoded NODES        | `useCameras()` → group by `circuit` |
| `AnprLog`      | hardcoded ENTRIES (28) | `useAnprEvents({ limit, offset })`  |

### 1C. Trajectory Recognition

| Component            | Old source       | New hook                         | Adapter                |
| -------------------- | ---------------- | -------------------------------- | ---------------------- |
| `PlateSearch`        | console.log      | `useTrajectory(plate)` on submit | —                      |
| `VehicleInformation` | hardcoded rows   | `useVehicles(plate)`             | `vehicleToDetails()`   |
| `TrajectoryMap`      | hardcoded consts | `useTrajectory(plate)`           | `pointsToTrajectory()` |

### 1D. Incident Management

| Component         | Old source               | New hook                               | Adapter                          |
| ----------------- | ------------------------ | -------------------------------------- | -------------------------------- |
| `RecentIncidents` | HARDCODED_INCIDENTS (15) | `useAlerts({ status, limit, offset })` | `alertToIncident()`              |
| `IncidentMap`     | 2 hardcoded markers      | `useAlerts({ status })`                | alert `location` → pulse markers |

> Mock-mode note: `useAlerts` is now sourced from real TomTom incidents in `mock` mode (Phase 1.5) when `VITE_TOMTOM_API_KEY` is set — every incident carries lat/lng, so the incident map shows live markers instead of 2 hardcoded ones.

### 1E. Traffic Analysis

| Component              | Old source         | New hook                          | Adapter                        |
| ---------------------- | ------------------ | --------------------------------- | ------------------------------ |
| `StatCard` ×4          | hardcoded values   | `useTrafficSummary({ from, to })` | `metricsToStatCards()`         |
| `CameraVehicleCount`   | 5 hardcoded counts | `useTrafficSummary()`             | `per_camera[]`                 |
| `TrafficVolumeChart`   | hourly mock        | `useTrafficSummary()`             | `time_series[].total_vehicles` |
| `AverageSpeedChart`    | hourly mock        | `useTrafficSummary()`             | `time_series[].avg_speed_kmh`  |
| `VehicleTypeBreakdown` | hardcoded %        | `useTrafficSummary()`             | `typeBreakdownToPercentages()` |
| Date/range pickers     | local state        | → `from`/`to` params              | drive `useTrafficSummary`      |

### 1F. Header Search

| File                | Purpose                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header/search.tsx` | debounced input (`useSearch(q)`, min 2 chars, `/` shortcut) + grouped results dropdown (Plates/Cameras/Incidents) with `href` links. Wired into `header.tsx`. |

> Locked decision: implemented as `header/search.tsx` (not `components/forms/SearchBar.tsx`); grouped results navigate via each `SearchResult.href`.

### 1G. Notifications Bell

| File                          | Purpose                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `header/NotificationBell.tsx` | bell icon + active-alert badge + dropdown (`useAlerts` → `activeAlertCount` + newest 6 via `activeAlerts`) |

> Locked decision: bell derives from active alerts (triage), not a separate notifications source; mark-read is Phase 2.

### 1H. Profile Identity

| File                 | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| `header/profile.tsx` | avatar + name/department from `useAuth().user` |

> Locked decision: identity-only for Phase 1; dropdown (Settings, Logout) deferred to Phase 2.

### 1I. Files to Delete (Phase 1)

| File                                     | Reason                                               | Status  |
| ---------------------------------------- | ---------------------------------------------------- | ------- |
| `components/map/incidentsApi.ts`         | TomTom data API replaced by alerts                   | RESTORED for mock map viewer (`mapRenderMode === "tomtom"`) |
| `components/map/useViewportIncidents.ts` | viewport fetching replaced by alerts hook            | RESTORED for mock map viewer |
| `pages/analysis/useTrafficData.ts`       | replaced by `useTrafficSummary`/`useTrafficSegments` | DELETED |
| `pages/incident/incidentData.ts`         | static incidents shelf                               | DELETED |
| `pages/stat/analysisData.ts`             | static analysis shelf                                | DELETED |
| `pages/page2/cameraData.ts`              | static cameras shelf                                 | DELETED |
| `src/config.ts`                          | `VITE_TOMTOM_API_KEY` unused after TomTom removal    | RESTORED (mock viewer needs the key) |
| dependency `@tomtom-org/maps-sdk`        | replaced by `maplibre-gl` (OSM raster)               | RESTORED for mock map viewer |

### Phase 1 Verification

- [x] All pages render with identical data (mock parity; insights re-derived from `time_series`, see Decisions)
- [x] No component imports from `api/mock/` directly
- [x] Heatmap renders alert geo points (custom/backend renderer)
- [x] Mock viewer renders real TomTom map (TrafficFlowModule + incidents heatmap + severity markers) when `VITE_DATA_SOURCE=mock` + `VITE_TOMTOM_API_KEY` set
- [x] ANPR search → vehicle info → trajectory map
- [ ] Date/time-range drives Traffic Analysis charts (header + range UI kept; charts not yet range-parameterized)
- [x] Header search shows results
- [x] Notification bell shows badge + dropdown
- [ ] Profile dropdown shows user + logout (identity shown; dropdown deferred to Phase 2)

---

## PHASE 1.5 — TomTom-backed mock data (incidents + traffic flow)

**Goal:** In `mock` mode, feed the live-looking datasets from the real TomTom API so the hand-maintained seed files shrink to pure fallbacks. Scope = **incident listings** and **traffic/speed**. Everything TomTom cannot provide (vehicle/ANPR counts, density, cameras, alerts triage meta) stays on the static seed files. This is a mock-mode-only optimization; the `backend` source is unchanged.

### Data sources

| Surface | TomTom API | Endpoint | Notes |
| --- | --- | --- | --- |
| Incident listings (management list + incident map + event stream + bell) | Traffic Incident Details v5 | `GET https://api.tomtom.com/traffic/services/5/incidentDetails?key=&bbox=&timeValidityFilter=present&fields={incidents{type,geometry{type,coordinates},properties{...}}}&language=en-GB` | bbox ≤ 10,000 km² (city bbox ≈ 700 km²). `fields` is strict — **no whitespace** inside braces (spaces cause `Parameter 'fields' has incorrect syntax.`). Query cached 90 s. |
| Congestion + average speed (segments cards, summary metrics) | Traffic Flow — flow segment data | `GET https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point={lat},{lon}&unit=KMPH&key=` | One call per road in a fixed ~24-point Kolkata **geometry catalog** (`src/api/tomtom/flow.ts` `ROADS`). Runs at concurrency 5, timeout 8 s, per-request failures skipped; cached 90 s. Returns `currentSpeed`, `freeFlowSpeed`, `confidence`, `roadClosure`. |

### Mapping rules (TomTom → app contracts)

- **Incidents → `Alert`** (`src/api/tomtom/incidents.ts`): `severity = f(magnitudeOfDelay)` (≥3 high, ≥1 medium, else low); `type` from `iconCategory` (1/2→`accident`, 7/13/14→`route_anomaly`, 8/9/10→`road_construction`, else `suspicious_activity`); `status` always `active` (viewport filter is `present`); `location.label` = `from → to`; lat/lng from incident geometry (fixes the incident map marker count). **high/medium → triage alerts** (incident-management list + map), **low → event-stream alerts** (Overview queue + notification bell), so both surfaces populate.
- **Flow → segments/metrics** (`src/api/tomtom/flow.ts`): congestion ratio `100 × (1 − current/free)` clamped 0–100; city summary = free-flow-speed-weighted means (`summarizeFlow`). Only `avg_speed_kmh` + `congestion_score` are overridden in the traffic summary; volumes/breakdown/per-camera stay static.
- Fallback TTL/robustness: all three TomTom sources are module-cached (90 s). If `VITE_TOMTOM_API_KEY` is unset, the request times out, or the API errors, handlers fall back to the static seed files (`alerts.ts`, `segments.ts`, `traffic.ts`) — which are **retained as fallbacks**, not deleted.

### Files

| File | Purpose | Status |
| --- | --- | --- |
| `src/api/tomtom/keys.ts` | `tomtomKeyIsSet()` guard (empty/`undefined` key detection) | [x] |
| `src/api/tomtom/flow.ts` | flow segment fetch (catalog + concurrency + cache) + flow→segments/summary derivations | [x] |
| `src/api/tomtom/incidents.ts` | city incident fetch (bbox + cache + timeout) + TomTom→`Alert` mapping | [x] |
| `src/api/mock/handlers.ts` | `getAlerts`/`getSegments`/`getTrafficSummary` call TomTom first, static as fallback | [x] |
| `src/components/map/incidentsApi.ts` | reused for the city incident fetch (existing `fetchIncidents`/`incidentAnchor`) | unchanged |

**Phase 1.5 verification:** `npm run lint && npm run build` clean · no key / offline → identical to previous static-mock rendering · key set → incident list + map show real Kolkata incidents and segments/metrics show live speeds.

---

## PHASE 1.7 — Map interactions (hover/click) + functional view modes

**Goal:** The four analysis-map modes actually switch layers, and every element on the maps shows details on hover or click. Also surface the initial incident-fetch delay with an explicit loading indicator.

### View modes

| Mode | Layer shown | Interaction |
| --- | --- | --- |
| `traffic` | TomTom raster `flow/relative` tiles (`/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=&tileSize=256`) | hover/click road-sample point → speed popup |
| `speed` | TomTom raster `flow/absolute` tiles (`/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=&tileSize=256`) | same |
| `incidents` | incident heatmap (`HEATMAP_TOMTOM`) + severity markers w/ popups | marker hover/click → incident popup |
| `nodes` | `flow-sample-points` circle layer over the fixed ~24-road geometry catalog | hover/click point → name (+ live speed when key set) |

Raster overlay helpers: `components/map/overlays.ts` (`ensureTrafficTiles`, `setLayerVisibility`, `FLOW_LAYER_RELATIVE/ABSOLUTE`). Modes applied on map `load` and on change (`applyMode` in `pages/analysis/mapp.tsx`); `TrafficFlowModule` from the SDK is no longer used — one raster mechanism for Traffic + Avg Speed.

### Interactivity

- `components/map/helpers.ts` — `bindMarkerDetails(map, marker, popup, title)`: hover opens the marker popup, mouse-leave closes it, cursor pointer + native `title` tooltip.
- `components/map/interaction.ts` — `bindFeatureHoverPopup(map, layerIds, isActive, buildContent)`: maplibre `mousemove`/`click` on geo-referenced feature layers (`queryRenderedFeatures`) → cursor pointer + popup at pointer; closes on leave; safe to bind before style load; returns a cleanup.
- `components/map/alertPopup.ts` — `buildAlertPopup(alert)`: title, severity + type, detail, location, detected-at (`formatUtcDateTime`), status, plate.
- `pages/incident/map.tsx` — every active incident now draws as a severity-colored pulse marker with a detail popup (was: high-severity only, no popups). Incident points come from `mapIncidentPoints` (all severities, carries the `Alert`).
- `pages/analysis/mapp.tsx` — `flow-roads` + `flow-sample-points` layers (live speed / free-flow / congestion / confidence from `fetchRoadFlow`, refreshed with the 90 s cache) are hoverable in all non-incidents modes; severity markers (max 12) get hover popups.
- Loading lag: pulsing `StatusPill` ("Loading incidents…" / "Updating…") on the overview map; `incident/map.tsx` shows "Loading incidents…" until the first fetch resolves. On entering Incidents mode the viewport fetcher is force-refreshed (`refresh()`).

### API references

- Traffic Map tiles (raster flow): `GET https://api.tomtom.com/traffic/map/4/tile/flow/{absolute|relative}/{z}/{x}/{y}.png?key=<key>&tileSize=256` — `relative` colors congestion vs avg flow, `absolute` colors by actual speed. Tile 256 px, EPSG:3857.
- Live per-road speeds still come from `flowSegmentData` (`api/tomtom/flow.ts`).
- No TomTom junction/nodes API exists → Nodes mode uses the road-geometry catalog points (name + live speed when available).

### Failure behavior

No key or flow fetch failure → `ensureTrafficTiles` no-ops, roads render as gray catalog points or lines without geometry (popup shows "No live flow data for this road" / pending while a fetched segment's speeds are still resolving). Incident layers unaffected. Base map always renders.

### Files

| File | Purpose | Status |
| --- | --- | --- |
| `src/components/map/overlays.ts` | raster flow tile layers + `syncFlowSamples` (interactive road lines + sample points) | [x] |
| `src/components/map/interaction.ts` | `bindFeatureHoverPopup` (hover/click feature popups) | new |
| `src/components/map/alertPopup.ts` | `buildAlertPopup` shared popup content | new |
| `src/components/map/helpers.ts` | `bindMarkerDetails` (marker hover w/ popup) | [x] |
| `src/types/ui/adapters.ts` | `mapIncidentPoints` (all severities + `alert`), `alertTypeLabel` | [x] |
| `src/pages/analysis/mapp.tsx` | functional 4-mode switcher + flow-point hover + marker hover + loading pill | [x] |
| `src/pages/incident/map.tsx` | all-incident markers + popups + loading/empty state | [x] |

**Phase 1.7 verification:** `npm run lint && npm run build` clean · hovering/clicking an incident marker or a road point opens a detail popup · mode buttons visibly switch layers · initial load shows "Loading incidents…" until data arrives.

---

## PHASE 1.8 — Road-level flow lines + legible overlays

**Goal:** Let the user hover/click *any part of a road* (not just the fixed sample points) for live flow info, and keep the incident heatmap compact enough to read when zoomed out.

### Overview map layers

| Layer | Id | Source | Where visible | Interaction |
| --- | --- | --- | --- | --- |
| road backing | `flow-roads-casing` | `flow-samples-source` | traffic / speed / nodes | none |
| road flow line | `flow-roads` | `flow-samples-source` | traffic / speed / nodes | hover/click → flow popup |
| sample points | `flow-sample-points` | `flow-samples-source` | nodes only | hover/click → flow popup |

One geojson source (`flow-samples-source`) feeds all three layers. Each catalog road becomes a `LineString` built from the fetched `flowSegmentData.coordinates` (TomTom returns `[lat, lng]` pairs — converted to `[lng, lat]`); roads without a returned segment fall back to a `Point` at their catalog coordinate. Line color follows congestion: `>= 60` red, `>= 30` amber, else green; no geometry / no data → gray.

### Changes

- `api/tomtom/flow.ts` — `FlowSample` gains `coordinates: Array<[number, number]> | null` parsed from `flowSegmentData.coordinates` (`parseCoordinates`, valid only when at least 2 points).
- `components/map/overlays.ts` — replaces `syncFlowPointLayer` with `syncFlowSamples(map, samples)` (creates/updates the casing + line + points layers on one source) and exports `setFlowSamplesVisibility` / `setFlowPointsVisibility`. Keeps `FLOW_ROADS_LAYER`, `FLOW_ROADS_CASING_LAYER`, `FLOW_POINTS_LAYER` ids.
- `components/map/heatmap.ts` — tightened paint: radius `4 → 16 px` across zoom `0 → 20` (was 15→40), intensity ≤ `2.2`, opacity `0.7` so clustered incidents don't blob at low zoom.
- `pages/analysis/mapp.tsx` — `applyMode` shows the line layers in traffic/speed/nodes and circles only in nodes; hover bindings cover `flow-roads` + `flow-sample-points`. `buildFlowSamplePopup` distinguishes "pending" (segment fetched, speeds resolving) from "No live flow data for this road" (no geometry / fetch failed).

### Failure behavior

No key or all flow fetches fail → zero `LineString`s; roads render only as gray catalog points (Nodes mode), popup reads "No live flow data…". The raster tile overlays no-op without a key. Incident and base map are unaffected.

### Files

| File | Purpose | Status |
| --- | --- | --- |
| `src/api/tomtom/flow.ts` | `FlowSample.coordinates` + `parseCoordinates` from `flowSegmentData.coordinates` | [x] |
| `src/components/map/overlays.ts` | `syncFlowSamples` + casing/line/points layers + visibility helpers | [x] |
| `src/components/map/heatmap.ts` | restrained heatmap radius/intensity/opacity | [x] |
| `src/pages/analysis/mapp.tsx` | layer wiring, hover lists, popup state ("pending" vs "No live flow data…") | [x] |

**Phase 1.8 verification:** `npm run lint && npm run build` clean · hover anywhere on a colored road line shows the flow popup · heatmap stays a compact cluster at zoom 11–13 · gate green.

---

## PHASE 2 — Auth-Gated Features

**Goal:** Full auth integration, admin panel, system logs, settings, notifications. App is feature-complete.

**Verification:** `VITE_AUTH_ENABLED=true` + `VITE_DATA_SOURCE=mock` → login works, role gating works, admin CRUD works, settings persist, notifications mark-read works.

---

### 2A. Login Polish

- Loading spinner, "Forgot password?" placeholder, form validation (email format, password ≥8 chars, mixed case + number)
- Responsive centered card

### 2B. Admin Panel (`pages/admin/`)

#### `admin/index.tsx` — Dashboard

Grid of stat cards (total users, cameras online, active alerts, blacklisted plates) + quick links to sub-pages.

#### `admin/UserManagement.tsx`

`DataTable<User>`: Name, Email, Role (badge), Created At, Actions (edit/delete).
"Add User" → modal: name, email, role select, password.
Password validation: ≥8 chars, 1 uppercase, 1 lowercase, 1 number.

#### `admin/BlacklistManagement.tsx`

`DataTable<string>`: Plate Number, Actions (remove).
"Add Plate" → input with Indian plate regex validation.

#### `admin/CameraManagement.tsx`

`DataTable<CameraMeta>`: Camera ID, Name, Circuit, Status (badge), Stream URL.
Read-only for now.

#### `components/ui/DataTable.tsx` — Reusable

Generic `<T>` paginated table. Props: `data`, `columns`, `total`, `page`, `rowsPerPage`, `onPageChange`, `actions`, `emptyMessage`. Uses `useListPageSize`.

### 2C. System Logs (`pages/logs/`)

`DataTable<AuditLogEntry>`: Timestamp, User, Action (badge), Entity, Details, IP.
Filters: User dropdown, Action type, Entity type, Date range.

### 2D. Settings (`pages/settings/`)

Tabs: Display | Notifications (Profile deferred).

**DisplaySettings:** Theme (existing toggle), Timezone dropdown, Layout Density radio. Save → `settingsSource.update()`.

**NotificationPrefs:** Toggle switches per type (alert_high, alert_medium, plate_detected, system). Save → `settingsSource.update()`.

### 2E. Toast/Snackbar System

Add `react-hot-toast`. Integration:

- Critical alerts → toast (top-right, auto-dismiss 5s)
- System notifications → toast
- Mutation success/error → toast
- Settings save → toast

### 2F. Nav Updates

Admin section: visible only if `user.role === "admin"`.
Settings: profile dropdown only (keeps nav clean).
Remove hardcoded circuit footer.

### 2G. User Registration (admin-only)

No self-registration. Accounts created by admin via User Management.
Password validation (frontend): ≥8 chars, 1 uppercase, 1 lowercase, 1 number.

### Phase 2 Verification

- [ ] Login works with mock credentials
- [ ] Unauthenticated → `/login`
- [ ] Admin → sees Admin Panel + System Logs in nav
- [ ] Operator/Viewer → these hidden
- [ ] User CRUD works (mock)
- [ ] Blacklist add/remove works
- [ ] Camera list loads
- [ ] Audit log filters + pagination work
- [ ] Settings save + persist (mock)
- [ ] Notification bell badge + dropdown + mark-read
- [ ] Toast notifications appear
- [ ] Profile dropdown: user name/role, logout works
- [ ] 404 page renders

---

## PHASE 3 — Realtime + Extras

**Goal:** Live data push, camera player, remaining endpoints. Depends on backend availability.

---

### 3A. SSE Realtime

`useRealtimeStream.ts`: opens `EventSource` to `/api/events/stream?types=alert,notification`.

- New alerts → prepend to alert list + toast (if critical)
- New notifications → update bell badge + toast
- Auto-reconnect (exponential backoff)
- Only active when `DATA_SOURCE === "backend"` AND `AUTH_ENABLED === true`

### 3B. Camera Player

Add `hls.js`. `VideoPlayer.tsx`: HLS streams → hls.js; RTSP → "Stream not supported"; WebRTC → vidstack; fallback → "No signal".

### 3C. Segment & Density Endpoints

If backend implements §12.5: charts render. If not: "Data unavailable" empty state.

### 3D. Global Search Expansion

Backend search endpoint → results across all entity types + keyboard navigation + recent searches (localStorage).

### Phase 3 Verification

- [ ] SSE reconnects on disconnect
- [ ] New alerts appear real-time
- [ ] Toast for critical alerts
- [ ] Camera player renders HLS (if available)
- [ ] Segment charts render (if backend supports)

---

## Dependencies to Add

| Package           | Phase   | Purpose             |
| ----------------- | ------- | ------------------- |
| `react-hot-toast` | Phase 2 | Toast notifications |
| `hls.js`          | Phase 3 | Camera HLS playback |

No other new dependencies. Everything built with existing stack.

---

## Files to DELETE (across all phases)

| File                                     | Phase | Reason                          |
| ---------------------------------------- | ----- | ------------------------------- |
| `pages/analysis/useTrafficData.ts`       | 0     | Replaced by `useTrafficSummary` |
| ~~`components/map/incidentsApi.ts`~~     | 1     | ~~TomTom data API replaced~~ — RESTORED for mock map viewer |
| ~~`components/map/useViewportIncidents.ts`~~ | 1 | ~~Viewport fetching replaced~~ — RESTORED for mock map viewer |

---

## Questions Resolved

| Question         | Decision                                                     |
| ---------------- | ------------------------------------------------------------ |
| Query/data layer | Custom hooks (no react-query) — keeps deps minimal           |
| Data-source mode | Explicit: `VITE_DATA_SOURCE=mock\|backend` (no auto)         |
| Alert triage     | Backend owns `status` field                                  |
| Auth flow        | JWT with refresh rotation, httpOnly cookie for refresh token |
| Roles            | admin, operator, viewer                                      |
| Registration     | Admin-only (no self-registration)                            |
| Password policy  | ≥8 chars, 1 uppercase, 1 lowercase, 1 number                 |
| Settings profile | Read-only, deferred to later                                 |
| Notifications    | Toast + bell + dropdown (all)                                |
| Header search    | Debounced, keyboard-navigable, grouped results               |
