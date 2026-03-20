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

export interface IFoodLogRepository {
  foodEntryCreate(
    userId: number,
    foodName: string,
    estimatedCalories: number,
    source: FoodEntrySource,
    imageBase64?: string | null
  ): Promise<FoodEntry>
  foodEntryDelete(id: number): Promise<void>
  foodEntryGetByUserAndDate(userId: number, date: string, signal?: AbortSignal): Promise<FoodEntry[]>
  foodEntryGetDailySummary(userId: number, date: string, signal?: AbortSignal): Promise<DailyLogSummary | null>
  foodIdentify(image: File, userId: number, signal?: AbortSignal): Promise<FoodIdentificationResult | null>
  foodEntryAnalyse(entryId: number, signal?: AbortSignal): Promise<FoodAnalysisResult | null>
  foodEntryAnalysePreview(
    foodName: string,
    userId: number,
    signal?: AbortSignal
  ): Promise<AnalysisPreviewResult | null>
  foodEntryPatchAnalysis(
    entryId: number,
    analysisResultJson: string,
    signal?: AbortSignal
  ): Promise<void>
  foodEntrySuggestAlternative(
    entryId: number,
    excludedNames: string[],
    signal?: AbortSignal
  ): Promise<AlternativeSuggestion | null>
  foodEntrySuggestAlternativeByName(
    foodName: string,
    userId: number,
    excludedNames: string[],
    signal?: AbortSignal
  ): Promise<AlternativeSuggestion | null>
  foodEntryGetAlternativeImage(entryId: number, signal?: AbortSignal): Promise<AlternativeImageResult | null>
  foodEntryGetImageForFoodName(
    foodName: string,
    userId: number,
    signal?: AbortSignal
  ): Promise<AlternativeImageResult | null>
}
