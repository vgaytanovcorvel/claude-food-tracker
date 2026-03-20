import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import { HttpReportRepository } from './http-report-repository'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const repo = new HttpReportRepository()

const expectedWeeklyReport = {
  weekStart: '2024-01-15',
  weekEnd: '2024-01-21',
  dailySummaries: [],
  totalCalories: 0,
  complianceRate: 0,
  patternInsight: null,
  motivatingCopy: 'Keep going!',
}

const expectedMonthlyReport = {
  monthStart: '2024-01-01',
  monthEnd: '2024-01-31',
  dailySummaries: [],
  totalCalories: 0,
  complianceRate: 0,
  patternInsight: null,
  motivatingCopy: 'Great month!',
}

describe('HttpReportRepository', () => {
  describe('reportGetWeekly', () => {
    it('reportGetWeekly_ShouldReturnWeeklyReport_WhenApiReturnsSuccess', async () => {
      // Arrange
      const userId = 1
      const weekStart = '2024-01-15'

      // Act
      const result = await repo.reportGetWeekly(userId, weekStart)

      // Assert
      expect(result).toEqual(expectedWeeklyReport)
    })

    it('reportGetWeekly_ShouldReturnNull_WhenApiReturnsError', async () => {
      // Arrange
      server.use(
        http.get('/api/reports/weekly', () => new HttpResponse(null, { status: 500 }))
      )

      // Act
      const result = await repo.reportGetWeekly(1, '2024-01-15')

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('reportGetMonthly', () => {
    it('reportGetMonthly_ShouldReturnMonthlyReport_WhenApiReturnsSuccess', async () => {
      // Arrange
      const userId = 1
      const monthStart = '2024-01-01'

      // Act
      const result = await repo.reportGetMonthly(userId, monthStart)

      // Assert
      expect(result).toEqual(expectedMonthlyReport)
    })

    it('reportGetMonthly_ShouldReturnNull_WhenApiReturnsError', async () => {
      // Arrange
      server.use(
        http.get('/api/reports/monthly', () => new HttpResponse(null, { status: 500 }))
      )

      // Act
      const result = await repo.reportGetMonthly(1, '2024-01-01')

      // Assert
      expect(result).toBeNull()
    })
  })
})
