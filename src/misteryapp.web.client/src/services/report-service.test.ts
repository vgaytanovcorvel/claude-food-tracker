import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReportService } from './report-service'
import type { IReportRepository } from '../domain/interfaces/i-report-repository'
import type { WeeklyReport, MonthlyReport } from '../domain/models'

const mockWeeklyReport: WeeklyReport = {
  weekStart: '2024-01-15',
  weekEnd: '2024-01-21',
  dailySummaries: [],
  totalCalories: 0,
  complianceRate: 0,
  patternInsight: null,
  motivatingCopy: 'Keep going!',
}

const mockMonthlyReport: MonthlyReport = {
  monthStart: '2024-01-01',
  monthEnd: '2024-01-31',
  dailySummaries: [],
  totalCalories: 0,
  complianceRate: 0,
  patternInsight: null,
  motivatingCopy: 'Great month!',
}

function makeMockRepo(): IReportRepository {
  return {
    reportGetWeekly: vi.fn(),
    reportGetMonthly: vi.fn(),
  }
}

describe('ReportService', () => {
  let repo: IReportRepository
  let service: ReportService

  beforeEach(() => {
    repo = makeMockRepo()
    service = new ReportService(repo)
  })

  describe('getWeeklyReport', () => {
    it('getWeeklyReport_ShouldDelegateToRepo_WhenCalled', async () => {
      // Arrange
      const userId = 1
      const weekStart = '2024-01-15'
      vi.mocked(repo.reportGetWeekly).mockResolvedValue(mockWeeklyReport)

      // Act
      const result = await service.getWeeklyReport(userId, weekStart)

      // Assert
      expect(repo.reportGetWeekly).toHaveBeenCalledTimes(1)
      expect(repo.reportGetWeekly).toHaveBeenCalledWith(userId, weekStart, undefined)
      expect(result).toEqual(mockWeeklyReport)
    })

    it('getWeeklyReport_ShouldPassSignal_WhenSignalProvided', async () => {
      // Arrange
      const userId = 1
      const weekStart = '2024-01-15'
      const controller = new AbortController()
      const signal = controller.signal
      vi.mocked(repo.reportGetWeekly).mockResolvedValue(mockWeeklyReport)

      // Act
      const result = await service.getWeeklyReport(userId, weekStart, signal)

      // Assert
      expect(repo.reportGetWeekly).toHaveBeenCalledTimes(1)
      expect(repo.reportGetWeekly).toHaveBeenCalledWith(userId, weekStart, signal)
      expect(result).toEqual(mockWeeklyReport)
    })

    it('getWeeklyReport_ShouldReturnNull_WhenRepoReturnsNull', async () => {
      // Arrange
      const userId = 1
      const weekStart = '2024-01-15'
      vi.mocked(repo.reportGetWeekly).mockResolvedValue(null)

      // Act
      const result = await service.getWeeklyReport(userId, weekStart)

      // Assert
      expect(repo.reportGetWeekly).toHaveBeenCalledTimes(1)
      expect(result).toBeNull()
    })
  })

  describe('getMonthlyReport', () => {
    it('getMonthlyReport_ShouldDelegateToRepo_WhenCalled', async () => {
      // Arrange
      const userId = 1
      const monthStart = '2024-01-01'
      vi.mocked(repo.reportGetMonthly).mockResolvedValue(mockMonthlyReport)

      // Act
      const result = await service.getMonthlyReport(userId, monthStart)

      // Assert
      expect(repo.reportGetMonthly).toHaveBeenCalledTimes(1)
      expect(repo.reportGetMonthly).toHaveBeenCalledWith(userId, monthStart, undefined)
      expect(result).toEqual(mockMonthlyReport)
    })

    it('getMonthlyReport_ShouldPassSignal_WhenSignalProvided', async () => {
      // Arrange
      const userId = 1
      const monthStart = '2024-01-01'
      const controller = new AbortController()
      const signal = controller.signal
      vi.mocked(repo.reportGetMonthly).mockResolvedValue(mockMonthlyReport)

      // Act
      const result = await service.getMonthlyReport(userId, monthStart, signal)

      // Assert
      expect(repo.reportGetMonthly).toHaveBeenCalledTimes(1)
      expect(repo.reportGetMonthly).toHaveBeenCalledWith(userId, monthStart, signal)
      expect(result).toEqual(mockMonthlyReport)
    })

    it('getMonthlyReport_ShouldReturnNull_WhenRepoReturnsNull', async () => {
      // Arrange
      const userId = 1
      const monthStart = '2024-01-01'
      vi.mocked(repo.reportGetMonthly).mockResolvedValue(null)

      // Act
      const result = await service.getMonthlyReport(userId, monthStart)

      // Assert
      expect(repo.reportGetMonthly).toHaveBeenCalledTimes(1)
      expect(result).toBeNull()
    })
  })
})
