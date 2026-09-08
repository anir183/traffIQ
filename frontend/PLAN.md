# TraffIQ Frontend — Full Redesign Plan

## Overview

Full visual and architectural overhaul of the TraffIQ traffic management dashboard. Converts all pages to a modern, neutral cool-slate design system using Tailwind CSS v4, fixes lint errors, consolidates map implementations, removes dead code, and adds missing functionality (camera grid, active nav state, etc.).

**Design system:** Tailwind `slate-*` grays, `blue-600` accent for interactive elements, clean card-based layout, consistent 4px-based spacing, 14/16/18px type scale.

---

## STATUS: ✅ COMPLETE (all phases done — see notes below)

---

## Phase 1: Foundation ✅

- API key moved to `.env` (`VITE_TOMTOM_API_KEY`), read via `src/config.ts`, `.env`/.env.* gitignored, `.env.example` added
- Dead code deleted: `notification.rsx`, `features.tsx`, `svg.tsx`, `analysis/index.ts`, `analysis/analytics.ts`, `public/icons.svg`
- Tailwind consolidated to single `@import "tailwindcss"` in `src/index.css`; all duplicate `tailwind.css` files removed
- All 11 custom CSS files deleted; everything inlined as Tailwind utilities
- Maps consolidated onto `@tomtom-org/maps-sdk` (npm), MapLibre GL `.mapLibreMap` for markers. ANPR + Incident + Analysis maps all use the SDK via `src/components/map/helpers.ts`. Map centers fixed to Kolkata (88.36, 22.57).

## Phase 2: Shared Components ✅

- `src/components/ui/stat-card.tsx` (replaces 4 duplicate stat cards)
- `src/components/ui/card.tsx` (card wrapper)
- `src/components/ui/badge.tsx` (status badges)
- `src/components/map/helpers.ts` (TomTom config init, dot/pulse markers, line layers)
- `src/types/traffic.ts` (consolidated domain interfaces)

## Phase 3: Shell Rebuild ✅

- Header: white bar, `border-b border-slate-200`, search rounded-full `bg-slate-50`, profile with name + icons
- Nav: `bg-white border border-slate-200 rounded-2xl`, `<NavLink>` with `bg-slate-900` active state; admin/logs section restored
- Layout: `bg-slate-50` shell, sidebar + scrollable white content window

## Phase 4: Page Rebuilds ✅

- **Overview:** slate-800 critical-incidents card, Recharts blue/slate palette, TomTom heatmap (Kolkata), rebuilt incident queue
- **Analytics:** shared `StatCard` grid, date picker + time range, camera counts, traffic volume, avg speed, vehicle donut (hooks violation fixed via immutable prefix-sum)
- **ANPR:** tabs/search/vehicle details in slate; trajectory map on SDK
- **Incident:** filter tabs now actually filter the list; SDK map with pulsing markers; status badges
- **Live Feed:** NEW camera-grid placeholder (4 CAM boxes); ANPR log table in clean slate
- **Admin/Logs:** styled "Coming soon" placeholders

## Phase 5: Routing ✅

- `<a href>` → `<NavLink>` with `isActive` state (no full page reloads)

## Phase 6: Lint & Code Quality ✅ (15 errors → 0)

- Removed unused StrictMode-relevant import; `StrictMode` now actually wraps app
- Fixed all `any` types (SDK rewrite, typed events, typed incidents)
- Removed unused setters in incident hook (rewrote as filterable static list)
- Fixed `react-hooks/immutability` in `vehicletype.tsx`
- Removed dead `analytics.ts` (erasableSyntaxOnly violations)
- Duplicate mock keys fixed in `useTrafficData.ts`
- Deleted `bun.lock`; single `package-lock.json` remains

## Phase 7: Responsive & Polish ✅

- Header: search hidden below `sm`; profile text hidden below `md`
- Body: stacks column on mobile, row on `lg`; pages use `xl:`/`lg:` breakpoints
- Nav: horizontal wrap strip on mobile, column + circuit footer on desktop
- Code-split all routes via `React.lazy` + `Suspense`
- Vendor chunk splitting (maps / charts / react-vendor)
- Profile image: 5760×3840 JPEG (3.3 MB) → 160px WebP (5 KB)

## Phase 8: Icons (lucide-react) ✅

- Installed `lucide-react`; removed all raw embedded SVG icon markup
- Deleted `src/header/notification.tsx` (CrosshairIcon) and `src/header/light.tsx` (BellIcon) hand-coded wrappers
- `src/header/profile.tsx` now uses lucide `Sun` (dark-mode toggle) + `Bell` (notifications) — fixed 1:1 viewBox, no more stretching
- `src/pages/page2/feed.tsx` camera placeholder → lucide `Video`
- `src/pages/incident/incidents.tsx` unicode glyphs → lucide `TriangleAlert` / `Route`
- Chart SVGs (donut, area/bar) and `assets/Union.svg` logo intentionally kept

## Phase 9: Dark / Light Mode ✅

- **Infra:** `src/index.css` — `@custom-variant dark` (class-based Tailwind v4), `.dark` `color-scheme`, chart CSS vars (`--chart-grid/-axis/-tooltip-*`) defined per theme
- **Pre-paint:** `index.html` inline script reads `localStorage['traffiq-theme']` (fallback `prefers-color-scheme`) and sets `.dark` before paint — no flash; `meta[name="color-scheme"]` added
- **State:** `src/theme/context.ts` + `ThemeProvider.tsx` + `useTheme.ts` — default `system`, explicit toggle persisted to localStorage, live `matchMedia` listener while unset; `main.tsx` wrapped
- **Toggle:** `src/theme/ThemeToggle.tsx` (Sun/Moon, animated) replaces static icon in `header/profile.tsx`
- **Theming pass:** `dark:` classes across shell (header/nav/layout), shared UI (card/stat-card/badge), Overview, Traffic Analysis, ANPR, Incident, Live Feed, and placeholder pages; active/inverted pills flip to light (`dark:bg-slate-100 dark:text-slate-900`); status chips → `/10` tinted backgrounds
- **Charts:** Recharts axes/grid/tooltip now use theme CSS vars; congested-segment + vehicle-donut palettes swap per theme (dark gets light ramp so bars/segments stay visible)
- **Maps:** `applyTomTomTheme()` — SDK `setStyle('standardDark'|'standardLight')` (keepState, no flicker) wired into the 3 TomTom maps; style-bound layers (heatmap, trajectory lines) re-added idempotently on `load`

## Phase 10: Responsive, Viewport-Driven Maps ✅

- **New `src/components/map/incidentsApi.ts`:** typed `fetchIncidents()` for `traffic/services/5/incidentDetails` with const `fields` (geometry + `magnitudeOfDelay`/`iconCategory`/event text/road from→to/time validity); `paddedBounds()` (+15% margin); `clampBoundsArea()` keeps the padded bbox within TomTom's 10,000 km² limit (scales around center, no 400s at low zoom); `incidentAnchor()` (Point coord / first LineString coord); `IncidentApiError` with `retryable` flag; `isAbortError()`
- **New `src/components/map/useViewportIncidents.ts`:**
  - Fetches only for the **visible bbox + margin**; re-fetch on `load` (incl. after theme `setStyle`) and on debounced (500ms) `moveend` — panning/zooming to a new area shows that area's incidents immediately
  - **Request safety:** AbortController cancels stale in-flight requests; 2s cooldown (postpones, never drops); skips when bounds moved <10% of extent AND zoom <0.7; skips identical-view requests while fresh; 30s poll only while the tab is visible (`visibilitychange` pause + catch-up); one `console.error` per failure streak (429/5xx → retry next poll, keep last good data)
  - Returns `{ state, refresh }` — status (`idle|loading|live|error`), incident count, last-updated timestamp for UI chips
- **`analysis/mapp.tsx`:**
  - 20s fixed `setInterval` replaced by the hook → heatmap now follows the current viewport
  - New **top-12 severity markers** over the heatmap (severity-colored dots, clickable popups with event description / road from→to / delay label); `Map<id, Marker>` diffing keeps markers clean across refreshes (incl. theme swaps which wipe raw layers — heatmap source re-created idempotently on `load`)
  - Live status chip (pulsing dot, incident count, "updated Xs ago"), theme-aware
- **`incident/map.tsx` / `anpr/map.tsx`:** demo data kept (no backend); both now `fitBounds` on first load (demo markers / camera+trajectory) so content is always framed; markers/layers stay idempotent across theme `setStyle`
- **`helpers.ts`:** `fitBoundsToCoordinates(map, coords, padding)`
- **`index.css`:** dark-theme MapLibre popup styles
- Rules out API overuse: ~1 request per viewport change (dedup+cooldown) + 1/30s while visible

## Phase 11: Post-Redesign Fixes & Foundation Planning ✅

- **Node container / locale fixes:** `dns`, `stdin`, `fs` polyfills added to `vite.config.ts` (fixes `ERR_INVALID_ARG_TYPE` from `dns.setDefaultResultOrder`); `npm run lint` uses `LC_ALL=C.UTF-8(0)` wrapper (uses same locale logic as CI); `lint:try` script removed
- **Dynamic page sizing:** `src/hooks/useListPageSize.ts` — ResizeObserver + `[data-sm-row]` measurement → rows-per-page adapts to list height (min/max clamps, `safePage` on resize, deduped setState, requires `recomputeKey`); wired into incident-queue (min 3/max 10), updates log (min 5/max 15), incidents list (min 4/max 12); hard-coded `PAGE_SIZE` constants removed; lists got `overflow-y-auto`
- **Logo:** `assets/Union.svg` renamed → `assets/logo.svg`; `name.tsx` import fixed; rendered smaller (`h-6`, `p-1` padding)
- **Rename:** "ANPR Intelligence" → "Trajectory Recognition" (`navigation.tsx`, `pages/anpr.tsx`)
- **Tab alignment:** ANPR search tabs centered (`justify-center`)
- **Planning (no code):** authored `../docs/Implementation_Plan.md` (4-phase, file-level) + `../docs/Frontend_Requirements.md`; added §14 (auth/users/settings/logs/notifications/search/SSE contracts) to `../docs/Backend_Frontend_Handoff.md`

> **Next work (Phases 0–3) is specified in `../docs/Implementation_Plan.md`.** It covers: pluggable data layer (mock/live toggle via `VITE_DATA_SOURCE`), auth (JWT + roles, mock login `admin@traffiq.in`/`admin123`), login page, shell refactor, 404, data hooks wiring into every page, admin panel, system logs, settings, notifications/toasts, then realtime SSE + camera player. No implementation started — awaiting go-ahead.

## Verification

- `npm run lint` → 0 errors ✅
- `npm run build` → clean build ✅

## Remaining notes / future work

- `useTrafficData` still uses mock data (no backend yet — `backend/` and `ai/` are empty in the worktree)
- Map heatmap updates from the current viewport bbox via `useViewportIncidents` (moveend + 30s visibility-aware polling) using `VITE_TOMTOM_API_KEY`; bbox clamped to TomTom's 10,000 km² limit
- `maps` vendor chunk is ~1.1 MB (TomTom+MapLibre SDK); lazily loaded only on Overview
- ANPR search / traffic charts / node selector are UI-only (no backend wiring yet)
