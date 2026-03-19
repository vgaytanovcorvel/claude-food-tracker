import type { ApiResponse } from './types'

export interface DailyCalorieSummary {
  date: string
  totalCalories: number
  onGoalCount: number
  conflictCount: number
  hasEntries: boolean
}

export interface WeeklyReport {
  weekStart: string
  weekEnd: string
  dailySummaries: DailyCalorieSummary[]
  totalCalories: number
  complianceRate: number
  patternInsight: string | null
  motivatingCopy: string
}

export interface MonthlyReport {
  monthStart: string
  monthEnd: string
  dailySummaries: DailyCalorieSummary[]
  totalCalories: number
  complianceRate: number
  patternInsight: string | null
  motivatingCopy: string
}

export async function getWeeklyReport(
  userId: number,
  weekStart: string,
  signal?: AbortSignal
): Promise<WeeklyReport | null> {
  try {
    const res = await fetch(`/api/reports/weekly?userId=${userId}&weekStart=${weekStart}`, { signal })
    if (!res.ok) return null
    const json: ApiResponse<WeeklyReport> = await res.json()
    return json.success && json.data ? json.data : null
  } catch {
    return null
  }
}

export async function getMonthlyReport(
  userId: number,
  monthStart: string,
  signal?: AbortSignal
): Promise<MonthlyReport | null> {
  try {
    const res = await fetch(`/api/reports/monthly?userId=${userId}&monthStart=${monthStart}`, { signal })
    if (!res.ok) return null
    const json: ApiResponse<MonthlyReport> = await res.json()
    return json.success && json.data ? json.data : null
  } catch {
    return null
  }
}
