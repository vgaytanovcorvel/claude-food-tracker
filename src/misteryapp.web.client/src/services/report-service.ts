import type { IReportService } from '../domain/interfaces/i-report-service'
import type { IReportRepository } from '../domain/interfaces/i-report-repository'
import type { WeeklyReport, MonthlyReport } from '../domain/models'

export class ReportService implements IReportService {
  constructor(private readonly repo: IReportRepository) {}

  getWeeklyReport(userId: number, weekStart: string, signal?: AbortSignal): Promise<WeeklyReport | null> {
    return this.repo.reportGetWeekly(userId, weekStart, signal)
  }

  getMonthlyReport(userId: number, monthStart: string, signal?: AbortSignal): Promise<MonthlyReport | null> {
    return this.repo.reportGetMonthly(userId, monthStart, signal)
  }
}
