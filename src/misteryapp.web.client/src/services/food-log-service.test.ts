import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FoodLogService } from './food-log-service'
import type { IFoodLogRepository } from '../domain/interfaces/i-food-log-repository'
import type {
  FoodEntry,
  FoodIdentificationResult,
  FoodAnalysisResult,
  AnalysisPreviewResult,
  DailyLogSummary,
  AlternativeImageResult,
  AlternativeSuggestion,
} from '../domain/models'

const mockEntry: FoodEntry = {
  id: 10,
  userId: 1,
  foodName: 'Grilled Chicken',
  estimatedCalories: 350,
  loggedAt: '2024-01-15T12:00:00Z',
  source: 'Manual',
  analysisResult: null,
  imageBase64: null,
}

const mockSummary: DailyLogSummary = {
  date: '2024-01-15',
  totalCalories: 350,
  onGoalCount: 1,
  conflictCount: 0,
  complianceLabel: '1 of 1 meals on goal',
}

const mockIdentification: FoodIdentificationResult = {
  foodName: 'Grilled Chicken',
  estimatedCalories: 350,
  confidenceLevel: 0.92,
}

const mockAnalysis: FoodAnalysisResult = {
  compatible: true,
  severity: 'None',
  educationText: 'Great choice.',
  alternativeFoodName: null,
  estimatedCalories: 350,
}

const mockPreview: AnalysisPreviewResult = {
  compatible: true,
  severity: 'None',
  educationText: null,
  alternativeFoodName: null,
  estimatedCalories: 350,
}

const mockImage: AlternativeImageResult = {
  imageBase64: 'abc123',
  mimeType: 'image/jpeg',
}

const mockSuggestion: AlternativeSuggestion = { foodName: 'Greek Salad' }

function makeMockRepo(): IFoodLogRepository {
  return {
    foodEntryCreate: vi.fn(),
    foodEntryDelete: vi.fn(),
    foodEntryGetByUserAndDate: vi.fn(),
    foodEntryGetDailySummary: vi.fn(),
    foodIdentify: vi.fn(),
    foodEntryAnalyse: vi.fn(),
    foodEntryAnalysePreview: vi.fn(),
    foodEntryPatchAnalysis: vi.fn(),
    foodEntrySuggestAlternative: vi.fn(),
    foodEntrySuggestAlternativeByName: vi.fn(),
    foodEntryGetAlternativeImage: vi.fn(),
    foodEntryGetImageForFoodName: vi.fn(),
  }
}

describe('FoodLogService', () => {
  let repo: IFoodLogRepository
  let service: FoodLogService

  beforeEach(() => {
    repo = makeMockRepo()
    service = new FoodLogService(repo)
  })

  describe('getDailyEntries', () => {
    it('getDailyEntries_ShouldDelegateToRepository_WhenCalled', async () => {
      // Arrange
      const userId = 1
      const date = '2024-01-15'
      vi.mocked(repo.foodEntryGetByUserAndDate).mockResolvedValue([mockEntry])

      // Act
      const result = await service.getDailyEntries(userId, date)

      // Assert
      expect(repo.foodEntryGetByUserAndDate).toHaveBeenCalledTimes(1)
      expect(repo.foodEntryGetByUserAndDate).toHaveBeenCalledWith(userId, date, undefined)
      expect(result).toEqual([mockEntry])
    })
  })

  describe('getDailySummary', () => {
    it('getDailySummary_ShouldDelegateToRepository_WhenCalled', async () => {
      // Arrange
      const userId = 1
      const date = '2024-01-15'
      vi.mocked(repo.foodEntryGetDailySummary).mockResolvedValue(mockSummary)

      // Act
      const result = await service.getDailySummary(userId, date)

      // Assert
      expect(repo.foodEntryGetDailySummary).toHaveBeenCalledTimes(1)
      expect(repo.foodEntryGetDailySummary).toHaveBeenCalledWith(userId, date, undefined)
      expect(result).toEqual(mockSummary)
    })
  })

  describe('createEntry', () => {
    it('createEntry_ShouldDelegateToRepository_WhenCalled', async () => {
      // Arrange
      const userId = 1
      const foodName = 'Grilled Chicken'
      const calories = 350
      const source = 'Manual' as const
      vi.mocked(repo.foodEntryCreate).mockResolvedValue(mockEntry)

      // Act
      const result = await service.createEntry(userId, foodName, calories, source, null)

      // Assert
      expect(repo.foodEntryCreate).toHaveBeenCalledTimes(1)
      expect(repo.foodEntryCreate).toHaveBeenCalledWith(userId, foodName, calories, source, null)
      expect(result).toEqual(mockEntry)
    })
  })

  describe('deleteEntry', () => {
    it('deleteEntry_ShouldDelegateToRepository_WhenCalled', async () => {
      // Arrange
      const entryId = 10
      vi.mocked(repo.foodEntryDelete).mockResolvedValue(undefined)

      // Act
      await service.deleteEntry(entryId)

      // Assert
      expect(repo.foodEntryDelete).toHaveBeenCalledTimes(1)
      expect(repo.foodEntryDelete).toHaveBeenCalledWith(entryId)
    })
  })

  describe('identifyFood', () => {
    it('identifyFood_ShouldDelegateToRepository_WhenCalled', async () => {
      // Arrange
      const file = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })
      const userId = 1
      vi.mocked(repo.foodIdentify).mockResolvedValue(mockIdentification)

      // Act
      const result = await service.identifyFood(file, userId)

      // Assert
      expect(repo.foodIdentify).toHaveBeenCalledTimes(1)
      expect(repo.foodIdentify).toHaveBeenCalledWith(file, userId, undefined)
      expect(result).toEqual(mockIdentification)
    })
  })

  describe('analysePreview', () => {
    it('analysePreview_ShouldDelegateToRepository_WhenCalled', async () => {
      // Arrange
      const foodName = 'Grilled Chicken'
      const userId = 1
      vi.mocked(repo.foodEntryAnalysePreview).mockResolvedValue(mockPreview)

      // Act
      const result = await service.analysePreview(foodName, userId)

      // Assert
      expect(repo.foodEntryAnalysePreview).toHaveBeenCalledTimes(1)
      expect(repo.foodEntryAnalysePreview).toHaveBeenCalledWith(foodName, userId, undefined)
      expect(result).toEqual(mockPreview)
    })
  })

  describe('analyseEntry', () => {
    it('analyseEntry_ShouldDelegateToRepository_WhenCalled', async () => {
      // Arrange
      const entryId = 10
      vi.mocked(repo.foodEntryAnalyse).mockResolvedValue(mockAnalysis)

      // Act
      const result = await service.analyseEntry(entryId)

      // Assert
      expect(repo.foodEntryAnalyse).toHaveBeenCalledTimes(1)
      expect(repo.foodEntryAnalyse).toHaveBeenCalledWith(entryId, undefined)
      expect(result).toEqual(mockAnalysis)
    })
  })

  describe('getAlternativeImage', () => {
    it('getAlternativeImage_ShouldDelegateToRepository_WhenCalled', async () => {
      // Arrange
      const entryId = 10
      vi.mocked(repo.foodEntryGetAlternativeImage).mockResolvedValue(mockImage)

      // Act
      const result = await service.getAlternativeImage(entryId)

      // Assert
      expect(repo.foodEntryGetAlternativeImage).toHaveBeenCalledTimes(1)
      expect(repo.foodEntryGetAlternativeImage).toHaveBeenCalledWith(entryId, undefined)
      expect(result).toEqual(mockImage)
    })
  })

  describe('suggestAlternative', () => {
    it('suggestAlternative_ShouldDelegateToRepository_WhenCalled', async () => {
      // Arrange
      const entryId = 10
      const excludedNames = ['Burger']
      vi.mocked(repo.foodEntrySuggestAlternative).mockResolvedValue(mockSuggestion)

      // Act
      const result = await service.suggestAlternative(entryId, excludedNames)

      // Assert
      expect(repo.foodEntrySuggestAlternative).toHaveBeenCalledTimes(1)
      expect(repo.foodEntrySuggestAlternative).toHaveBeenCalledWith(entryId, excludedNames, undefined)
      expect(result).toEqual(mockSuggestion)
    })
  })
})
