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

| File                                     | Reason                                               | Status                                                      |
| ---------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| `components/map/incidentsApi.ts`         | TomTom data API replaced by alerts                   | RESTORED for mock map viewer (`mapRenderMode === "tomtom"`) |
| `components/map/useViewportIncidents.ts` | viewport fetching replaced by alerts hook            | RESTORED for mock map viewer                                |
| `pages/analysis/useTrafficData.ts`       | replaced by `useTrafficSummary`/`useTrafficSegments` | DELETED                                                     |
| `pages/incident/incidentData.ts`         | static incidents shelf                               | DELETED                                                     |
| `pages/stat/analysisData.ts`             | static analysis shelf                                | DELETED                                                     |
| `pages/page2/cameraData.ts`              | static cameras shelf                                 | DELETED                                                     |
| `src/config.ts`                          | `VITE_TOMTOM_API_KEY` unused after TomTom removal    | RESTORED (mock viewer needs the key)                        |
| dependency `@tomtom-org/maps-sdk`        | replaced by `maplibre-gl` (OSM raster)               | RESTORED for mock map viewer                                |

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

| Surface                                                                  | TomTom API                       | Endpoint                                                                                                                                                                                 | Notes                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Incident listings (management list + incident map + event stream + bell) | Traffic Incident Details v5      | `GET https://api.tomtom.com/traffic/services/5/incidentDetails?key=&bbox=&timeValidityFilter=present&fields={incidents{type,geometry{type,coordinates},properties{...}}}&language=en-GB` | bbox ≤ 10,000 km² (city bbox ≈ 700 km²). `fields` is strict — **no whitespace** inside braces (spaces cause `Parameter 'fields' has incorrect syntax.`). Query cached 90 s.                                                                                  |
| Congestion + average speed (segments cards, summary metrics)             | Traffic Flow — flow segment data | `GET https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point={lat},{lon}&unit=KMPH&key=`                                                                        | One call per road in a fixed ~24-point Kolkata **geometry catalog** (`src/api/tomtom/flow.ts` `ROADS`). Runs at concurrency 5, timeout 8 s, per-request failures skipped; cached 90 s. Returns `currentSpeed`, `freeFlowSpeed`, `confidence`, `roadClosure`. |

### Mapping rules (TomTom → app contracts)

- **Incidents → `Alert`** (`src/api/tomtom/incidents.ts`): `severity = f(magnitudeOfDelay)` (≥3 high, ≥1 medium, else low); `type` from `iconCategory` (1/2→`accident`, 7/13/14→`route_anomaly`, 8/9/10→`road_construction`, else `suspicious_activity`); `status` always `active` (viewport filter is `present`); `location.label` = `from → to`; lat/lng from incident geometry (fixes the incident map marker count). **high/medium → triage alerts** (incident-management list + map), **low → event-stream alerts** (Overview queue + notification bell), so both surfaces populate.
- **Flow → segments/metrics** (`src/api/tomtom/flow.ts`): congestion ratio `100 × (1 − current/free)` clamped 0–100; city summary = free-flow-speed-weighted means (`summarizeFlow`). Only `avg_speed_kmh` + `congestion_score` are overridden in the traffic summary; volumes/breakdown/per-camera stay static.
- Fallback TTL/robustness: all three TomTom sources are module-cached (90 s). If `VITE_TOMTOM_API_KEY` is unset, the request times out, or the API errors, handlers fall back to the static seed files (`alerts.ts`, `segments.ts`, `traffic.ts`) — which are **retained as fallbacks**, not deleted.

### Files

| File                                 | Purpose                                                                                | Status    |
| ------------------------------------ | -------------------------------------------------------------------------------------- | --------- |
| `src/api/tomtom/keys.ts`             | `tomtomKeyIsSet()` guard (empty/`undefined` key detection)                             | [x]       |
| `src/api/tomtom/flow.ts`             | flow segment fetch (catalog + concurrency + cache) + flow→segments/summary derivations | [x]       |
| `src/api/tomtom/incidents.ts`        | city incident fetch (bbox + cache + timeout) + TomTom→`Alert` mapping                  | [x]       |
| `src/api/mock/handlers.ts`           | `getAlerts`/`getSegments`/`getTrafficSummary` call TomTom first, static as fallback    | [x]       |
| `src/components/map/incidentsApi.ts` | reused for the city incident fetch (existing `fetchIncidents`/`incidentAnchor`)        | unchanged |

**Phase 1.5 verification:** `npm run lint && npm run build` clean · no key / offline → identical to previous static-mock rendering · key set → incident list + map show real Kolkata incidents and segments/metrics show live speeds.

---

## PHASE 1.7 — Map interactions (hover/click) + functional view modes

**Goal:** The four analysis-map modes actually switch layers, and every element on the maps shows details on hover or click. Also surface the initial incident-fetch delay with an explicit loading indicator.

### View modes

| Mode        | Layer shown                                                                                                 | Interaction                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `traffic`   | TomTom raster `flow/relative` tiles (`/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=&tileSize=256`) | hover/click road-sample point → speed popup          |
| `speed`     | TomTom raster `flow/absolute` tiles (`/traffic/map/4/tile/flow/absolute/{z}/{x}/{y}.png?key=&tileSize=256`) | same                                                 |
| `incidents` | incident heatmap (`HEATMAP_TOMTOM`) + severity markers w/ popups                                            | marker hover/click → incident popup                  |
| `nodes`     | `flow-sample-points` circle layer over the fixed ~24-road geometry catalog                                  | hover/click point → name (+ live speed when key set) |

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

| File                                | Purpose                                                                              | Status |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| `src/components/map/overlays.ts`    | raster flow tile layers + `syncFlowSamples` (interactive road lines + sample points) | [x]    |
| `src/components/map/interaction.ts` | `bindFeatureHoverPopup` (hover/click feature popups)                                 | new    |
| `src/components/map/alertPopup.ts`  | `buildAlertPopup` shared popup content                                               | new    |
| `src/components/map/helpers.ts`     | `bindMarkerDetails` (marker hover w/ popup)                                          | [x]    |
| `src/types/ui/adapters.ts`          | `mapIncidentPoints` (all severities + `alert`), `alertTypeLabel`                     | [x]    |
| `src/pages/analysis/mapp.tsx`       | functional 4-mode switcher + flow-point hover + marker hover + loading pill          | [x]    |
| `src/pages/incident/map.tsx`        | all-incident markers + popups + loading/empty state                                  | [x]    |

**Phase 1.7 verification:** `npm run lint && npm run build` clean · hovering/clicking an incident marker or a road point opens a detail popup · mode buttons visibly switch layers · initial load shows "Loading incidents…" until data arrives.

---

## PHASE 1.8 — Road-level flow lines + legible overlays

**Goal:** Let the user hover/click _any part of a road_ (not just the fixed sample points) for live flow info, and keep the incident heatmap compact enough to read when zoomed out.

### Overview map layers

| Layer          | Id                   | Source                | Where visible           | Interaction              |
| -------------- | -------------------- | --------------------- | ----------------------- | ------------------------ |
| road backing   | `flow-roads-casing`  | `flow-samples-source` | traffic / speed / nodes | none                     |
| road flow line | `flow-roads`         | `flow-samples-source` | traffic / speed / nodes | hover/click → flow popup |
| sample points  | `flow-sample-points` | `flow-samples-source` | nodes only              | hover/click → flow popup |

One geojson source (`flow-samples-source`) feeds all three layers. Each catalog road becomes a `LineString` built from the fetched `flowSegmentData.coordinates` (TomTom returns `[lat, lng]` pairs — converted to `[lng, lat]`); roads without a returned segment fall back to a `Point` at their catalog coordinate. Line color follows congestion: `>= 60` red, `>= 30` amber, else green; no geometry / no data → gray.

### Changes

- `api/tomtom/flow.ts` — `FlowSample` gains `coordinates: Array<[number, number]> | null` parsed from `flowSegmentData.coordinates` (`parseCoordinates`, valid only when at least 2 points).
- `components/map/overlays.ts` — replaces `syncFlowPointLayer` with `syncFlowSamples(map, samples)` (creates/updates the casing + line + points layers on one source) and exports `setFlowSamplesVisibility` / `setFlowPointsVisibility`. Keeps `FLOW_ROADS_LAYER`, `FLOW_ROADS_CASING_LAYER`, `FLOW_POINTS_LAYER` ids.
- `components/map/heatmap.ts` — tightened paint: radius `4 → 16 px` across zoom `0 → 20` (was 15→40), intensity ≤ `2.2`, opacity `0.7` so clustered incidents don't blob at low zoom.
- `pages/analysis/mapp.tsx` — `applyMode` shows the line layers in traffic/speed/nodes and circles only in nodes; hover bindings cover `flow-roads` + `flow-sample-points`. `buildFlowSamplePopup` distinguishes "pending" (segment fetched, speeds resolving) from "No live flow data for this road" (no geometry / fetch failed).

### Failure behavior

No key or all flow fetches fail → zero `LineString`s; roads render only as gray catalog points (Nodes mode), popup reads "No live flow data…". The raster tile overlays no-op without a key. Incident and base map are unaffected.

### Files

| File                             | Purpose                                                                          | Status |
| -------------------------------- | -------------------------------------------------------------------------------- | ------ |
| `src/api/tomtom/flow.ts`         | `FlowSample.coordinates` + `parseCoordinates` from `flowSegmentData.coordinates` | [x]    |
| `src/components/map/overlays.ts` | `syncFlowSamples` + casing/line/points layers + visibility helpers               | [x]    |
| `src/components/map/heatmap.ts`  | restrained heatmap radius/intensity/opacity                                      | [x]    |
| `src/pages/analysis/mapp.tsx`    | layer wiring, hover lists, popup state ("pending" vs "No live flow data…")       | [x]    |

**Phase 1.8 verification:** `npm run lint && npm run build` clean · hover anywhere on a colored road line shows the flow popup · heatmap stays a compact cluster at zoom 11–13 · gate green.

---

## PHASE 1.9 — Pagination windowing + live incident/event-stream updates

**Goal:** fix the duplicated paginators (page-number row overflows its container when there are many pages) and make every incident/event list truly live.

### Pagination

`components/ui/pagination.tsx` — shared, windowed page selector: `‹ 1 … page−1 page page+1 … last ›` (≤ 7 number buttons, ellipsis on both sides, `aria-current`). Replaced the 5 identical inline implementations:

| File                                | Notes                     |
| ----------------------------------- | ------------------------- |
| `pages/incident/incidents.tsx`      | Recent Incidents          |
| `pages/analysis/incident-queue.tsx` | Incident & Event Stream   |
| `pages/page2/updates.tsx`           | ANPR updates              |
| `pages/page2/feed.tsx`              | camera feed tile grid     |
| `pages/anpr/details.tsx`            | vehicle detection history |

Behavior unchanged otherwise: `safe` page clamping, `‹`/`Next ›` nav, round active dot, dark-mode variants. Rendering is bounded regardless of total page count (no more `Array.from({ length: totalPages })` in a flex row).

### Live incident/event updates

- `hooks/useAlerts.ts` — default `pollMs = 30_000` on `useAlerts()` (callers can still override/disable). All six consumers (bell, Recent Incidents, incident map, event stream panel, overview count, custom map markers) now refresh. The `fetchCityIncidentAlerts` 90 s cache + `inFlight` dedup means concurrent polls share one underlying TomTom fetch.
- `api/tomtom/incidents.ts` — `alert_id` fallback is now coordinate-based (`tt_<lng>,<lat>`) instead of array index, so IDs are stable across TomTom re-orderings (no React key churn / list flicker).
- `api/mock/data/alerts.ts` — seed timestamps generated relative to `Date.now()` (`toIsoTime` anchors to the current UTC day, falling back to yesterday if the time is in the future; event-stream entries tick backwards every 30 min; display strings reformatted via a local `formatEventTimestamp`). Removes the hardcoded Sep 2026 dates that made fallback/backend demos look permanently stale.

### Files

| File                                                                                                                                             | Purpose                                | Status |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ------ |
| `components/ui/pagination.tsx`                                                                                                                   | shared windowed `Pagination` component | new    |
| `pages/incident/incidents.tsx`, `pages/analysis/incident-queue.tsx`, `pages/page2/updates.tsx`, `pages/page2/feed.tsx`, `pages/anpr/details.tsx` | use `Pagination`                       | [x]    |
| `hooks/useAlerts.ts`                                                                                                                             | default 30 s polling                   | [x]    |
| `api/tomtom/incidents.ts`                                                                                                                        | deterministic `alert_id`               | [x]    |
| `api/mock/data/alerts.ts`                                                                                                                        | now-relative seed timestamps           | [x]    |

**Phase 1.9 verification:** `npm run lint && npm run build` clean · a list with ≥ 8 pages shows `‹ 1 … 5 6 7 … 12 ›` and stays inside its card · the bell/event-stream/incident panels update on their own while the page stays open · mock mode shows fresh timestamps.

---

## Phase 1.10 — Map mode rework (heatmap + camera icons)

### Goal

Replace raster tile overlays with flow heatmaps for traffic/speed modes, show incidents as markers only (no heatmap), and display camera-node icons via lucide-react in nodes mode.

### Changes

| Layer / mode                  | Before                                               | After                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Traffic mode                  | TomTom `flow/relative` raster tiles                  | Congestion heatmap (`HEATMAP_TOMTOM`) + `flow-roads` lines from `flowSampleFeatures`                                                                     |
| Avg Speed mode                | TomTom `flow/absolute` raster tiles                  | Speed heatmap (`HEATMAP_FLOW_SPEED`, red→amber→green) + `flow-roads` lines; feature weight encodes speed so higher speed → higher density → green        |
| Incidents mode                | Heatmap density + severity markers (max 12)          | Markers only (no heatmap); 16 px dot, 3 px white border, drop shadow; `MAX_SEVERITY_MARKERS` 12 → 40                                                     |
| Nodes mode                    | `flow-sample-points` circles                         | Lucide-react `Camera` icon (SVG data-URI → `map.addImage("camera-icon")`) via `flow-node-icons` symbol layer; circle fallback if icon registration fails |
| `CustomTrafficView` (backend) | `HEATMAP_CUSTOM` alert density heatmap for incidents | Alert-pulse markers (same as incident-management map); flow-roads + heatmap for traffic/speed (null samples → blank)                                     |

### New exports / helpers

| Export                                        | Location                   | Purpose                                                                                  |
| --------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------- |
| `HEATMAP_FLOW_SPEED`                          | `heatmap.ts`               | Red→amber→green stops for speed heatmap                                                  |
| `applyHeatmapStops(map, stops)`               | `heatmap.ts`               | Swap `heatmap-color` stops dynamically when mode changes                                 |
| `flowHeatmapFeatures(samples, mode)`          | `overlays.ts`              | Build GeoJSON points for flow heatmap from `FlowSample[]`                                |
| `registerCameraIcon(map)`                     | `overlays.ts`              | Convert lucide `Camera` to SVG data-URI → `Image` → `map.addImage("camera-icon")` (once) |
| `setFlowNodeMarkersVisibility(map, visible)`  | `overlays.ts`              | Show icons when camera icon registered, else fall back to circles                        |
| `createAlertMarker(map, point)`               | `mapp.tsx` (module helper) | Pulse marker + popup for Alert in `CustomTrafficView`                                    |
| `syncAlertMarkers(map, points, markers, fit)` | `mapp.tsx` (module helper) | Incremental alert-marker sync for `CustomTrafficView`                                    |
| `ALERT_SEVERITY_COLORS`                       | `mapp.tsx`                 | `AlertSeverity` → hex color map for custom alert markers                                 |

### Files changed

| File                         | What                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/map/heatmap.ts`  | Added `HEATMAP_FLOW_SPEED` + `applyHeatmapStops`                                                                                                                                                             |
| `components/map/overlays.ts` | Removed raster tile exports; added `flowHeatmapFeatures`, `registerCameraIcon`, `FLOW_NODE_ICONS_LAYER`, `setFlowNodeMarkersVisibility`                                                                      |
| `pages/analysis/mapp.tsx`    | `applyMode` rewired for heatmap/marker/icon modes; `createSeverityMarker` beefed (16 px, 3 px border); `CustomTrafficView` now uses alert markers + flow heatmap + camera icons; removed raster tile imports |

### Verification

`npm run lint && npm run build` clean · Traffic/Avg Speed modes show heatmap (blue→red / red→green) + road lines · Incidents mode shows only severity markers (no heatmap) · Nodes mode shows camera icons (or circles on first load before icon registers) · Custom map shows alert-pulse markers · All modes support hover popups.

---

## Phase 1.11 — Map heatmap fixes + viewport-linked dashboard stats

### Goal

Fix the invisible-traffic / uniform-red heatmap bugs, make incident markers clearly visible, and scope the four overview cards to the map's current viewport.

### Heatmap fixes (issues 1 + 2)

| Problem                        | Root cause                                                                                                    | Fix                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Traffic mode shows nothing     | All 24 features had `severity: 0` before samples load (or no key); tiny 4–16 px radius → invisible dots       | Radius 14→35 px across zoom 0→20, intensity 1.2→3.5, opacity 0.85; `flowHeatmapFeatures` uses baseline weight `0.15` when a road has no sample |
| Speed mode uniform red overlay | `HEATMAP_FLOW_SPEED[0]` was opaque `rgb(220,38,38)`; every pixel away from a feature rendered red (density=0) | First stop now `rgba(220,38,38,0)` (transparent), with a color stop added at density 0.2                                                       |

### Incident marker visibility (issue 3)

`addPulseMarker` (`components/map/helpers.ts`) gained a `size` param — `"sm"` (unchanged), `"md"`, `"lg"` (24 px wrapper / 22 px dot / ping ring). The analysis map's `createSeverityMarker` replaced its static 16 px DOM dot with `addPulseMarker(map, anchor, color, "lg")`, matching the incident-management map's animated, high-visibility presentation.

### Viewport-linked dashboard (issue 4)

| File                                                                                  | Change                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contexts/mapViewport.ts` (new)                                                       | `MapViewportContext` + `useMapViewport()` hook (no component → clean react-refresh)                                                                                                                         |
| `contexts/MapViewportProvider.tsx` (new)                                              | Provider holding `bbox` state; `setBbox` dedupes identical bounds                                                                                                                                           |
| `pages/trafficanalysis.tsx`                                                           | Wraps `<OverviewRow> + <Map> + <IncidentQueue>` in `<MapViewportProvider>`                                                                                                                                  |
| `pages/analysis/mapp.tsx`                                                             | Both views call `useMapViewport()`; new `bindViewportBroadcast(map, setBbox)` helper fires `setBbox(bboxFromMap(map))` on `moveend` (300 ms debounce) and unsubscribes on cleanup                           |
| `api/tomtom/flow.ts`                                                                  | `pointInBbox`, `filterByBbox`, `roadsInBbox`, `roadFractionInBbox`; segment outputs now include `lat`/`lon`                                                                                                 |
| `types/contract/trafficSummary.ts`                                                    | `SegmentCongestionDatum`/`SegmentSpeedDatum` gain optional `lat`/`lon`                                                                                                                                      |
| `api/mock/handlers.ts`                                                                | `getTrafficSummary(bbox?)`/`getSegments(bbox?)` filter samples with `filterByBbox` before aggregating; `getDensityForecast(bbox?)` scales points by `roadFractionInBbox` (empty points if no roads in view) |
| `api/endpoints/traffic.ts`                                                            | `TrafficRequestOptions` (extends `RequestOptions`) adds optional `bbox`; passed through to mock handlers                                                                                                    |
| `hooks/useTrafficSummary.ts`, `useTrafficSegments.ts`, `useTrafficDensityForecast.ts` | Accept optional `bbox`; included in `useAsyncResource` deps so cards re-fetch on viewport change                                                                                                            |
| `pages/analysis/overview.tsx`                                                         | Each card passes `bbox` to its hook; new `RegionBadge` ("Map region") shows while a viewport is active                                                                                                      |

### Behavior

- No bbox (initial load, no TomTom key, or CustomView before the first move) → global stats, exactly as before.
- `moveend` → 300 ms debounce → `setBbox` → hooks re-fetch (aborts stale, "latest wins") → cards show the scoped subset with a "Map region" badge.
- Static-fallback mode (no TomTom key): `getTrafficSummary`/`getSegments` return static seeds regardless of bbox (spatial filtering only applies to live TomTom samples) — intentionally simple and predictable.

### Verification

`npm run lint && npm run build` clean · Traffic shows a visible heatmap immediately (even pre-data) · Speed mode no longer paints the whole map red · Incident markers pulse and stand out · Panning/zooming the map updates the four overview cards and shows "Map region" badges · Region stats revert to global when bbox is cleared.

---

## Phase 1.12 — Continuous road heatmaps

### Goal

Fix traffic/speed heatmaps rendering as small blobs scattered across the city instead of tracing the roads.

### Root cause

`flowHeatmapFeatures` emitted exactly **one Point feature per road at its static centroid** (`[road.lon, road.lat]`): 24 dots over ~30×20 km. Roads are ~3–5 km apart, so their kernel radii (14–35 px ≈ 0.5–1.3 km at zoom 11) never overlapped → isolated sparse blobs. The fetched road polylines (`sample.coordinates`, already used by the `flow-roads` line layer) were never fed into the heatmap.

### Changes

| File                                                 | Change                                                                                                                                                                                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/map/overlays.ts` — `flowHeatmapFeatures` | For each road with `sample.coordinates` (≥2 vertices) emits **one Feature per polyline vertex**, each carrying that road's severity weight (traffic congestion / speed / 0.15 baseline). Roads without geometry keep the single centroid fallback feature |
| `components/map/heatmap.ts`                          | Paint retune for continuous coverage: `heatmap-intensity` max 3.5 → 2.8, `heatmap-opacity` 0.85 → 0.7 (radius unchanged 14→35 px)                                                                                                                         |

### Behavior

- Traffic/speed modes: heatmap continuously traces each road's geometry, colored by per-road weight; overlapping vertices along a road accumulate so density/color reflect the road's level.
- Pre-data / no-key custom view (`flowHeatmapFeatures(null, …)`): unchanged centroid-dot fallback (no geometry available in that path) — intentionally simple.

### Verification

`npm run lint && npm run build` clean · Heatmap follows the roads as continuous colored bands (blue→red for congestion, red→amber→green for speed) · No sparse isolated dots between roads · No uniform wash.

---

## Phase 1.13 — Always-visible roads with status popup

### Goal

Fix the hover crash (`The layer 'flow-roads' does not exist in the map's style`) and make road lines, heatmap ribbons, and per-road info work reliably regardless of TomTom fetch failures, rate limits, or a missing key. Replace the notion of a per-road "density number" with a traffic-status label.

### Root causes

1. `bindFeatureHoverPopup` called `map.queryRenderedFeatures(point, { layers })` with layer ids that may not exist yet/didn't get created → MapLibre throws on every `mousemove`, and the popup never opens.
2. Layers were only created inside `applyMode`, which was invoked via `registerCameraIcon(...).then(...)` on `load`. Any hiccup in that async chain (e.g., a resolution after React StrictMode's cleanup removed the first map) meant `applyMode` never ran → no source/layers at all.
3. Roads whose per-road TomTom query failed had no geometry → a bare invisible Point → no visible line and near-impossible to hover; heatmap degraded to sparse blobs.

### Changes

| File                            | Change                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/tomtom/flow.ts`            | `FlowSample` gains `roadClosure` (captured in `parseSample`); new `roadFallbackGeometry(road)` — deterministic 3-point schematic polyline (~1.3 km each way) through the centroid along a name-hash bearing                                                                                                                                                                |
| `components/map/overlays.ts`    | `flowSampleFeatures`/`flowHeatmapFeatures` use `sample.coordinates ?? roadFallbackGeometry(road)` → lines + heatmap always trace roads; features expose `closed`; new `FLOW_ROADS_HOVER_LAYER` (line-width 14, line-opacity 0) added in `syncFlowSamples` for a generous, always-queryable hover hit-area                                                                  |
| `components/map/interaction.ts` | `showFeature` filters the layer list to existing layers and wraps the query in try/catch — shape change only, never throws                                                                                                                                                                                                                                                 |
| `pages/analysis/mapp.tsx`       | `applyMode` runs immediately on `load`, with `void registerCameraIcon(...).then(() => applyMode(...))` as an idempotent re-run; hover lists (both views) include `FLOW_ROADS_HOVER_LAYER`; `buildFlowSamplePopup` leads with a `trafficStatusLabel` chip — Road closed (red) / Congested ≥60% (red) / Heavy traffic ≥30% (amber) / Free-flow (green) / No live data (gray) |

### Behavior

- Hovering a road (traffic/speed/nodes) always opens the popup: status chip, avg speed, free-flow, congestion %, confidence. No console crash when layers are absent.
- Roads always draw as colored lines (gray = fallback/no live data, red/amber/green by congestion) and the heatmap always traces them — even with failed fetches or no TomTom key, and in the custom/backend view.
- Fallback geometry is consciously schematic (not true road alignment) — flagged by the gray "No live data" state.

### Verification

`npm run lint && npm run build` clean · No "layer 'flow-roads' does not exist" in console; hovering shows the status popup · Traffic/speed/nodes modes all show road lines + heatmap ribbons immediately, even on fetch failure.

---

## Phase 1.14 — Remake traffic + speed modes (native TomTom flow / network-wide speed heatmap)

### Goal

Replace the Phase 1.12–1.13 line/vertex-heatmap approach for **traffic** and **speed** modes (reported: random white lines, blob dots at segment ends/centers, and the heatmap "breaking" when switching modes). Traffic = **native TomTom `TrafficFlowModule` segments** (the familiar live-flow look); speed = a **custom full-network heatmap** harvested from the same flow tiles. Both keep per-road hover details. Incidents/nodes modes are untouched. Data stays mock/demo (TomTom API); real data will come from the backend — everything below is built around a neutral contract so that later switch is a one-function swap.

### Design (mock → backend seam)

- **Neutral contract:** `FlowSample[]` (`api/tomtom/flow.ts`, unchanged) is the boundary. `roadName`, `currentSpeed`, `freeFlowSpeed`, `confidence`, `roadClosure`, `coordinates` — all map-agnostic.
- **TomTom-specific code stays in `api/tomtom/`:** `startFlowModule` + `harvestFlowSamples` are the only functions that know about `TrafficFlowModule` / vector-tile property names. A backend swap replaces these two with a fetch that returns the same `FlowSample[]`; `components/map/flowHeatmap.ts` and `pages/analysis/mapp.tsx` don't change.
- **No style guessing:** the flow vector tile's `source-layer` is read from the live style (`map.getStyle().layers` → that source's `source-layer`), cached per map (`WeakMap`), so `querySourceFeatures` works against the real tiling even though the module runs hidden.

### Changes

| File                                            | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/tomtom/viewportFlow.ts` (new)              | `startFlowModule(sdkMap)` — `TrafficFlowModule.get(map, { visible: false, filters: { any: [{ roadCategories: { show: "only", values: [motorway…service] } }] } })`; the module is attached but hidden so it acts as a pure vector-tile data source. `harvestFlowSamples(map)` → `map.querySourceFeatures(TRAFFIC_FLOW_SOURCE_ID, { sourceLayer })` mapping raw snake_case tile props (`relative_speed`, `absolute_speed`, `road_closure`, `road_category`) to `FlowSample[]` (free-flow = `absolute/relative`, confidence = `relative×100`); returns `[]` when the source is absent and never throws. `isFlowSegmentFeature` / `normalizeFlowFeatureProps` adapt raw tile props for popups. `resolveFlowSourceLayer` reads the source-layer from the live style                                                            |
| `components/map/flowHeatmap.ts` (new)           | `speedHeatmapFeatures(samples: FlowSample[])` — densifies each polyline to ~200 m spacing (`STEP_DEG 0.0018`) so heatmap kernels fuse into continuous ribbons, taper at segment ends, and attach popup props (`name`, `currentSpeed`, `freeFlowSpeed`, `confidence`, `congestion`, `closed`). Weight = `currentSpeed/100` (clamped, closed→0) so the red→amber→green `HEATMAP_FLOW_SPEED` ramp renders slow=red, fast=green. Neutral to source: same function works for backend data                                                                                                                                                                                                                                                                                                                                       |
| `components/map/heatmap.ts`                     | `HEATMAP_SOURCE_ID`/`HEATMAP_LAYER_ID`/`HEATMAP_HOVER_LAYER` exported constants; `ensureHeatmapSource` now verifies source AND both layers and rebuilds wholesale if any piece is missing (kills the silent-skip "heatmap breaks on switch"); adds a transparent `traffic-heatmap-hover` circle layer (r 9) as the hover hit-area; helpers use the constants                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `components/map/interaction.ts`                 | `bindFeatureHoverPopup` gains optional `pickFallback` — when the managed-layer query finds nothing it runs an unrestricted `queryRenderedFeatures(point)` and lets the caller pick/normalize a feature (used to hover the native TomTom segments, which own no layer we manage); query wrapped in try/catch                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `pages/analysis/mapp.tsx` (`TomTomTrafficView`) | `flowModuleRef` holds the module; on init (guarded, StrictMode-safe) apply is re-run when ready. `applyMode` matrix: **traffic** = module visible + heatmap/road-lines hidden (native segments render); **speed** = module hidden + `ensureHeatmapSource`/`applyHeatmapStops(HEATMAP_FLOW_SPEED)`/`refreshSpeedHeatmap`; **nodes** = `flow-samples` lines visible (unchanged); **incidents** = markers only. `refreshSpeedHeatmap` guards on `mode === "speed"` + source present, harvests viewport flow and restamps the heatmap. Viewport rebuild via debounced `sourcedata` (`sourceId === "vectorTilesFlow" && isSourceLoaded`) + `moveend` handlers. Hover list includes the heatmap + hover layers and passes a fallback that recognizes native segment props and normalizes them for the existing status-chip popup |

### Behavior

- **Traffic:** live TomTom flow segments, color-coded by jam factor, exactly the pre-rework SDK look; hovering any segment opens the status popup (Road closed / Congested / Heavy / Free-flow + speed/free-flow/confidence).
- **Speed:** network-wide continuous heatmap in the red→amber→green speed ramp across every flow segment in the viewport; rebuilds as you pan/zoom (debounced 200 ms); hovering reads the same popup. No native segments underneath (module hidden) → clean visuals.
- **Switching** between all four modes is deterministic: every `applyMode` re-derives visibility from scratch and `ensureHeatmapSource` self-heals, so no mode can leave layers half-visible.
- **Demo/backend seam:** replace `startFlowModule` + `harvestFlowSamples` with a backend-backed function returning `FlowSample[]` → traffic mode can keep showing the same heatmap/hover, or switch traffic to a backend status layer; speed mode and popups are unchanged.

### Verification

`npm run format && npx tsc -b && npm run lint && npm run build` all clean. Dev: (a) traffic mode shows live segments with hover popups; (b) speed mode shows a continuous speed heatmap that updates on pan/zoom, no white lines / no blob artifacts; (c) rapid mode switching traffic→speed→nodes→incidents never leaves stale layers or throws; (d) hover works in traffic (native segments) and speed (heatmap).

---

## Phase 1.15 — Clamp the speed heatmap + survive WebGL context loss

### Goal

Speed mode was rendering a heatmap that washed out the entire viewport and could crash the WebGL context (followed by a MapLibre restore that re-applied only the SDK style and then a churn loop of our effects failing against the half-rebuilt style). Core fixes: bound the heatmap's point/kernel footprint so it reads as thin readable ribbons, and make every custom style mutation idempotent + exception-safe and re-run `applyMode` after a context restore so the map always self-heals.

### Root causes (verified in maplibre source)

1. `map.querySourceFeatures` returns features with geometry already projected to real lng/lat (`util/vectortile_to_geojson.ts` `projectPoint`), and `getRenderableIds()` includes **overscaled zoom levels** → the same road is harvested per tile replica. Harvesting every viewport segment × ~200 m densification produced thousands of points with weight floor 0.05–0.25 and a big kernel (radius 14–35 px, intensity ≤2.8) → overlapping kernels merged into a full-screen glow (no per-road readability) and put heavy load on the GPU.
2. On `webglcontextlost`, MapLibre captures the style and on restore calls `setStyle(saved, {diff:false})` (`ui/map.ts` `_contextRestored`) — which **rebuilds only the SDK/static style**, dropping our geojson sources/layers (`traffic-heatmap-source`, `flow-samples-source`, …). During that window our previously registered `sourcedata`/`moveend`/`applyMode` paths called `addLayer`/`setPaintProperty`/`setData` against a not-yet-loaded style → MapLibre fell back to full style rebuilds ("Unable to perform style diff… Rebuilding the style from scratch"), spurious validation errors (e.g. `flow-roads.paint.line-color` "Expected an odd number of arguments" — a valid `case` expression mis-validated mid-diff), and repeated context loss. Nothing re-ran `applyMode` after restore → permanent broken map.

### Changes

| File                            | Change                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/map/flowHeatmap.ts` | `MAX_HEATMAP_POINTS = 2500`; after densifying, if the feature list exceeds the budget apply an even stride (`index % stride === 0`) so count is bounded while coverage is preserved. Weight clamp narrowed from `[0.05, 1]` to `[0.15, 0.95]` (unknown → 0.15, closed → 0, end taper 0.6) so free-flow roads can't saturate the ramp                                            |
| `components/map/heatmap.ts`     | Kernel clamped to ribbons: radius `0→10 / 12→15 / 16→19 / 20→24`, intensity `0→1.0 / 15→1.6`, opacity 0.8. `ensureHeatmapSource`, `updateHeatmapData`, `applyHeatmapStops` wrapped in try/catch so they never throw mid style-rebuild                                                                                                                                           |
| `components/map/overlays.ts`    | `syncFlowSamples` returns unless `map.isStyleLoaded()` and wraps its `addSource`/`addLayer` chain in try/catch so it can't fire during a style rebuild                                                                                                                                                                                                                          |
| `pages/analysis/mapp.tsx`       | `refreshSpeedHeatmap` additionally skips unless `map.isStyleLoaded()`. The speed rebuild debounce is 350 ms and the timeout itself re-checks `isStyleLoaded()`. New `webglcontextrestored` listener re-runs `applyMode(map, modeRef.current)` (creates flow-samples + heatmap sources/layers afresh, restores module visibility and incident markers) and is removed on unmount |

### Behavior

- **Speed** renders the whole network as thin continuous ribbons (green fast → red slow) instead of a full-screen glow; panning/zooming rebuilds efficiently (~≤2500 points) and no longer exhausts the GPU.
- **Resilience:** style mutations are no-op-safe during style rebuilds (guarded + try/catch), and if a WebGL context loss still happens the map re-creates its overlays and keeps working instead of error-looping.
- Traffic (native segments), incidents, and nodes are unchanged.

### Verification

`npm run format && npx tsc -b && npm run lint && npm run build` all clean. Dev: speed mode shows readable network ribbons (no wash), pan/zoom in speed mode causes no crash/"WebGL context was lost" loop, rapid mode switching stays clean, and forcing a context loss is recoverable in place.

---

## Phase 1.16 — Restore speed ribbons, kill ghost popups, clean node lines

### Goal

Phase 1.15's clamps swung the speed heatmap from "full-screen wash" to "not visibly rendering at all", road-info popups could appear over invisible roads in traffic/speed, and nodes mode showed the white casing aesthetic the earlier iteration was rejected for. This phase makes the speed pipeline deterministically visible + self-healing, gates hover targets to what is actually drawn, and removes the white casing layer.

### Root causes (verified in maplibre source)

1. **Blank speed mode.** (a) `ensureHeatmapSource` rebuild path called `map.removeSource(HEATMAP_SOURCE_ID)` while `HEATMAP_LAYER_ID`/`HEATMAP_HOVER_LAYER` still referenced it — `style.removeSource` (and the `Style.emit` for the error) **throws** when any layer uses the source, so the removeSource failure aborted inside the try/catch and left the heatmap half-dead whenever a partial state was discovered. (b) The 350 ms debounced rebuild depended on a cascade of soft conditions (`isStyleLoaded()`, `getSource(FLOW_SOURCE_ID)`, tile-loaded `sourcedata` events, the resolved source-layer name) — any single missed signal meant the heatmap stayed empty forever with no further trigger.
2. **Random road-info popups.** `FLOW_ROADS_HOVER_LAYER` (the invisible 14 px line hit-area added in 1.13) had default `visibility: visible` and was in the hover-layer list in every mode, even though the roads it shadows are only drawn in nodes mode (`setFlowSamplesVisibility(next === "nodes")`). Hovering over empty-looking space in traffic/speed still hit those hidden 14 px polylines → status popups "for no reason". A popup opened in one mode also stayed open across a mode switch (only the next mousemove/leave closed it).
3. **Node-mode white flow lines.** `FLOW_ROADS_CASING_LAYER` (7 px white `#ffffff`, opacity 0.9) — the same white-casing under the colored roads that the rejected earlier heatmap iteration drew — was re-enabled in nodes mode.

### Changes

| File                            | Change                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components/map/heatmap.ts`     | `ensureHeatmapSource` now removes `HEATMAP_LAYER_ID` + `HEATMAP_HOVER_LAYER` **before** calling `removeSource`, so the wholesale recreate never trips maplibre's removeSource-with-layers throw and always converges in any partial state. Kernel retuned to clearly-visible ribbons: radius `0→12 / 12→18 / 16→22 / 20→28`, intensity `0→1.5 / 15→2.2`, opacity 0.85                                                    |
| `components/map/flowHeatmap.ts` | Weight floor `0.15 → 0.2` (unknown speed), end taper `0.6 → 0.65` so sparse stride-de-sampled points still register above the transparent ramp bucket                                                                                                                                                                                                                                                                    |
| `api/tomtom/viewportFlow.ts`    | `resolveFlowSourceLayer` only writes the `WeakMap` cache when a flow layer actually matched; if none matched it returns the "Flow" fallback but caches nothing, so a stale fallback can't poison harvesting for the map's lifetime                                                                                                                                                                                       |
| `components/map/interaction.ts` | New module-level `WeakMap<MapLibreMap, Popup>` of the live hover popup per map; new exported `closeHoverPopups(map)` removes it. `close()` also deletes the weakmap entry                                                                                                                                                                                                                                                |
| `components/map/overlays.ts`    | Deleted `FLOW_ROADS_CASING_LAYER` (constant, its `addLayer`, and its line in `setFlowSamplesVisibility`). `setFlowSamplesVisibility` now toggles `FLOW_ROADS_HOVER_LAYER` in lock-step with `FLOW_ROADS_LAYER` (hover hit-area only live where roads are actually drawn); hover layer's initial layout is now `visibility: "none"`                                                                                       |
| `pages/analysis/mapp.tsx`       | `applyMode` (both views) calls `closeHoverPopups(map)` so no popup survives a mode switch. Speed self-heal: `lastSpeedRefreshRef` timestamp set on every refresh + a 2 s watchdog interval that refreshes when speed is active, style loaded, and the last refresh is ≥6 s stale — guarantees the heatmap appears even if every tile/style event was missed. `zoomend` joins `sourcedata`/`moveend` as a rebuild trigger |

### Behavior

- **Speed** shows clear green→amber→red network ribbons again (readable, no full-screen wash), and self-heals: even if the initial harvest was empty or all event signals were missed, the watchdog repaints within seconds.
- **Popups** only appear over content that is actually on-screen (roads in nodes, native segments in traffic via fallback, heatmap ribbons in speed); nothing lingers across a mode switch.
- **Nodes** shows colored status roads + sample points + camera icons with no white casing. Traffic and incidents are untouched.

### Verification

`npm run format && npx tsc -b && npm run lint && npm run build` all clean. Dev: speed shows visible ribbons immediately and after pan/zoom without ever staying blank; hovering empty space in traffic/speed shows no popup; switching modes leaves no stale popup or layer; nodes mode is clean (no white lines).

---

## Phase 1.17 — Give Incident & Event Stream live incidents; decouple Avg Speed from SDK tile harvest

### Goal

Two live-data defects surfaced after 1.16. (1) The Analysis **"Incident & Event Stream"** panel and the **Recent Incidents** list never showed live TomTom incidents: `buildAlert` only attached `event_stream` to **low-severity** incidents, and live incidents are almost always high/medium, so the stream stayed "No incidents to show." while the map was full of markers. (2) The **Avg Speed** tab was empty: it was the only view on the TomTom map harvested from the SDK vector-flow source (`harvestFlowSamples`/`resolveFlowSourceLayer` → `querySourceFeatures("vectorTilesFlow")`); with the module hidden or tiles not loaded for that path it yielded zero features and had no fallback, so no heatmap ever painted.

### Root causes

1. `api/tomtom/incidents.ts` `buildAlert` returned the alert _without_ `event_stream` whenever `severity !== "low"`. Since the stream/triage selectors partition on `event_stream`, the Event Stream showed only low-severity scrape artifacts while the triage list showed the rest — and whichever side the real incidents fell on appeared empty.
2. TomTom `Avg Speed` heatmap was fed by live vector-tile harvesting of `vectorTilesFlow` (`viewportFlow.ts`). The SDK traffic/flow module starts hidden, and the tap point (`mapp.tsx:refreshSpeedHeatmap`) had no fallback dataset — contrast traffic/nodes which render SDK-native or the catalog roads. So the tab could stay empty indefinitely for exactly the user who has a key set. The same live average-speed data was already proven elsewhere via `fetchRoadFlow()` + the 24-road catalog (`flowHeatmapFeatures`), which powers the overview Average-Speed chart.

### Changes

| File                            | Change                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/tomtom/incidents.ts`       | Removed the `if (severity !== "low") return base;` early-exit in `buildAlert`; **every** live incident now carries an `event_stream` (status `warning` when `magnitudeOfDelay >= 2`, else `neutral`). The Event Stream therefore shows the live incidents that match the map, at every severity.                                                                                   |
| `types/ui/adapters.ts`          | Added `listIncidentAlerts(alerts) = alerts.filter(a => a.alert_id.startsWith("tt_")                                                                                                                                                                                                                                                                                                |     | !hasEventStream(a))`— live incidents (id prefix`tt_`) plus static triage — and removed the now-unused `triageAlerts`. Keeps the static/mock list behavior identical (stream system events stay out of Recent Incidents) while the live list mirrors the map. |
| `pages/incident/incidents.tsx`  | `Recent Incidents`/`Incident Logs` now source from `listIncidentAlerts` instead of `triageAlerts`, so with a key set the list populates from live incidents instead of being "empty by partition".                                                                                                                                                                                 |
| `pages/analysis/mapp.tsx`       | `TomTomTrafficView.refreshSpeedHeatmap` no longer gates on `getSource(FLOW_SOURCE_ID)` and now paints `flowHeatmapFeatures(samplesRef.current, "speed")` (the same `fetchRoadFlow` catalog dataset as the overview chart) instead of `speedHeatmapFeatures(harvestFlowSamples(map))`. Scheduled refreshes (source/moveend/zoomend/watchdog) keep re-rendering the same sample set. |
| `api/tomtom/viewportFlow.ts`    | Deleted the now-dead tile-harvest path: `resolveFlowSourceLayer`, its `flowSourceLayerCache`, `harvestFlowSamples`, `RawFlowFeature`, and the `MapLibreMap`/`FlowSample` imports. `startFlowModule`, `FLOW_SOURCE_ID`, `isFlowSegmentFeature`, `normalizeFlowFeatureProps` remain (traffic-mode hover popups still need them).                                                     |
| `components/map/flowHeatmap.ts` | **Deleted** — its only export `speedHeatmapFeatures` (harvester→point-ribbons) has no callers left.                                                                                                                                                                                                                                                                                |

### Behavior

- **Incident & Event Stream**: shows live incidents while the key is set (all severities; warning/neutral per `magnitudeOfDelay`), matching the map markers; still shows mock system events when no key.
- **Recent Incidents / Incident logs**: populated from live incidents when keyed; unchanged (triage-only) in mock mode.
- **Avg Speed**: always paints — 24 Kolkata roads with live `currentSpeed` colors (slow red → fast green) and schematic fallback geometry per road even if the flow fetch fails; no longer depends on the SDK tile source. Traffic/nodes/incidents untouched.

### Verification

`npm run format && npx tsc -b && npm run lint && npm run build` all clean. Dev (key set): event stream lists live incidents and updates on poll; incident list is populated; switching the map to Avg Speed paints the network heatmap immediately (no blank); mock mode still shows system events in the stream.

---

## Phase 1.18 — Drop the Avg Speed map mode; Incident Management runs on the mock detection corpus

### Goal

Product direction after 1.17: the **Avg Speed map mode** (red→amber→green network heatmap) is redundant next to Traffic, and the **Incident Management** tab was echoing the overview's live TomTom incidents — the same population as the analysis "Incident & Event Stream" panel (redundant). The Incident Management tab should instead showcase the platform's own **vehicle + camera processed detections** (blacklisted vehicle, speed violation, wrong-way, signal malfunction, accident, route anomaly, road construction — the `mock/data/alerts.ts` seed corpus), with the map plotting points from that mock data. The overview map + analysis stream keep TomTom.

### Changes

| File                           | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pages/analysis/mapp.tsx`      | `MapMode` narrowed to `"traffic" \| "incidents" \| "nodes"`; the **Avg Speed** switcher entry is gone. `TomTomTrafficView` lost the speed heatmap dependencies (`refreshSpeedHeatmap`, `lastSpeedRefreshRef`/`heatmapTimerRef`/`watchdogTimerRef`), the speed branch + heatmap-layer hide in `applyMode`, and the speed scheduling/watchdog effect — only a slim `webglcontextrestored → applyMode` self-heal survives. `CustomTrafficView` computes its (traffic-only) congestion heatmap with `HEATMAP_TOMTOM` + `flowHeatmapFeatures(null)`. |
| `components/map/heatmap.ts`    | Deleted the unused `HEATMAP_FLOW_SPEED` ramp.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `components/map/overlays.ts`   | `flowHeatmapFeatures` lost its `mode: "traffic" \| "speed"` switch — it now always emits congestion weights (the speed-greens variant is gone).                                                                                                                                                                                                                                                                                                                                                                                                 |
| `api/mock/handlers.ts`         | Extracted shared `filterAlerts(alerts, {status,type,severity})`; added **`getStoredAlerts(query)`** returning the static `ALERTS` corpus (TomTom never involved). `getAlerts` is unchanged (TomTom-when-keyed) for the analysis page.                                                                                                                                                                                                                                                                                                           |
| `api/endpoints/alerts.ts`      | Added **`getStoredAlerts(filter, options)`**: mock → `mock.getStoredAlerts`; backend → `GET /alerts` (identical to `getAlerts`' backend branch — real backend detections).                                                                                                                                                                                                                                                                                                                                                                      |
| `hooks/useAlerts.ts`           | Added **`useStoredAlerts(filter, options)`** mirroring `useAlerts` (same 30 s poll).                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pages/incident/map.tsx`       | Switched `useAlerts()` → `useStoredAlerts()`. Markers now come from the mock corpus via `mapIncidentPoints` (active + has coordinates).                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pages/incident/incidents.tsx` | Switched `useAlerts()` → `useStoredAlerts()`; feed stays `listIncidentAlerts` (the 15 seeded triage detections; `es_` system events stay out).                                                                                                                                                                                                                                                                                                                                                                                                  |
| `api/mock/data/alerts.ts`      | Added `latitude`/`longitude` to the static `TRIAGE` seed rows (coordinates match each location label, e.g. Howrah Bridge 22.588/88.324, Sector V 22.5744/88.427, Dhakuria 22.52/88.37, Ballygunge Phari 22.526/88.377) so the Incident Management map plots ~6 active seeded points across the city (was 2).                                                                                                                                                                                                                                    |

### Behavior

- **Map switcher** now shows Traffic / Incidents / Nodes only.
- **Incident Management** tab shows the seeded vehicle/camera detections (list + map), independent of `VITE_TOMTOM_API_KEY`; no overlap with the analysis event stream.
- **Overview** (map modes incl. Incidents, "Incident & Event Stream" panel, Network Overview card) still uses TomTom live alerts; the **header bell** now reads the same seeded detections as the Incident Management tab so its badge + dropdown match.

### Verification

`npm run format && npx tsc -b && npm run lint && npm run build` all clean. Dev (key set): map switcher has three tabs; Incident Management list shows the 15 seeded detections with a populated map (active markers across Kolkata) and works identically with the key removed; analysis event stream + overview incidents still list live TomTom data.

---

## Phase 1.19 — Incident map markers match listings; popup overflow; Event Stream rename; congestion-index sensitivity

### Goal

Four polish fixes: (1) the Incident Management map plotted only 6 of the 15 seeded detections (it filtered `status === "active"`); the map should mirror the full list. (2) Alert popups overflowed their box (maplibre's `.maplibregl-popup-content` caps ~240 px but the popup root was 256 px wide and long unbroken strings never wrapped). (3) The overview panel heading should be "Event Stream" (there are no "incidents" in it beyond alerts). (4) The live congestion index read too low on congested corridors because `summarizeFlow` diluted peak congestion across all 24 roads with a free-flow-weighted deficit.

### Changes

| File                                | Change                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/ui/adapters.ts`              | `mapIncidentPoints(alerts, includeInactive = false)` — new option skips the `status === "active"` gate so a map can plot every seeded detection (analysis map keeps the active-only default).                                                                                                                                               |
| `components/map/helpers.ts`         | `addPulseMarker(map, lngLat, color, size, animate = true)` — when `animate` is false the ping halo is omitted (solid dot only).                                                                                                                                                                                                             |
| `pages/incident/map.tsx`            | Plots `mapIncidentPoints(items, true)` — all 15. Markers: active = pulsing severity dot, investigating = solid severity dot, resolved = gray `#94a3b8`; legend gains a **Resolved** swatch; popup set to `maxWidth: "15rem"`; empty-note now "No incidents to display".                                                                     |
| `components/map/alertPopup.ts`      | Root `w-56 overflow-hidden rounded-lg` (fits the ~240 px popup cap); `break-words` on the title, severity·type label, detail, and row values (`min-w-0`); rows use `items-baseline` so wrapped values align.                                                                                                                                |
| `pages/analysis/incident-queue.tsx` | Heading renamed **"Incident & Event Stream" → "Event Stream"**.                                                                                                                                                                                                                                                                             |
| `api/tomtom/flow.ts`                | `summarizeFlow` now computes per-road congestion `p = (1 − min(current/free,1))·100`, then `congestionScore = round(0.5·mean(p) + 0.5·p90(p))` — congested corridors push the city index up instead of being diluted by free-flowing roads; `avgSpeedKmh` unchanged. `congestedSegments`/popup chips keep their ratio-based per-road score. |
| `pages/analysis/overview.tsx`       | Congestion level bands recalibrated to the new scale: **≥55 High, ≥25 Moderate, else Low** (was 70/40).                                                                                                                                                                                                                                     |

### Behavior

- Incident Management map mirrors the 15 listings (3 pulsing, 3 solid severity — active/investigating — and 9 gray resolved), hover popups fit their box.
- Overview congestion index is more sensitive: moderate/heavy corridors read Moderate/High instead of sitting at ~33 "Low"; free-flow still reads Low.

### Verification

`npm run format && npx tsc -b && npm run lint && npm run build` all clean. Dev (key set): incident map shows 15 markers with dimmed resolved dots and no popup overflow; overview heading "Event Stream"; Network Overview card index/label rise into Moderate on busy corridors and stay Low off-peak; re-run with the key removed — mock summary still renders (static 68 → High), incident map unchanged (seed-driven).

---

## Phase 1.20 — Header bell syncs to the Incident Management corpus

### Goal

The navbar notification bell still polled TomTom live alerts (`useAlerts`), so its badge count and dropdown disagreed with the Incident Management tab (which is seed-driven and has no TomTom). The bell should mirror the Incident Management list.

### Changes

| File                          | Change                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header/NotificationBell.tsx` | Switched `useAlerts()` → `useStoredAlerts()` and feed the bell from `listIncidentAlerts(storedAlerts)` — exactly the corpus the Incident Management list renders. Badge count (`activeAlertCount`) and dropdown (`activeAlerts(..., 6)`) now count/final the seeded detections (`es_` system events stay out). |

### Behavior

- Bell badge + dropdown match the Incident Management tab's active seeded detections regardless of `VITE_TOMTOM_API_KEY`; "Show all incidents" still routes to `/incident`. The analysis "Event Stream" panel and overview keep their own data sources.

### Verification

`npm run format && npx tsc -b && npm run lint && npm run build` all clean. Dev: bell badge shows 6 and the dropdown lists the same active seeded incidents as Incident Management → Active, with or without the key.

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

| File                                         | Phase | Reason                                                        |
| -------------------------------------------- | ----- | ------------------------------------------------------------- |
| `pages/analysis/useTrafficData.ts`           | 0     | Replaced by `useTrafficSummary`                               |
| ~~`components/map/incidentsApi.ts`~~         | 1     | ~~TomTom data API replaced~~ — RESTORED for mock map viewer   |
| ~~`components/map/useViewportIncidents.ts`~~ | 1     | ~~Viewport fetching replaced~~ — RESTORED for mock map viewer |

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
