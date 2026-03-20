import type { IFoodLogService } from '../domain/interfaces/i-food-log-service'
import type { IFoodLogRepository } from '../domain/interfaces/i-food-log-repository'
import type {
  FoodEntry,
  FoodEntrySource,
  FoodIdentificationResult,
  FoodAnalysisResult,
  AnalysisPreviewResult,
  DailyLogSummary,
  AlternativeImageResult,
  AlternativeSuggestion,
} from '../domain/models'

export class FoodLogService implements IFoodLogService {
  constructor(private readonly repo: IFoodLogRepository) {}

  createEntry(
    userId: number,
    foodName: string,
    estimatedCalories: number,
    source: FoodEntrySource,
    imageBase64?: string | null
  ): Promise<FoodEntry> {
    return this.repo.foodEntryCreate(userId, foodName, estimatedCalories, source, imageBase64)
  }

  deleteEntry(id: number): Promise<void> {
    return this.repo.foodEntryDelete(id)
  }

  getDailyEntries(userId: number, date: string, signal?: AbortSignal): Promise<FoodEntry[]> {
    return this.repo.foodEntryGetByUserAndDate(userId, date, signal)
  }

  getDailySummary(userId: number, date: string, signal?: AbortSignal): Promise<DailyLogSummary | null> {
    return this.repo.foodEntryGetDailySummary(userId, date, signal)
  }

  identifyFood(image: File, userId: number, signal?: AbortSignal): Promise<FoodIdentificationResult | null> {
    return this.repo.foodIdentify(image, userId, signal)
  }

  analyseEntry(entryId: number, signal?: AbortSignal): Promise<FoodAnalysisResult | null> {
    return this.repo.foodEntryAnalyse(entryId, signal)
  }

  analysePreview(foodName: string, userId: number, signal?: AbortSignal): Promise<AnalysisPreviewResult | null> {
    return this.repo.foodEntryAnalysePreview(foodName, userId, signal)
  }

  patchAnalysis(entryId: number, analysisResultJson: string, signal?: AbortSignal): Promise<void> {
    return this.repo.foodEntryPatchAnalysis(entryId, analysisResultJson, signal)
  }

  suggestAlternative(
    entryId: number,
    excludedNames: string[],
    signal?: AbortSignal
  ): Promise<AlternativeSuggestion | null> {
    return this.repo.foodEntrySuggestAlternative(entryId, excludedNames, signal)
  }

  suggestAlternativeByName(
    foodName: string,
    userId: number,
    excludedNames: string[],
    signal?: AbortSignal
  ): Promise<AlternativeSuggestion | null> {
    return this.repo.foodEntrySuggestAlternativeByName(foodName, userId, excludedNames, signal)
  }

  getAlternativeImage(entryId: number, signal?: AbortSignal): Promise<AlternativeImageResult | null> {
    return this.repo.foodEntryGetAlternativeImage(entryId, signal)
  }

  getImageForFoodName(foodName: string, userId: number, signal?: AbortSignal): Promise<AlternativeImageResult | null> {
    return this.repo.foodEntryGetImageForFoodName(foodName, userId, signal)
  }
}
