import type { WeeklyReport, MonthlyReport } from '../models'

export interface IReportService {
  getWeeklyReport(userId: number, weekStart: string, signal?: AbortSignal): Promise<WeeklyReport | null>
  getMonthlyReport(userId: number, monthStart: string, signal?: AbortSignal): Promise<MonthlyReport | null>
}
