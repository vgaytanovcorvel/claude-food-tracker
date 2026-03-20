import type { IReportRepository } from '../domain/interfaces/i-report-repository'
import type { ApiResponse, WeeklyReport, MonthlyReport } from '../domain/models'

export class HttpReportRepository implements IReportRepository {
  async reportGetWeekly(userId: number, weekStart: string, signal?: AbortSignal): Promise<WeeklyReport | null> {
    try {
      const res = await fetch(`/api/reports/weekly?userId=${userId}&weekStart=${weekStart}`, { signal })
      if (!res.ok) return null
      const json: ApiResponse<WeeklyReport> = await res.json()
      return json.success && json.data ? json.data : null
    } catch {
      return null
    }
  }

  async reportGetMonthly(userId: number, monthStart: string, signal?: AbortSignal): Promise<MonthlyReport | null> {
    try {
      const res = await fetch(`/api/reports/monthly?userId=${userId}&monthStart=${monthStart}`, { signal })
      if (!res.ok) return null
      const json: ApiResponse<MonthlyReport> = await res.json()
      return json.success && json.data ? json.data : null
    } catch {
      return null
    }
  }
}
