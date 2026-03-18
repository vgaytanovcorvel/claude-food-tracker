---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
completedAt: '2026-03-18'
classification:
  projectType: web_app
  domain: health_wellness
  complexity: medium
  projectContext: greenfield
inputDocuments: []
briefCount: 0
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
workflowType: 'prd'
---

# Product Requirements Document — Food Habit Tracker

**Author:** VG
**Date:** 2026-03-18

## Executive Summary

A mobile-first web application that eliminates the cognitive overhead of diet tracking by replacing manual food logging with photo capture. Users snap a picture of their meal; the app identifies the food, estimates calories, and evaluates the meal against their chosen diet style (keto, low-fat, Mediterranean, etc.), issuing severity-graded warnings when meals conflict with goals. When a conflict is detected, the app suggests a healthier alternative and generates an AI-rendered image of it — making the better choice aspirational rather than punitive. The interface follows premium glass-aesthetic standards — semi-transparent layers, high contrast, fluid motion — so the app feels like a daily luxury rather than a fitness chore.

**Target users:** Health-conscious individuals who want to build sustainable dietary habits without obsessive manual tracking.

**Core problem:** People fail at diets not from lack of willpower, but from lack of moment-to-moment awareness and food education. Traditional trackers demand manual effort and deliver numbers without context.

**Solution insight:** Snap → identify → educate → inspire. Remove friction at the point of eating; deliver context that teaches rather than judges; offer a beautiful vision of the alternative.

### What Makes This Special

Three AI touchpoints working together: vision recognition identifies food from a photo; diet-aware reasoning evaluates it against personal goals and generates contextual nutrition education; generative AI produces a beautiful image of a healthier alternative. No other calorie tracker closes the loop from "what did I eat?" to "here's what I could eat instead — and here's what it looks like." The premium glass UI makes the experience feel distinctly different from utilitarian fitness apps — beauty is a retention mechanism.

## Project Classification

- **Project Type:** Web App (React SPA + .NET REST API)
- **Domain:** Health & Wellness (consumer, non-regulated)
- **Complexity:** Medium — three external AI integrations, diet-aware domain logic, aggregated reporting
- **Project Context:** Greenfield
- **Portfolio purpose:** Demonstrates clean architecture rules (NFR21–NFR26) applied consistently across all layers; serves as a reference implementation for Claude Code + clean arch workflows

## Success Criteria

### User Success

- A user receives a diet-conflict warning and substitutes the flagged food with the app's suggestion — the primary success signal
- Users open the app for every meal during a day (habit formation indicator)
- Positive reinforcement ("pat on the back") lands as motivating, not patronising
- Food identification is accurate enough that users trust it without manual correction

### Business Success

- Portfolio quality: every reviewer can trace a feature from API endpoint through controller → service → repository without rule violations
- Demoable in under 5 minutes: photo in, result out, alternative suggested, report shown
- Code is a reference implementation — readable as a clean architecture teaching example

### Technical Success

- All three AI integrations operate through clean abstraction boundaries — swappable without touching domain logic
- 80%+ test coverage threshold enforced
- No architecture layer violations: `Abstractions` never references `Implementation` or `Repository`; ORM entities never leak outside `Repository`

### Measurable Outcomes

- End-to-end flow completable: snap photo → food ID + calories → diet warning → alternative suggestion + generated image
- Daily calorie summary and compliance indicator render correctly
- Diet styles (minimum: keto, low-fat, Mediterranean) all wired and functioning

## Product Scope & Roadmap

### MVP Strategy

**Approach:** Experience MVP — a complete, demoable end-to-end flow that exercises every layer of the clean architecture scaffold. Compelling in under 5 minutes.

**Resources:** 1 developer + Claude Code.

### Phase 1 — MVP

Supports Journey 1 (Maya, everyday user) and Journey 2 (Dom, lapsed user) in full.

- User profile: name + diet style (keto, low-fat, Mediterranean)
- Photo capture / file upload → Google Cloud Vision API food identification
- Calorie estimation from identified food
- Diet compatibility check → severity-graded warning (low / medium / high)
- On warning: text alternative food suggestion (Gemini)
- On good choice: positive reinforcement message
- Manual food entry fallback (when photo capture unavailable)
- Daily food log view + calorie summary with compliance indicator
- Graceful re-engagement UX (no guilt messaging on return after gap)

**Explicitly deferred to Phase 2:** AI-generated image of alternative, weekly/monthly reports, bookmark/save alternative.

### Phase 2 — Growth

- Gemini Imagen: photorealistic image of suggested alternative food
- Weekly and monthly period reports with trend visualisation
- Bookmark/save alternative suggestions
- Multiple diet styles per user
- Food history pattern insights ("you tend to go off-keto on Fridays")
- Per-nutrient nutrition education text

### Phase 3 — Expansion

- Social features: streaks, challenges
- Meal planning: AI-suggested full-day meal plan aligned to diet style
- Wearable sync (Apple Health, Google Fit)
- Community recipe library

### Scoping Risks

- *Three sequential Vertex AI calls per meal log* — non-blocking UI with per-step loading states; cache Vision results by image hash
- *Gemini food analysis quality* — invest in prompt engineering before building UI around it
- *Architecture violations* — run `/simplify` after each feature; CI enforces 80% coverage
- *Single developer* — Phase 2 features blocked until Phase 1 is demo-ready and architecture validated

## User Journeys

### Journey 1: Maya — The Everyday User (Happy Path)

Maya, 31, started keto three weeks ago. She's motivated but finds tracking exhausting — she used to spend ten minutes manually logging every meal and gave up after a week.

**Opening scene:** Lunchtime. Maya's made a bowl of leftover chicken stir-fry. She opens the app — the glass UI is calm and uncluttered. She taps the camera.

**Rising action:** She snaps the bowl. In three seconds: *"Chicken stir-fry with rice noodles — ~610 kcal."* A soft amber warning: *"High carb load — conflicts with your keto goals (severity: medium). Rice noodles are 72g net carbs."* Below it: *"Swap noodles for zucchini noodles — ~290 kcal, 6g net carbs."* A clean rendered image of a beautiful zoodle stir-fry.

**Climax:** Maya looks at the image. It looks genuinely good. She logs the meal anyway — transparency over perfection.

**Resolution:** At 9pm she checks her daily report: 1,840 kcal, 2 of 3 meals keto-compliant. *"You're building the habit."* She feels informed, not judged. She opens the app again next morning.

**Capabilities revealed:** photo capture, food ID, calorie estimation, diet conflict detection, severity grading, alternative suggestion (text), AI image of alternative, daily log view, daily calorie summary, positive framing in reports.

---

### Journey 2: Dom — The Lapsed User (Edge Case / Recovery)

Dom, 27, set up a Mediterranean diet two weeks ago. He logged for five days, then went dark for four days after a stressful work week.

**Opening scene:** Tuesday evening. Dom opens the app expecting a guilt-trip. Instead: *"Welcome back. Ready to log dinner?"*

**Rising action:** He snaps takeaway pizza: *"Pepperoni pizza, 2 slices — ~740 kcal."* Red warning: *"High saturated fat and refined carbs — significant conflict with Mediterranean diet (severity: high)."* Suggestion: *"Try a homemade flatbread with hummus, roasted peppers and feta — ~420 kcal, healthy fats."* Nutrition context: *"Saturated fat from processed meats is the concern — not carbs per se."*

**Climax:** Dom didn't expect to learn something. He logs the pizza honestly. He taps *"Save this alternative for later."*

**Resolution:** Next morning — Greek yoghurt with walnuts. Green checkmark: *"Great choice — high in healthy fats and protein, a Mediterranean staple."* The pat on the back feels earned. His Sunday weekly report shows the gap and the recovery arc — motivating, not punishing.

**Capabilities revealed:** graceful re-engagement, food ID + calories, high-severity warning, nutrition education text, alternative suggestion, AI image of alternative, bookmark/save alternative, positive reinforcement, weekly report with gap tolerance.

### Journey Requirements Summary

| Capability | Journey 1 | Journey 2 |
|---|---|---|
| Photo capture + food ID | ✓ | ✓ |
| Calorie estimation | ✓ | ✓ |
| Diet conflict + severity grading | ✓ (medium) | ✓ (high) |
| Alternative food suggestion (text) | ✓ | ✓ |
| AI image of alternative | ✓ | ✓ |
| Nutrition education context | — | ✓ |
| Positive reinforcement | — | ✓ |
| Daily log + calorie summary | ✓ | — |
| Weekly report (gap-tolerant) | — | ✓ |
| Graceful re-engagement UX | — | ✓ |
| Save/bookmark alternative | — | ✓ |

## Domain-Specific Requirements

### Compliance & Regulatory

- No regulated compliance frameworks apply (non-HIPAA, non-FDA, consumer app)
- GDPR-awareness as good practice: food log data is personal health data, deletable on user request
- **No medical claims (app-wide design constraint):** All copy — warnings, reports, alternative suggestions — must avoid clinical language. Use "estimate", "goal alignment", "habit tracking"; never "diagnosis", "prescription", or "medical advice". This is a copywriting and design rule enforced across the entire product.

### Technical Constraints

- **AI accuracy transparency:** Food ID and calorie estimates are probabilistic; display as approximate (*"~610 kcal"*). Food ID correction is a first-class interaction, not a fallback — part of core UX design.
- **Image privacy:** Photos sent to Google Cloud Vision API for processing must not be persisted server-side; only resulting food metadata is stored. No user-identifying metadata alongside photo payloads.
- **Prompt injection mitigation:** Corrected food names interpolated into Gemini generation prompts must be validated against a known-safe food vocabulary — no raw user strings passed directly to generation.
- **Diet reasoning interface design:** The Gemini LLM call bundles food evaluation + severity rating + education text + alternative suggestion. The `IFoodAnalysisService` interface must allow these concerns to evolve independently — the bundled implementation is an MVP decision, not an architectural constraint.

### Integration Requirements

- **Vision AI:** Google Cloud Vision API — food identification + calorie estimation
- **Diet reasoning + alternative suggestion:** Gemini (via Vertex AI) — diet compatibility, severity rating, nutrition education, alternative food name
- **Image generation:** Gemini Imagen (Vertex AI) — photorealistic image of suggested alternative
- All three behind interface abstractions in `Abstractions`; concrete implementations in `Implementation`; swappable without touching domain logic

### Risk Mitigations

**MVP must-have:**
- User can correct food name/portion before saving — correction is a primary UI action
- Vision results cached by image hash; per-user daily Vertex AI call budgets enforced server-side
- Graceful degradation: Vision unavailable → manual text entry; Imagen fails → text alternative only; Gemini fails → save meal without diet analysis

**Production considerations (out of MVP scope):**
- Vertex AI data processing agreement review
- Vendor data retention policy audit

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. The Snap → Educate → Inspire Loop**
Existing trackers answer "how much?" This product answers "so what?" and "what instead?" — shifting from logging to *teaching*. The AI loop (identify → contextualise → visualise alternative) is a fundamentally different interaction paradigm for health tracking.

**2. Aspirational Alternative Visualisation**
Existing apps suggest alternatives as text lists. Showing a photorealistic image of what you *could* eat exploits the same psychology as food photography — it makes the right choice desirable rather than punitive. No mainstream tracker does this.

**3. Diet-Style Aware Severity Grading**
Most trackers count against universal daily totals. This product evaluates *relative to a chosen dietary philosophy* — a banana is fine on Mediterranean, high-conflict on keto. The severity grading is domain-specific reasoning, not generic nutrition math.

**4. Education as Retention Mechanism**
Nutrition education text positions the app as a habit coach, not a calorie counter — a meaningfully different value proposition.

### Market Context & Competitive Landscape

- **MyFitnessPal / Lose It / Cronometer:** Manual/barcode logging, calorie totals. No diet-philosophy awareness, no alternative suggestions, no AI imagery.
- **Noom:** Behavioural coaching via text, no photo-based logging.
- **Calorie Mama and similar:** Photo-based food ID exists but outputs raw calorie numbers only — no diet-goal evaluation, no alternatives, no generated imagery.
- **Gap this fills:** Photo input + diet-philosophy reasoning + aspirational visual alternative in a premium-designed UI. None of the above combine all four.

### Validation Approach

- Food ID accuracy: <20% manual correction rate = sufficient trust
- Alternative uptake: any bookmark/save engagement validates the concept
- Positive reinforcement effect: on-goal meal proportion increases over time within a session
- Demo test: end-to-end flow compelling in under 5 minutes

### Innovation Risks

- **Generated images disappointing:** Start with a fixed high-quality Gemini Imagen prompt template; iterate before parameterising
- **Education text feeling preachy:** Copy tone must feel like discovery, not lecture — test early

## Web App Specific Requirements

### Architecture Overview

React SPA served by `MisteryApp.Web.Server`, consuming `MisteryApp.Web.Api` REST backend. The SPA handles UI state and routing; the API owns all data, AI orchestration, and business logic. All Vertex AI calls happen server-side — the React app never holds credentials or calls AI APIs directly.

### Technical Decisions

- **SPA:** React 18+, React Router, no SSR (fully authenticated app, no public indexable pages)
- **State management:** React Context sufficient for MVP; no Redux/Zustand unless warranted
- **Authentication:** Session/localStorage-based user identity for portfolio stage — no auth provider required
- **Glass UI:** Tailwind CSS with custom backdrop-filter utilities; avoid heavy UI libraries that conflict with the custom aesthetic. Note: `backdrop-filter` requires graceful fallback on some Android Chrome versions.
- **Camera input:** `<input type="file" accept="image/*" capture="environment">` on mobile; standard file picker on desktop
- **Photo upload flow:** Preview image locally before submitting — avoids unnecessary API calls if user cancels

### Browser Matrix

- **Target:** Chrome, Firefox, Safari — current and one prior major version; Chrome for Android, Safari iOS
- **Excluded:** Internet Explorer, legacy Edge, Opera Mini

### Performance Implementation Guidance

AI calls (Vision + Gemini) take 2–8s — use optimistic UI with skeleton loaders; never block the interface. See NFR1–NFR5 for measurable targets.

### Accessibility

Best-effort WCAG AA: semantic HTML, keyboard navigability, screen reader labels, colour contrast verified on glass surfaces (see NFR11–NFR14).

## Functional Requirements

### User Profile Management

- **FR1:** A user can create a profile with a display name and a chosen diet style
- **FR2:** A user can update their diet style at any time
- **FR3:** A user can view their current profile and active diet style
- **FR4:** A user can delete their account and all associated food log data

### Food Logging

- **FR5:** A user can capture a food photo using their device camera
- **FR6:** A user can upload a food photo from their device file system
- **FR7:** A user can view the AI-identified food name and estimated calorie count before saving
- **FR8:** A user can correct the AI-identified food name and/or portion before saving
- **FR9:** A user can enter a food description and calorie estimate manually when photo capture is unavailable
- **FR10:** A user can save a food entry to their daily log
- **FR11:** A user can delete a previously saved food entry from their log

### Diet Analysis & Feedback

- **FR12:** The system evaluates each logged food against the user's active diet style and produces a compatibility result
- **FR13:** The system assigns a severity level (low / medium / high) to each diet conflict
- **FR14:** A user receives a conflict warning with contextual nutrition education when a food conflicts with their diet style
- **FR15:** A user receives a positive reinforcement message when a logged food is compatible with their diet style
- **FR16:** The system suggests a named healthier alternative food when a conflict is detected
- **FR17:** A user can dismiss a conflict warning without acting on the suggestion

### Daily Tracking & Reporting

- **FR18:** A user can view all food entries logged for the current day
- **FR19:** A user can view the total estimated calorie count for the current day
- **FR20:** A user can view a diet compliance summary for the current day (meals on-goal vs conflicting)
- **FR21:** A user can navigate to view food logs for previous days

### Re-engagement & Continuity

- **FR22:** A user returning after a gap sees a neutral, non-judgmental re-entry experience with no guilt messaging
- **FR23:** A user can view their food log history without penalty for missed days

### AI Degradation & Fallback

- **FR24:** When photo capture fails, a user can log a meal by providing a text description and calorie count
- **FR25:** When diet analysis is unavailable, a food entry is saved without a compatibility result
- **FR26:** When the alternative suggestion service is unavailable, the conflict warning is shown without a suggestion

### Data & Privacy

- **FR27:** A user can request deletion of all their personal data
- **FR28:** Food photos are not stored by the system beyond the identification request

## Non-Functional Requirements

### Performance

- **NFR1:** The UI renders an initial loading state within 500ms of any user action
- **NFR2:** Food photo upload acknowledgement completes within 1 second on 4G
- **NFR3:** Full AI pipeline result (food ID + diet analysis + alternative suggestion) displayed within 8 seconds under normal conditions
- **NFR4:** React SPA reaches interactive state within 3 seconds on 4G mobile (Lighthouse TTI)
- **NFR5:** Gemini Imagen results cached client-side for the session — not re-fetched on navigation

### Security

- **NFR6:** All SPA–API communication over HTTPS
- **NFR7:** All Vertex AI and Google Cloud credentials stored as server-side environment secrets — never client-exposed
- **NFR8:** Food photos transmitted to Vision API and immediately discarded server-side — not persisted
- **NFR9:** Corrected food names validated against a known-safe food vocabulary before interpolation into any AI prompt
- **NFR10:** Food log data logically isolated per user — no cross-user data access possible

### Accessibility

- **NFR11:** All interactive elements keyboard-navigable
- **NFR12:** All images and icons have descriptive alt text or ARIA labels
- **NFR13:** Colour contrast meets WCAG AA minimum (4.5:1 for normal text) including on glass/semi-transparent surfaces
- **NFR14:** Core food logging flow usable with a screen reader

### Integration

- **NFR15:** Each Vertex AI integration (Vision, Gemini, Imagen) encapsulated behind an interface in `Abstractions` — concrete provider swappable without changing domain logic
- **NFR16:** Unavailability of any single AI service does not prevent core logging flow from functioning
- **NFR17:** Per-user daily Vertex AI call budgets enforced server-side

### Reliability

- **NFR18:** 80% minimum test coverage enforced (`dotnet test /p:Threshold=80`)
- **NFR19:** Every AI service call has a defined timeout — no request blocks the user experience indefinitely
- **NFR20:** Food log entries persisted immediately on save — a page refresh does not lose a logged entry

### Architecture & Code Quality

- **NFR21:** All C# code conforms to per-project `CLAUDE.md` files and `rules/csharp/` — these are the authoritative coding standards
- **NFR22:** No layer violations: `Abstractions` never references `Implementation` or `Repository`; ORM entities never leak outside `Repository`
- **NFR23:** All public and internal methods on service and repository classes are `virtual` (required for Moq isolation)
- **NFR24:** `FluentValidation` used for all request validation — no Data Annotations on records
- **NFR25:** `TimeProvider` injected for all time-dependent logic — no direct `DateTime.UtcNow` calls in service classes
- **NFR26:** Each assembly registers its own services via an `Add{Feature}()` extension in the `Microsoft.Extensions.DependencyInjection` namespace
