import type { IFoodLogRepository } from '../domain/interfaces/i-food-log-repository'
import type {
  ApiResponse,
  FoodEntry,
  FoodEntrySource,
  FoodIdentificationResult,
  FoodAnalysisResult,
  AnalysisPreviewResult,
  DailyLogSummary,
  AlternativeImageResult,
  AlternativeSuggestion,
} from '../domain/models'
import { AppError } from '../domain/errors'

export class HttpFoodLogRepository implements IFoodLogRepository {
  async foodEntryCreate(
    userId: number,
    foodName: string,
    estimatedCalories: number,
    source: FoodEntrySource,
    imageBase64?: string | null
  ): Promise<FoodEntry> {
    const res = await fetch('/api/food-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, foodName, estimatedCalories, source, imageBase64: imageBase64 ?? null }),
    })
    const json: ApiResponse<FoodEntry> = await res.json()
    if (!json.success || !json.data) throw new AppError(json.error ?? 'Failed to save food entry', 'API_ERROR')
    return json.data
  }

  async foodEntryDelete(id: number): Promise<void> {
    const res = await fetch(`/api/food-entries/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new AppError(`Delete failed (status ${res.status})`, 'API_ERROR')
  }

  async foodEntryGetByUserAndDate(userId: number, date: string, signal?: AbortSignal): Promise<FoodEntry[]> {
    const tz = new Date().getTimezoneOffset()
    try {
      const res = await fetch(
        `/api/food-entries?userId=${userId}&date=${date}&timezoneOffsetMinutes=${tz}`,
        { signal }
      )
      if (!res.ok) return []
      const json: ApiResponse<FoodEntry[]> = await res.json()
      return json.success && json.data ? json.data : []
    } catch {
      return []
    }
  }

  async foodEntryGetDailySummary(
    userId: number,
    date: string,
    signal?: AbortSignal
  ): Promise<DailyLogSummary | null> {
    const tz = new Date().getTimezoneOffset()
    try {
      const res = await fetch(
        `/api/food-entries/summary?userId=${userId}&date=${date}&timezoneOffsetMinutes=${tz}`,
        { signal }
      )
      if (!res.ok) return null
      const json: ApiResponse<DailyLogSummary> = await res.json()
      return json.success && json.data ? json.data : null
    } catch {
      return null
    }
  }

  async foodIdentify(image: File, userId: number, signal?: AbortSignal): Promise<FoodIdentificationResult | null> {
    const formData = new FormData()
    formData.append('image', image)
    formData.append('userId', String(userId))

    try {
      const res = await fetch('/api/food-entries/identify', {
        method: 'POST',
        body: formData,
        signal,
      })
      if (!res.ok) return null
      const json: ApiResponse<FoodIdentificationResult> = await res.json()
      if (!json.success || !json.data) return null
      return json.data
    } catch {
      return null
    }
  }

  async foodEntryAnalyse(entryId: number, signal?: AbortSignal): Promise<FoodAnalysisResult | null> {
    try {
      const res = await fetch(`/api/food-entries/${entryId}/analyse`, {
        method: 'POST',
        signal,
      })
      if (!res.ok) return null
      const json: ApiResponse<FoodAnalysisResult> = await res.json()
      if (!json.success || !json.data) return null
      return json.data
    } catch {
      return null
    }
  }

  async foodEntryAnalysePreview(
    foodName: string,
    userId: number,
    signal?: AbortSignal
  ): Promise<AnalysisPreviewResult | null> {
    try {
      const res = await fetch('/api/food-entries/analyse-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName, userId }),
        signal,
      })
      if (!res.ok) return null
      const json: ApiResponse<AnalysisPreviewResult> = await res.json()
      if (!json.success || !json.data) return null
      return json.data
    } catch {
      return null
    }
  }

  async foodEntryPatchAnalysis(
    entryId: number,
    analysisResultJson: string,
    signal?: AbortSignal
  ): Promise<void> {
    try {
      await fetch(`/api/food-entries/${entryId}/analysis`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisResultJson }),
        signal,
      })
    } catch {
      // silent — post-save state already set from preview
    }
  }

  async foodEntrySuggestAlternative(
    entryId: number,
    excludedNames: string[],
    signal?: AbortSignal
  ): Promise<AlternativeSuggestion | null> {
    try {
      const res = await fetch(`/api/food-entries/${entryId}/suggest-alternative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludedNames }),
        signal,
      })
      if (!res.ok) return null
      const json: ApiResponse<AlternativeSuggestion> = await res.json()
      if (!json.success || !json.data) return null
      return json.data
    } catch {
      return null
    }
  }

  async foodEntrySuggestAlternativeByName(
    foodName: string,
    userId: number,
    excludedNames: string[],
    signal?: AbortSignal
  ): Promise<AlternativeSuggestion | null> {
    try {
      const res = await fetch('/api/food-entries/suggest-alternative-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName, userId, excludedNames }),
        signal,
      })
      if (!res.ok) return null
      const json: ApiResponse<AlternativeSuggestion> = await res.json()
      if (!json.success || !json.data) return null
      return json.data
    } catch {
      return null
    }
  }

  async foodEntryGetAlternativeImage(
    entryId: number,
    signal?: AbortSignal
  ): Promise<AlternativeImageResult | null> {
    try {
      const res = await fetch(`/api/food-entries/${entryId}/alternative-image`, { signal })
      if (!res.ok) return null
      const json: ApiResponse<AlternativeImageResult> = await res.json()
      if (!json.success || !json.data) return null
      return json.data
    } catch {
      return null
    }
  }

  async foodEntryGetImageForFoodName(
    foodName: string,
    userId: number,
    signal?: AbortSignal
  ): Promise<AlternativeImageResult | null> {
    try {
      const res = await fetch(
        `/api/food-entries/suggest-image?foodName=${encodeURIComponent(foodName)}&userId=${userId}`,
        { signal }
      )
      if (!res.ok) return null
      const json: ApiResponse<AlternativeImageResult> = await res.json()
      if (!json.success || !json.data) return null
      return json.data
    } catch {
      return null
    }
  }
}
