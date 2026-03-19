# E10 — Eager Analysis & Frictionless Calorie Entry

## Goal

Eliminate the 18-second post-Save dead zone by moving diet analysis and calorie estimation into the capture phase. The user gets feedback while they are still looking at what they photographed or typing what they ate — not after they have already committed to logging it.

## Problem Statement

Current sequential pipeline (photo flow):
```
snap → identify (8s) → user edits → Save → analyseEntry (8s) → getAlternativeImage (10s)
```

The user waits ~18 seconds *after* deciding to log. Analysis arrives too late to influence the decision. Manual calorie entry adds friction for a number that the AI already knows.

## Target Experience

**Photo track**: snap → identification runs in background → conflict/compatibility result appears on screen while user is still reviewing the identified food → Save is a confirmation, not a trigger.

**Manual track**: user types → after a pause, diet preview and calorie estimate appear inline → Save is a confirmation.

**Calories**: always AI-estimated with a visual `~` prefix; user taps to adjust if needed. Never a blank mandatory field.

---

## Architecture Changes

### New backend endpoints

#### `POST /api/food-entries/analyse-preview`
Stateless diet analysis. No DB write. Powers both tracks.

Request:
```json
{ "foodName": "Grilled Salmon", "userId": 42 }
```

Response (`ApiResponse<AnalysisPreviewResult>`):
```json
{
  "compatible": false,
  "severity": "High",
  "educationText": "...",
  "alternativeFoodName": "Baked Cod",
  "estimatedCalories": 367
}
```

- Implemented in `Implementation` as `IFoodAnalysisPreviewService` / `GeminiFoodAnalysisPreviewService`.
- Single Gemini call. Prompt extends the existing E5 prompt to include `estimatedCalories` in the JSON output.
- Reuses `GeminiOptions` (same API key, model, timeout).
- Returns `null`-safe `estimatedCalories` (Gemini may omit it; service returns 0 as fallback sentinel).
- Registered as typed `HttpClient` identical to existing `IFoodAnalysisService`.
- `FoodEntriesController` adds the route. No service/repo state touched.

#### `PATCH /api/food-entries/{id}/analysis`
Persists a pre-computed analysis result to an existing entry. No Gemini call.

Request:
```json
{ "analysisResultJson": "{\"Compatible\":true,...}" }
```

- New `PatchFoodEntryAnalysisRequest` record in `Abstractions`.
- `IFoodLogRepository.FoodEntryPatchAnalysisAsync(int id, string json, CancellationToken)` — tracked select + field update (same InMemory-safe pattern as `FoodEntryUpdateAnalysisAsync`).
- `IFoodLogService.PatchFoodEntryAnalysisAsync(int entryId, string json, CancellationToken)`.
- `FoodEntriesController` adds the route.

### Modified existing

- `FoodAnalysisResult` (Abstractions) — add `int EstimatedCalories` property. Default `0` for null/missing from Gemini. Existing persisted JSON blobs that lack this field deserialize to `0` safely.
- `CreateFoodEntryRequestValidator` — `EstimatedCalories` remains 0–9999 but is no longer required to be non-zero (0 is valid fallback).

### No changes to

- `analyseEntry` endpoint — stays as-is. Used as fallback when pre-analysis is unavailable or stale at Save time.
- `suggestAlternative` endpoint — stays post-Save. Pre-save conflict card shows one alternative only.
- `getImageForFoodName` — already stateless, usable pre-Save. No change.

---

## Stories

### S10.1 — `analyse-preview` endpoint

**What**: `POST /api/food-entries/analyse-preview` returns `AnalysisPreviewResult` (compatible, severity, educationText, alternativeFoodName, estimatedCalories). No DB write.

**Acceptance criteria**:
- Returns `ApiResponse<AnalysisPreviewResult>` with all fields populated.
- `estimatedCalories` is present in response; 0 if Gemini omits it.
- Unknown `userId` (user not found) → 404 via global exception handler (service calls `UserProfileSingleByIdAsync` first to validate user existence).
- Empty or invalid `foodName` → 400 (validator: same `SafeCharactersPattern` + `BlockedKeywords` as `CreateFoodEntryRequestValidator`).
- Gemini timeout/failure → graceful fallback: `compatible: true, severity: None, educationText: null, alternativeFoodName: null, estimatedCalories: 0`.
- Budget/timeout logic mirrors `GeminiFoodAnalysisService` (reuse `GeminiOptions`).

**Tests** (Implementation.Tests):
- `AnalysePreview_ReturnsResult_WhenGeminiResponds`
- `AnalysePreview_ReturnsCalorieEstimate_WhenGeminiIncludesIt`
- `AnalysePreview_ReturnsFallback_WhenGeminiFails`
- `AnalysePreview_ReturnsFallback_WhenTimeout`

**Tests** (Web.Api.Tests):
- `PostAnalysePreview_Returns200_WithValidPayload` (FakePreviewService stub)
- `PostAnalysePreview_Returns404_WhenUserNotFound`
- `PostAnalysePreview_Returns400_WhenFoodNameBlocked`

---

### S10.2 — `PATCH /api/food-entries/{id}/analysis` endpoint

**What**: Persists a client-supplied analysis JSON to an existing entry. Used by the frontend after Save when pre-analysis is available and valid.

**Acceptance criteria**:
- Stores `analysisResultJson` on the entry.
- Unknown `entryId` → 404.
- Malformed JSON accepted as-is (server does not re-parse; client sends what it received from `analyse-preview`).
- Returns `ApiResponse<bool>` with `success: true`.

**Tests** (Repository.Tests):
- `FoodEntryPatchAnalysis_UpdatesField_WhenEntryExists`
- `FoodEntryPatchAnalysis_ThrowsNotFoundException_WhenEntryMissing`

**Tests** (Web.Api.Tests):
- `PatchAnalysis_Returns200_WhenEntryExists`
- `PatchAnalysis_Returns404_WhenEntryMissing`

---

### S10.3 — `FoodAnalysisResult.EstimatedCalories` field

**What**: Add `int EstimatedCalories` to `FoodAnalysisResult` in Abstractions. Update Gemini prompt to include it. Update JSON extraction regex guard for new field.

**Acceptance criteria**:
- Gemini prompt asks for `estimatedCalories` in the JSON output.
- Deserialization of old persisted blobs (without `estimatedCalories`) does not throw — field defaults to `0`.
- `DailyLogSummary` total calories computation unaffected (reads from `FoodEntry.EstimatedCalories`, not from analysis JSON).

**Tests**: extend existing `GeminiFoodAnalysisServiceTests` — add one test asserting `EstimatedCalories > 0` when Gemini returns a valid value.

---

### S10.4 — Photo track: eager pre-analysis

**What**: After Vision identification resolves, immediately fire `analysePreview` in the background. Show inline conflict/compatibility result while the user is still on the entry form.

**Behaviour spec**:

| Scenario | Behaviour |
|---|---|
| `confidenceLevel >= 0.85` | Auto-populate name + calories. Fire `analysePreview` immediately with identified name. |
| `confidenceLevel < 0.85` | Auto-populate name with dashed-border "uncertain" styling. Do NOT fire preview yet. Fire on name field blur. |
| User edits food name | Clear existing preview result. Cancel in-flight preview call. Restart debounce (1200ms). |
| Preview result arrives | Show inline analysis card (same glass card style as current post-Save result). Show `~{n} kcal` calorie pill below food name. |
| User hits Save with valid preview (name unchanged) | `createFoodEntry` → `PATCH /food-entries/{id}/analysis` with pre-computed JSON. Skip `analyseEntry`. Navigate to analysis result display. |
| User hits Save with stale/in-flight preview | `createFoodEntry` → `analyseEntry` (existing flow). Cancel pending preview call. |
| Preview unavailable (Gemini down) | Silent — no inline card shown. Save proceeds with `analyseEntry` fallback. |

**State additions** (FoodLoggingPage):
- `previewResult: AnalysisPreviewResult | null`
- `previewedFoodName: string` — food name used for the active preview
- `previewLoading: boolean`
- `previewAbortRef: RefObject<AbortController | null>`

**Acceptance criteria**:
- Preview card visible before Save when Vision confidence ≥ 0.85.
- Editing food name clears preview card immediately.
- Calorie pill shows `~{n} kcal` with tap-to-edit expanding to a number input.
- "Suggest another" button NOT present on pre-save conflict card. One sentence: "Save to explore more alternatives."
- Alternative image generation (`getImageForFoodName`) fires as soon as pre-analysis returns a non-compatible result — uses existing stateless endpoint, no entryId needed.
- Cleanup `useEffect` aborts `previewAbortRef` on unmount.

---

### S10.5 — Manual track: debounced pre-analysis

**What**: When user types in the food name field (no photo), fire `analysePreview` after a 1200ms debounce with a minimum of 4 characters.

**Behaviour spec**:

| Scenario | Behaviour |
|---|---|
| User types < 4 chars | No preview fired. |
| User types ≥ 4 chars, pauses 1200ms | Fire `analysePreview`. Show loading shimmer in preview area. |
| User types more before debounce fires | Cancel previous debounce timer. Restart. |
| User types more after preview is showing | Clear preview. Cancel in-flight call. Restart debounce. |
| Save with valid preview | Same as photo track: PATCH instead of analyseEntry. |
| Save with stale/pending | analyseEntry fallback. |

**Acceptance criteria**:
- No API call fired for food names shorter than 4 characters.
- No API call fired on every keystroke — only after the debounce period.
- Preview result and calorie pill appear inline without page transition.
- Save is never blocked waiting for preview to complete.

---

### S10.6 — Calorie pill UX

**What**: Replace the mandatory calories number input with a `~{n} kcal` pill. User taps to reveal an editable input.

**Behaviour spec**:

| Scenario | Calorie source | Display |
|---|---|---|
| Photo, high confidence | Vision `estimatedCalories` (pre-analysis fires, may update) | `~{n} kcal` |
| Photo, pre-analysis resolves | `analysePreview.estimatedCalories` (if > 0, overrides Vision) | `~{n} kcal` |
| Manual, pre-analysis resolves | `analysePreview.estimatedCalories` | `~{n} kcal` |
| No estimate available (all sources 0) | — | `Tap to set calories` (muted) |
| User taps pill | Pill expands to number input, pre-filled with current estimate | Editable |
| User confirms input | Pill collapses, shows user value without `~` prefix | `340 kcal` |

**Acceptance criteria**:
- Calories field never blocks Save — if no estimate and user does not tap, `estimatedCalories` defaults to `0` on Save.
- Validator still rejects values > 9999.
- `~` prefix only on AI-sourced values, not user-edited values.
- Pill visible in both photo and manual tracks.

---

### S10.7 — Post-Save flow cleanup

**What**: Update the Save handler to use pre-computed analysis when available, and fall back to the existing `analyseEntry` path when not.

**Logic** (pseudocode):
```
const usePreview = previewResult !== null && previewedFoodName === foodName.trim()

const entry = await createFoodEntry(...)

if (usePreview) {
  await patchAnalysis(entry.id, serialize(previewResult))
  setAnalysisResult(previewResult)
  setAnalysing(false)
} else {
  setAnalysing(true)
  const result = await analyseEntry(entry.id, signal)
  setAnalysisResult(result)
  setAnalysing(false)
}
```

**Acceptance criteria**:
- When preview is used: `analyseEntry` is NOT called.
- When fallback: `analyseEntry` IS called (existing behaviour unchanged).
- `suggestAlternative` behaviour unchanged (always post-Save, always uses `entryId`).
- Alternative image for post-save conflict: `getAlternativeImage(entryId)` as before.

---

## Non-goals

- Voice input.
- Nutrition database integration (Nutritionix, Edamam) — Gemini provides sufficient approximation.
- Volume estimation from photos — requires depth data not available from standard phone camera.
- Stateless `suggest-alternative-preview` — deferred; one alternative pre-save is sufficient.

---

## Dependency map

```
S10.1 (analyse-preview endpoint)
  └── S10.3 (EstimatedCalories field) — must land first
  └── S10.4 (photo track) — depends on S10.1
  └── S10.5 (manual track) — depends on S10.1

S10.2 (PATCH analysis endpoint)
  └── S10.7 (post-save cleanup) — depends on S10.2

S10.6 (calorie pill UX) — depends on S10.4 + S10.5 (calorie data source)
S10.7 (post-save cleanup) — depends on S10.1 + S10.2
```

Suggested implementation order: S10.3 → S10.1 → S10.2 → S10.4 → S10.5 → S10.6 → S10.7

---

## Test count target

Current baseline: 113 tests passing.

Expected additions: ~22 new tests (7 unit, 8 integration, 7 frontend-adjacent via API integration).

Target: ~135 tests passing at epic completion.
