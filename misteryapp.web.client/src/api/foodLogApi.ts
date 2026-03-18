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
