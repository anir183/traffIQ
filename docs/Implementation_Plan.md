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
- **UI states:** new `components/ui/fetch-status.tsx` (`InlineFetchStatus`) renders Loading… / Failed to load + Retry / empty-note, and returns `null` when data exists. Adopted by incident list, event stream, camera feed, ANPR log, insights, header search (error vs "No matches"), and vehicle details. Chart pages intentionally keep "—" placeholders / fill-in behavior.

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
