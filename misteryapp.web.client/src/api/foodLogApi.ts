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
