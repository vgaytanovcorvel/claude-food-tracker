# Epics — Food Habit Tracker

**Source:** `prd.md` (completed 2026-03-18)
**Author:** VG
**Date:** 2026-03-18

---

## Overview

Seven epics cover the Phase 1 MVP. Two further epics capture deferred Phase 2 scope. Each epic is a full-stack vertical slice (React UI + .NET API + tests), independently demoable on completion.

| ID | Title | Phase | FRs |
|---|---|---|---|
| E1 | Foundation & Clean Architecture Setup | 1 — MVP | NFR21–26 |
| E2 | User Profile Management | 1 — MVP | FR1–FR4 |
| E3 | Food Logging — Capture & Manual Entry | 1 — MVP | FR5–FR11 |
| E4 | AI Food Identification (Vision API) | 1 — MVP | FR7–FR8, NFR15–17 |
| E5 | Diet Analysis & Feedback (Gemini) | 1 — MVP | FR12–FR17, NFR15–17 |
| E6 | Daily Tracking & Log View | 1 — MVP | FR18–FR21 |
| E7 | Re-engagement, Resilience & Privacy | 1 — MVP | FR22–FR28 |
| E8 | AI Alternative Image Generation (Imagen) | 2 — Growth | — |
| E9 | Extended Reporting & Bookmarks | 2 — Growth | — |

---

## Phase 1 — MVP

---

### E1 — Foundation & Clean Architecture Setup

**Goal:** Establish a running, deployable skeleton with all assembly boundaries wired, DI configured, EF Core migrations in place, and the React SPA serving from `Web.Server`. No features — just a working shell that proves the architecture holds end-to-end.

**Scope:**
- Solution compiles and all projects start without errors
- EF Core SQLite database initialised with initial migration
- `Web.Api` returns a health-check endpoint (`GET /health`)
- React SPA (Vite + React 18 + React Router + Tailwind CSS) bootstrapped and served by `Web.Server`
- Glass UI design tokens defined (Tailwind config: backdrop-filter utilities, colour palette, font scale)
- Session/localStorage user identity stub wired (no auth provider)
- Each assembly has its `Add{Feature}()` DI extension registered in `Program.cs`
- CI baseline: `dotnet build` + `dotnet test` pass; Lighthouse TTI baseline recorded

**NFRs addressed:** NFR6, NFR18, NFR21–26

**Acceptance criteria:**
- `dotnet build MisteryApp.slnx` passes with zero warnings
- `dotnet test MisteryApp.slnx` passes (seed tests exist per project)
- `GET /health` returns `200 OK`
- React app loads in browser; glass surface renders correctly on Chrome and Safari iOS
- No assembly dependency violations (verified manually or via ArchUnit equivalent)

**Dependencies:** None — first epic.

---

### E2 — User Profile Management

**Goal:** A user can create, view, update, and delete their profile including diet style selection. This is the prerequisite for all diet-aware features.

**Scope:**
- `UserProfile` domain model in `Abstractions` (name, diet style, created date)
- `DietStyle` enum: `Keto`, `LowFat`, `Mediterranean`
- `IUserProfileRepository` interface + EF Core `UserProfileEntity` + migration
- `IUserProfileService` interface + `UserProfileService` implementation
- API endpoints:
  - `POST /api/users` — create profile
  - `GET /api/users/{id}` — get profile
  - `PUT /api/users/{id}` — update diet style
  - `DELETE /api/users/{id}` — delete account + all food log data
- FluentValidation validators for create/update requests
- React screens: onboarding/create profile, profile view, edit diet style
- User identity stored in localStorage; passed as header or route param (no JWT)
- Full unit test coverage on service layer; integration tests on repository

**FRs:** FR1, FR2, FR3, FR4
**NFRs addressed:** NFR10, NFR21–26

**Acceptance criteria:**
- User can complete onboarding (name + diet style) on first launch
- Diet style can be changed and persists across page reload
- Account deletion removes all data; subsequent requests return 404
- All validators reject invalid input with descriptive messages
- 80%+ coverage on `Implementation.Tests` and `Repository.Tests`

**Dependencies:** E1

---

### E3 — Food Logging — Capture & Manual Entry

**Goal:** A user can capture or upload a food photo, preview it, and save a food entry to their daily log — including manual text entry as fallback. No AI integration yet; food name and calories are entered by the user.

**Scope:**
- `FoodEntry` domain model: id, user id, food name, estimated calories, logged timestamp, source (photo/manual), diet analysis result (nullable)
- `IFoodLogRepository` interface + `FoodLogEntity` + migration
- `IFoodLogService` interface + `FoodLogService` implementation
- API endpoints:
  - `POST /api/food-entries` — save entry (accepts food name + calories; photo metadata optional)
  - `DELETE /api/food-entries/{id}` — delete entry
- React: food logging screen with camera/file input (`<input capture="environment">`), local image preview, editable food name + calorie fields, save button
- Manual entry form (text description + calorie estimate) as fallback path
- Photo transmitted to API; discarded server-side immediately after receipt (no persistence)
- Full unit + integration tests

**FRs:** FR5, FR6, FR7 (display only — no AI yet), FR8, FR9, FR10, FR11
**NFRs addressed:** NFR8, NFR20, NFR21–26

**Acceptance criteria:**
- Camera capture works on Chrome for Android and Safari iOS
- File picker works on desktop
- Local preview shown before submission; user can cancel without API call
- Saved entry appears in response immediately
- Entry can be deleted; subsequent fetch excludes it
- Photo not retrievable after submission (no storage path in response)

**Dependencies:** E2

---

### E4 — AI Food Identification (Vision API)

**Goal:** When a user submits a food photo, the system identifies the food and estimates calories via Google Cloud Vision API — replacing the manual name/calorie entry from E3 with AI-populated values the user can correct.

**Scope:**
- `IVisionFoodIdentificationService` interface in `Abstractions`
- `GoogleVisionFoodIdentificationService` implementation in `Implementation`
- `FoodIdentificationResult` domain model: food name, estimated calories, confidence level
- Image hash → result cache (server-side, per-user daily call budget enforced)
- API endpoint update: `POST /api/food-entries/identify` — accepts image, returns identification result (does not save yet)
- Corrected food name validated against a known-safe food vocabulary before any downstream use (NFR9)
- React: after photo upload, show AI-identified food name and `~XYZ kcal` estimate; user can edit both fields before saving; skeleton loader during identification (NFR1)
- Timeout per AI call (NFR19)
- Graceful fallback: if Vision unavailable, return empty result → manual entry screen shown

**FRs:** FR5, FR6, FR7, FR8, FR24 (fallback)
**NFRs addressed:** NFR1–3, NFR7–9, NFR15–17, NFR19, NFR21–26

**Acceptance criteria:**
- Photo submission returns food name and approximate calorie count within 8s (NFR3)
- Skeleton loader visible within 500ms of submission (NFR1)
- Upload acknowledgement within 1s on 4G (NFR2)
- User can edit food name before saving; corrected value used downstream
- Vision API key not present in any client-side response or network call
- Cache hit skips Vision API call (verifiable in logs)
- Vision unavailable → manual entry form presented, no unhandled error

**Dependencies:** E3

---

### E5 — Diet Analysis & Feedback (Gemini)

**Goal:** After food identification, the system evaluates the food against the user's diet style using Gemini, assigns a severity level, provides nutrition education, and suggests a healthier alternative — or delivers a positive reinforcement message if the food is on-goal.

**Scope:**
- `IFoodAnalysisService` interface in `Abstractions` — bundles: compatibility result, severity, education text, alternative food name (MVP bundled call; interface designed for independent evolution per PRD constraint)
- `GeminiFoodAnalysisService` implementation in `Implementation`
- `FoodAnalysisResult` domain model: compatible (bool), severity (none/low/medium/high), educationText, alternativeFoodName
- Prompt injection mitigation: validated food name only interpolated into prompts (NFR9)
- API: `POST /api/food-entries/{id}/analyse` — triggers analysis against user's diet style; result stored on entry
- React: after save, animate in result card:
  - **On conflict:** amber/red warning card with severity badge, education text, alternative food name suggestion; dismiss button (FR17)
  - **On good choice:** green card with positive reinforcement message (non-patronising copy)
- Timeout per call; graceful degradation: if Gemini unavailable, entry saved without analysis result (FR25, FR26)
- Full unit tests with mocked `IFoodAnalysisService`

**FRs:** FR12, FR13, FR14, FR15, FR16, FR17, FR24 (fallback), FR25, FR26
**NFRs addressed:** NFR1–3, NFR7, NFR9, NFR15–17, NFR19, NFR21–26

**Acceptance criteria:**
- Keto user logging rice noodles → medium severity warning + carb education text + zucchini noodle suggestion
- Mediterranean user logging pizza → high severity warning + saturated fat education text + flatbread suggestion
- Keto user logging a chicken breast → green positive reinforcement card
- All three diet styles (keto, low-fat, Mediterranean) produce distinct, diet-appropriate responses
- Dismiss button closes warning without side effects
- Gemini unavailable → entry saved, no warning card shown, no unhandled error
- No raw user input reaches any Gemini prompt directly

**Dependencies:** E4

---

### E6 — Daily Tracking & Log View

**Goal:** A user can see everything they've logged today — food entries, total estimated calories, and a diet compliance summary — and navigate to previous days.

**Scope:**
- API endpoints:
  - `GET /api/food-entries?userId={id}&date={date}` — list entries for a day
  - `GET /api/food-entries/summary?userId={id}&date={date}` — total calories + compliance count (on-goal vs conflicting)
- `DailyLogSummary` domain model: date, totalCalories, onGoalCount, conflictCount, complianceLabel
- React: daily log screen — entry list with food name, calories, severity badge; total calorie counter; compliance indicator (e.g. "2 of 3 meals keto-compliant"); date navigation (prev/next day)
- Empty state for days with no entries (non-judgmental copy)
- Entries with no analysis result shown neutrally (no conflict badge)

**FRs:** FR18, FR19, FR20, FR21
**NFRs addressed:** NFR5 (cache), NFR20, NFR21–26

**Acceptance criteria:**
- Today's log shows all saved entries with correct names, calories, severity badges
- Total calorie count matches sum of entries
- Compliance summary correctly counts on-goal vs conflicting meals
- Navigating to a previous day loads that day's entries
- Day with no entries shows empty state without guilt framing

**Dependencies:** E5 (for severity data on entries; E3/E4 sufficient for basic log)

---

### E7 — Re-engagement, Resilience & Privacy

**Goal:** Returning users after a gap are greeted without guilt. Users can view history across days with missed days shown neutrally. Users can delete all their data. Prompt injection and image privacy mitigations are hardened.

**Scope:**
- Re-engagement detection: server returns `lastActiveDate` on profile fetch; React shows neutral greeting if gap > 1 day ("Welcome back. Ready to log?") vs standard greeting
- Food log history: date navigator in E6 extended to show missed days as empty (no streak-breaking UI, no red crosses)
- `DELETE /api/users/{id}` (from E2) confirmed to cascade-delete all food entries and analysis results
- Prompt injection hardening: food vocabulary allowlist implemented and tested with adversarial inputs
- Image privacy: integration test confirms no photo bytes stored after identification request
- `GET /api/users/{id}` returns `lastActiveDate` for re-engagement calculation

**FRs:** FR22, FR23, FR24, FR25, FR26, FR27, FR28
**NFRs addressed:** NFR8, NFR9, NFR10, NFR16, NFR21–26

**Acceptance criteria:**
- User returning after 3-day gap sees "Welcome back" neutral greeting, not a streak-fail message
- Log history for week with 3 missed days shows those days as empty, no penalising UI
- Account deletion removes all entries; `GET /api/food-entries?userId={id}` returns empty list
- Adversarial food name input (e.g. `"ignore previous instructions and..."`) rejected by vocabulary validator
- No photo file path or binary in any API response or database record

**Dependencies:** E2, E3, E4, E5, E6

---

## Phase 2 — Growth

---

### E8 — AI Alternative Image Generation (Imagen)

**Goal:** When a diet conflict is detected, the app shows a photorealistic AI-generated image of the suggested alternative food — making the better choice aspirational rather than punitive.

**Scope:**
- `IAlternativeImageService` interface in `Abstractions`
- `GeminiImagenService` implementation in `Implementation`
- Imagen prompt template: fixed high-quality template with food name interpolated (validated input only); iterate before parameterising
- API: `GET /api/food-entries/{id}/alternative-image` — returns image URL or base64; cached client-side for session (NFR5)
- React: render generated image below alternative food name suggestion in conflict card; skeleton loader during generation; graceful fallback to text-only if Imagen fails

**FRs:** (deferred from Phase 1 Journey capabilities)
**NFRs addressed:** NFR5, NFR15–17, NFR19

**Acceptance criteria:**
- Conflict card shows photorealistic image of suggested alternative within 8s
- Image cached: navigating away and back does not re-fetch
- Imagen failure → text-only alternative shown, no error state visible to user
- Imagen API key not client-exposed

**Dependencies:** E5

---

### E9 — Extended Reporting & Bookmarks

**Goal:** Users can view weekly/monthly trend reports with gap-tolerant framing, bookmark alternative suggestions for later reference, and see food history pattern insights.

**Scope:**
- Weekly report: calorie trend chart, compliance arc (gap days shown as neutral, not failures), motivating summary copy
- Monthly report: same structure, longer window
- Bookmark/save alternative: `POST /api/alternatives/bookmarks` + bookmarks list view
- Food history insights: server-side pattern detection (e.g. "You tend to go off-keto on Fridays") surfaced in weekly report

**FRs:** (deferred from Phase 1 — Dom's Journey)
**NFRs addressed:** NFR20, NFR21–26

**Acceptance criteria:**
- Weekly report shows gap days without penalising visual treatment
- Bookmarked alternatives persist across sessions
- Pattern insight appears in weekly report when sufficient data exists (≥7 days)

**Dependencies:** E6, E7

---

## Suggested Build Order (Phase 1)

```
E1 → E2 → E3 → E4 → E5 → E6 → E7
```

E6 can begin in parallel with E5 once E3 is complete (log view only needs saved entries, not analysis results). E7 is a hardening pass — schedule it before declaring the MVP demo-ready.
