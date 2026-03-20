import type { WeeklyReport, MonthlyReport } from '../models'

export interface IReportRepository {
  reportGetWeekly(userId: number, weekStart: string, signal?: AbortSignal): Promise<WeeklyReport | null>
  reportGetMonthly(userId: number, monthStart: string, signal?: AbortSignal): Promise<MonthlyReport | null>
}
