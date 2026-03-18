import type { ApiResponse } from './types'

export type FoodEntrySource = 'Manual' | 'Photo'

export interface FoodEntry {
  id: number
  userId: number
  foodName: string
  estimatedCalories: number
  loggedAt: string
  source: FoodEntrySource
  analysisResult: string | null
}

export interface FoodIdentificationResult {
  foodName: string
  estimatedCalories: number
  confidenceLevel: number
}

export interface FoodAnalysisResult {
  compatible: boolean
  severity: 'None' | 'Low' | 'Medium' | 'High'
  educationText: string
  alternativeFoodName: string | null
}

export async function identifyFood(
  image: File,
  userId: number,
  signal?: AbortSignal
): Promise<FoodIdentificationResult | null> {
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

export async function createFoodEntry(
  userId: number,
  foodName: string,
  estimatedCalories: number,
  source: FoodEntrySource
): Promise<FoodEntry> {
  const res = await fetch('/api/food-entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, foodName, estimatedCalories, source }),
  })
  const json: ApiResponse<FoodEntry> = await res.json()
  if (!json.success || !json.data) throw new Error(json.error ?? 'Failed to save food entry')
  return json.data
}

export async function deleteFoodEntry(id: number): Promise<void> {
  await fetch(`/api/food-entries/${id}`, { method: 'DELETE' })
}

export interface DailyLogSummary {
  date: string
  totalCalories: number
  onGoalCount: number
  conflictCount: number
  complianceLabel: string
}

export async function getDailyEntries(
  userId: number,
  date: string,
  signal?: AbortSignal
): Promise<FoodEntry[]> {
  try {
    const res = await fetch(`/api/food-entries?userId=${userId}&date=${date}`, { signal })
    if (!res.ok) return []
    const json: ApiResponse<FoodEntry[]> = await res.json()
    return json.success && json.data ? json.data : []
  } catch {
    return []
  }
}

export async function getDailySummary(
  userId: number,
  date: string,
  signal?: AbortSignal
): Promise<DailyLogSummary | null> {
  try {
    const res = await fetch(`/api/food-entries/summary?userId=${userId}&date=${date}`, { signal })
    if (!res.ok) return null
    const json: ApiResponse<DailyLogSummary> = await res.json()
    return json.success && json.data ? json.data : null
  } catch {
    return null
  }
}

export async function analyseEntry(
  entryId: number,
  signal?: AbortSignal
): Promise<FoodAnalysisResult | null> {
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

export interface AlternativeImageResult {
  imageBase64: string | null
  mimeType: string | null
}

export async function getAlternativeImage(
  entryId: number,
  signal?: AbortSignal
): Promise<AlternativeImageResult | null> {
  const cacheKey = `altimg:${entryId}`
  const cached = sessionStorage.getItem(cacheKey)
  if (cached) {
    try { return JSON.parse(cached) } catch { /* ignore */ }
  }
  try {
    const res = await fetch(`/api/food-entries/${entryId}/alternative-image`, { signal })
    if (!res.ok) return null
    const json: ApiResponse<AlternativeImageResult> = await res.json()
    if (!json.success || !json.data) return null
    if (json.data.imageBase64 !== null) {
      sessionStorage.setItem(cacheKey, JSON.stringify(json.data))
    }
    return json.data
  } catch {
    return null
  }
}
