import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '../mocks/server'
import { HttpFoodLogRepository } from './http-food-log-repository'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const repo = new HttpFoodLogRepository()

const expectedEntry = {
  id: 10,
  userId: 1,
  foodName: 'Grilled Chicken',
  estimatedCalories: 350,
  loggedAt: '2024-01-15T12:00:00Z',
  source: 'Manual',
  analysisResult: null,
  imageBase64: null,
}

describe('HttpFoodLogRepository', () => {
  describe('foodEntryCreate', () => {
    it('foodEntryCreate_ShouldReturnEntry_WhenApiReturnsSuccess', async () => {
      // Arrange
      const userId = 1
      const foodName = 'Grilled Chicken'
      const estimatedCalories = 350
      const source = 'Manual' as const

      // Act
      const result = await repo.foodEntryCreate(userId, foodName, estimatedCalories, source, null)

      // Assert
      expect(result).toEqual(expectedEntry)
    })
  })

  describe('foodEntryGetByUserAndDate', () => {
    it('foodEntryGetByUserAndDate_ShouldReturnEntries_WhenApiReturnsSuccess', async () => {
      // Arrange
      const userId = 1
      const date = '2024-01-15'

      // Act
      const result = await repo.foodEntryGetByUserAndDate(userId, date)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(expectedEntry)
    })
  })

  describe('foodEntryGetDailySummary', () => {
    it('foodEntrySummary_ShouldReturnSummary_WhenApiReturnsSuccess', async () => {
      // Arrange
      const userId = 1
      const date = '2024-01-15'

      // Act
      const result = await repo.foodEntryGetDailySummary(userId, date)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.date).toBe('2024-01-15')
      expect(result!.totalCalories).toBe(350)
    })
  })

  describe('foodEntryDelete', () => {
    it('foodEntryDelete_ShouldCompleteWithoutError_WhenApiReturnsSuccess', async () => {
      // Arrange
      const entryId = 10

      // Act
      const act = () => repo.foodEntryDelete(entryId)

      // Assert
      await expect(act()).resolves.toBeUndefined()
    })
  })

  describe('foodIdentify', () => {
    it('foodEntryAnalyse_ShouldReturnAnalysisResult_WhenApiReturnsSuccess', async () => {
      // Arrange
      const file = new File(['fake-image-bytes'], 'photo.jpg', { type: 'image/jpeg' })
      const userId = 1

      // Act
      const result = await repo.foodIdentify(file, userId)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.foodName).toBe('Grilled Chicken')
      expect(result!.estimatedCalories).toBe(350)
      expect(result!.confidenceLevel).toBe(0.92)
    })
  })

  describe('foodEntryAnalysePreview', () => {
    it('foodEntryAnalysePreview_ShouldReturnPreviewResult_WhenApiReturnsSuccess', async () => {
      // Arrange
      const foodName = 'Grilled Chicken'
      const userId = 1

      // Act
      const result = await repo.foodEntryAnalysePreview(foodName, userId)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.compatible).toBe(true)
      expect(result!.severity).toBe('None')
    })
  })

  describe('foodEntryAnalyse', () => {
    it('foodEntryAnalyse_ShouldReturnAnalysis_WhenApiReturnsSuccess', async () => {
      // Arrange
      const entryId = 10

      // Act
      const result = await repo.foodEntryAnalyse(entryId)

      // Assert
      expect(result).not.toBeNull()
      expect(result!.compatible).toBe(true)
      expect(result!.severity).toBe('None')
      expect(result!.educationText).toBe('Great choice for your diet.')
    })
  })
})
