# misteryapp.web.client

React 18 + Vite + Tailwind CSS client — the food habit tracker SPA. Communicates with the backend exclusively via HTTP (`/api/*`).

## Rules

@../../rules/common/coding-style.md
@../../rules/common/patterns.md
@../../rules/common/security.md
@../../rules/typescript/coding-style.md
@../../rules/typescript/frontend-arch.md
@../../rules/typescript/react.md
@../../rules/typescript/patterns.md
@../../rules/typescript/security.md
@../../rules/common/testing.md
@../../rules/typescript/testing.md

## Module Purpose

Single-page application for logging food entries, viewing daily/weekly/monthly reports, managing bookmarks, and onboarding users. All data fetching is done through plain `fetch` wrappers in `src/api/`. No state management library — local `useState`/`useRef` and direct API calls from page components.

## Key Contents

- `src/api/` — typed `fetch` wrappers: `foodLogApi.ts`, `userProfileApi.ts`, `reportApi.ts`, `bookmarksApi.ts`, `types.ts` (`ApiResponse<T>`)
- `src/pages/` — page-level components: `FoodLoggingPage`, `DailyLogPage`, `WeeklyReportPage`, `MonthlyReportPage`, `BookmarksPage`, `HomePage`, `OnboardingPage`, `ProfilePage`
- `src/components/` — shared presentational components: `BottomNav`, `ComplianceArc`
- `src/hooks/useIdentity.ts` — reads/writes `localStorage` key `misteryapp:userId`
- `App.tsx` — React Router v7 route definitions

## Dependency Constraints

**Communicates with**: `MisteryApp.Web.Server` (or `Web.Api`) via HTTP — no direct .NET assembly references
**No framework imports** in `src/api/` files — plain `fetch` only
**userId** stored in `localStorage`, passed as query param or route segment — no JWT
