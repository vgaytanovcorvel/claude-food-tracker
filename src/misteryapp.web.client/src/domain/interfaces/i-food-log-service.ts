import type {
  FoodEntry,
  FoodEntrySource,
  FoodIdentificationResult,
  FoodAnalysisResult,
  AnalysisPreviewResult,
  DailyLogSummary,
  AlternativeImageResult,
  AlternativeSuggestion,
} from '../models'

export interface IFoodLogService {
  createEntry(
    userId: number,
    foodName: string,
    estimatedCalories: number,
    source: FoodEntrySource,
    imageBase64?: string | null
  ): Promise<FoodEntry>
  deleteEntry(id: number): Promise<void>
  getDailyEntries(userId: number, date: string, signal?: AbortSignal): Promise<FoodEntry[]>
  getDailySummary(userId: number, date: string, signal?: AbortSignal): Promise<DailyLogSummary | null>
  identifyFood(image: File, userId: number, signal?: AbortSignal): Promise<FoodIdentificationResult | null>
  analyseEntry(entryId: number, signal?: AbortSignal): Promise<FoodAnalysisResult | null>
  analysePreview(foodName: string, userId: number, signal?: AbortSignal): Promise<AnalysisPreviewResult | null>
  patchAnalysis(entryId: number, analysisResultJson: string, signal?: AbortSignal): Promise<void>
  suggestAlternative(entryId: number, excludedNames: string[], signal?: AbortSignal): Promise<AlternativeSuggestion | null>
  suggestAlternativeByName(
    foodName: string,
    userId: number,
    excludedNames: string[],
    signal?: AbortSignal
  ): Promise<AlternativeSuggestion | null>
  getAlternativeImage(entryId: number, signal?: AbortSignal): Promise<AlternativeImageResult | null>
  getImageForFoodName(foodName: string, userId: number, signal?: AbortSignal): Promise<AlternativeImageResult | null>
}
