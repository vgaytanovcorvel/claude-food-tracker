# Plan: Frontend Client Refactoring

## Context

The React client (`src/misteryapp.web.client/`) was built incrementally across E1–E10 with a pragmatic "make it work first" approach. The result is a technically functional but structurally unmaintainable codebase:

- **FoodLoggingPage.tsx is 793 lines** — 22 useState, 7 useRef, 10 direct API calls, ~200 lines of duplicated JSX (pre-save and post-save analysis cards are near-identical)
- **No composition root** — pages call `fetch()` directly; there is no dependency injection seam, making the code untestable
- **No React Query or Zustand** — every page hand-rolls `useState(loading) + useEffect + AbortController`; stale data on back-navigation
- **No CSS Modules** — all styling is global Tailwind + hardcoded hex values repeated 14+ times
- **Flat `src/pages/`** — no feature slices; inline sub-components (CalorieRing, CalorieBarChart, SeverityBadge) defined inside their parent files
- **Zero tests** in the entire React client
- **Inconsistent API error handling** — bookmarksApi throws; all others silent-fail

The goal is to bring the client into compliance with `rules/typescript/` (react.md, frontend-arch.md, css.md, patterns.md) without changing any backend APIs or visible UI behaviour.

## Decision: Refactor In-Place (Not Side-By-Side)

The app is ~2,300 LOC across 8 pages. Side-by-side would double maintenance immediately with no rollback benefit:
- React Query coexists with useState during migration — both patterns compile and run simultaneously
- CSS Modules coexist with the existing global `index.css`
- TypeScript enforces all API contracts — no regression risk during restructuring
- Each epic below leaves the app fully functional at its boundary

---

## Epics

### E11 — Foundation: Domain Layer, Repositories, Composition Root
**Scope: M** | **Depends on: nothing** | **Risk: very low (additive only)**

**What it solves:** No testability — pages call `fetch()` directly; no DI seam.

**New files:**
- `src/domain/models.ts` — all TS interfaces consolidated (UserProfile, FoodEntry, FoodAnalysisResult, etc.)
- `src/domain/errors.ts` — AppError, NotFoundException, ValidationError
- `src/domain/interfaces/` — IUserProfileRepository, IFoodLogRepository, IReportRepository, IBookmarkRepository (entity-first method names: `userProfileSingleById`, `foodEntryCreate`, etc.)
- `src/repositories/` — HttpUserProfileRepository, HttpFoodLogRepository, HttpReportRepository, HttpBookmarkRepository (absorb existing `src/api/` files; all fetch() lives here only)
- `src/core/providers.tsx` — ServicesProvider + useServices() composition root; wraps QueryClientProvider

**Changed files:**
- `src/main.tsx` — wrap `<App />` in `<ServicesProvider>`
- `package.json` — add `@tanstack/react-query`, `zustand`, `clsx`

**Note:** `src/api/` folder untouched in E11 — pages still use old functions. New repos are additions only.

**Exit criteria:** App behaves identically. `useServices()` returns non-null. Zero TS errors.

---

### E12 — Service Layer + React Query State Hooks
**Scope: L** | **Depends on: E11** | **Risk: medium (deletes src/api/ at end)**

**What it solves:** Manual loading/error/abort boilerplate on every page; stale data; inconsistent error handling; `useIdentity` not a real hook.

**New files:**
- `src/services/` — UserProfileService, FoodLogService, ReportService, BookmarkService (consume repository interfaces; natural method names matching app intent)
- `features/identity/hooks/use-identity.ts` — real hook: useState wrapping localStorage + storage event listener
- Feature-scoped React Query hooks (one per data shape):
  - `features/user-profile/state/` — use-profile.ts, use-update-profile.ts, use-delete-profile.ts
  - `features/food-log/state/` — use-daily-entries.ts, use-daily-summary.ts, use-log-food.ts (mutation), use-identify-food.ts (mutation), use-analyse-preview.ts (debounced, 1200ms/0ms)
  - `features/reports/state/` — use-weekly-report.ts, use-monthly-report.ts
  - `features/bookmarks/state/` — use-bookmarks.ts, use-delete-bookmark.ts (mutation)

**Strategy within E12:** Build all services + hooks alongside old api/ functions → switch pages one by one → delete `src/api/` as final step.

**Exit criteria:** All 8 pages work. Back-nav to DailyLog shows cached data instantly. `src/api/` deleted. No fetch() calls outside `src/repositories/`.

---

### E13 — FoodLoggingPage Decomposition
**Scope: L** | **Depends on: E12** | **Risk: medium (single large atomic change)**

**What it solves:** 793-line god component; 22 useState; 7 useRef; 200 lines of duplicated JSX.

**New files under `features/food-log/`:**
- `state/use-food-logging-form.ts` — custom hook; owns all 22 state vars grouped by phase (photo / form / calorie / pre-save preview / post-save analysis); all 7 abort refs; all handlers; returns flat `FormState` + handlers
- `components/photo-capture/photo-capture.tsx` — drop zone + preview + Remove button
- `components/calorie-pill/calorie-pill.tsx` — collapsed pill / expanded input
- `components/analysis-card/analysis-card.tsx` — **single shared component** for BOTH pre-save and post-save cards (eliminates ~200L duplication); props accept union of AnalysisPreviewResult | FoodAnalysisResult
- `components/food-name-input/food-name-input.tsx` — input + AI badge overlay
- `components/image-lightbox/image-lightbox.tsx` — fullscreen zoom overlay
- `containers/food-logging-page.tsx` — container; calls useFoodLoggingForm(); composes the above; **<=150 lines, zero business logic**

**Exit criteria:** Container <=150 lines. Pre/post-save analysis card is the same component. All photo / calorie / debounce / pre-to-post state transfer behaviour preserved. Executed as a single atomic commit.

---

### E14 — Feature Slices + Remaining Pages
**Scope: M** | **Depends on: E12, E13** | **Risk: low (page-by-page)**

**What it solves:** Flat pages/; inline sub-components; duplicated ProtectedRoute guard.

**New feature directories:**
- `features/home/` — containers/home-page.tsx, components/calorie-ring/calorie-ring.tsx
- `features/daily-log/` — containers/daily-log-page.tsx; components: severity-badge, entry-list, week-strip, summary-strip
- `features/reports/` — containers for weekly + monthly; components/calorie-bar-chart (shared between both, eliminating duplication)
- `features/bookmarks/` — containers/bookmarks-page.tsx; components/bookmark-list
- `features/user-profile/` — containers: profile-page, onboarding-page; components/diet-picker
- `shared/components/` — bottom-nav, compliance-arc moved here (out of flat `src/components/`)
- `src/core/protected-route.tsx` — extracted from App.tsx

**Exit criteria:** `src/pages/` deleted. No component file >200 lines. All routes work. ProtectedRoute defined once.

---

### E15 — CSS Architecture: Design Tokens + CSS Modules
**Scope: L** | **Depends on: E14** | **Risk: low (visual-only, incremental)**

**What it solves:** Hardcoded hex repeated 14+ times; inline `style={{}}` for layout; no reduced-motion; no clsx; magic px values everywhere.

**New files:**
- `src/styles/abstracts/_tokens.css` — two-tier token system:
  - Primitives: `--cyan-500`, `--slate-900`, `--space-4`, `--radius-lg`, etc.
  - Semantics: `--color-bg-page`, `--color-surface`, `--color-brand`, `--color-text-primary`, `--color-text-muted`, `--color-focus-ring`, `--z-nav`, `--z-modal`, `--duration-fast`, `--ease-out`, etc.
- `src/styles/main.css` — ITCSS layer declaration + imports tokens + global body gradient + keyframes

**Per-component `.module.css` files** (one per extracted component from E13/E14):
- calorie-ring, calorie-pill, analysis-card, photo-capture, severity-badge, entry-list, week-strip, bottom-nav, compliance-arc, calorie-bar-chart, diet-picker, bookmark-list

**Rules applied in every module:**
- All values via `var(--...)` semantic tokens — zero hardcoded hex or magic px
- All `transition:` wrapped in `@media (prefers-reduced-motion: no-preference)`
- Class names camelCase only
- `clsx()` for all conditional composition

**`index.css` after E15:** Only `@tailwind` directives + `@import './styles/main.css'`. Global component classes (`.glass-modal`, `.btn-primary`, `.btn-ghost`, `.input-glass`, `.field-label`) retained as Tailwind component-layer classes but with hardcoded values replaced by token references.

**Exit criteria:** Zero hardcoded hex outside _tokens.css. Zero inline `style={{}}` for theme/layout. Every transition wrapped in prefers-reduced-motion. App renders identically.

---

## Execution Order

```
E11 (Foundation) --> E12 (Services + RQ) --> E13 (FoodLoggingPage decomposition)
                                         \-> E14 (Feature slices) --> E15 (CSS) --> E16 (Testing)
```

E13 before E14: the AnalysisCard extracted in E13 is reused in E14's DailyLogPage.
E16 after E15: all components and hooks must be in their final locations before writing stable import paths in tests.

---

### E16 — Testing Foundation
**Scope: M** | **Depends on: E11–E15** | **Risk: low**

**What it solves:** Zero test coverage in the React client. The composition root from E11 provides the DI seam needed to inject test doubles cleanly via ServicesProvider.

**Setup:**
- `package.json` dev deps: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `msw` (Mock Service Worker for repository-level stubs)
- `vitest.config.ts` — jsdom environment, global test utils, coverage threshold 80%

**Unit tests (Vitest + RTL):**
- `src/repositories/*.test.ts` — MSW intercepts HTTP; verify correct endpoints, payloads, error mapping
- `src/services/*.test.ts` — mock repository interfaces; verify orchestration logic (e.g., FoodLogService calls analyseEntry after logFood)
- `features/food-log/state/use-food-logging-form.test.ts` — renderHook; verify debounce timing, phase transitions, pre-to-post state transfer
- `features/food-log/state/use-analyse-preview.test.ts` — verify 1200ms normal / 0ms high-confidence debounce
- `features/food-log/components/analysis-card/analysis-card.test.tsx` — snapshot + interaction (suggest another, bookmark)
- `features/daily-log/components/severity-badge/severity-badge.test.tsx`
- `features/reports/components/calorie-bar-chart/calorie-bar-chart.test.tsx`

**E2E tests (Playwright):**
- `e2e/onboarding.spec.ts` — create profile, redirects to home
- `e2e/food-logging.spec.ts` — upload photo > identify > pre-save preview > save > post-save analysis > suggest alternative > bookmark
- `e2e/daily-log.spec.ts` — navigate dates, delete entry, summary strip updates

**Exit criteria:** `vitest run --coverage` exits 0 with >=80% coverage on repositories, services, and state hooks. All 3 Playwright specs pass against the running Web.Server.

---

## Verification (per epic)

1. `npm run build` in `src/misteryapp.web.client/` exits 0
2. `dotnet run --project src/MisteryApp.Web.Server` serves the SPA
3. Navigate all 8 routes — no visual regressions
4. FoodLogging happy path: upload photo > identify > pre-save preview > save > post-save analysis > suggest alternative > bookmark
5. Daily log: navigate dates, delete entry, summary refreshes

After E15 additionally:
6. DevTools — no inline `style` attributes on themed elements
7. Computed styles reference `--color-*` tokens
