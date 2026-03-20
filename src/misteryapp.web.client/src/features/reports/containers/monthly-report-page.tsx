import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useIdentity } from '../../../hooks/useIdentity'
import { useMonthlyReport } from '../state/use-monthly-report'
import { CalorieBarChart } from '../components/calorie-bar-chart/calorie-bar-chart'
import { ComplianceArc } from '../../../shared/components/compliance-arc/compliance-arc'
import { BottomNav } from '../../../shared/components/bottom-nav/bottom-nav'
import type { DailyCalorieSummary } from '../../../domain/models'

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function currentMonthStart(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

function offsetMonth(monthStart: string, months: number): string {
  const [year, month] = monthStart.split('-').map(Number)
  const d = new Date(year, month - 1 + months, 1)
  return toDateStr(d)
}

function formatMonthYear(monthStart: string): string {
  const [year, month] = monthStart.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function computeDayLabels(summaries: DailyCalorieSummary[]): (string | null)[] {
  return summaries.map(s => {
    const day = Number(s.date.split('-')[2])
    return day === 1 || day % 5 === 0 ? String(day) : null
  })
}

export function MonthlyReportPage() {
  const { userId } = useIdentity()
  const [monthStart, setMonthStart] = useState<string>(currentMonthStart)

  const { data: report, isLoading, isError } = useMonthlyReport(userId, monthStart)

  return (
    <div className="flex min-h-screen items-center justify-center p-6 pb-28">
      <div className="glass-modal w-full max-w-lg p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-display-md text-glass-text">Monthly Report</h1>
          <Link
            to="/reports/weekly"
            className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/8 text-alt border-default"
          >
            ← Weekly
          </Link>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setMonthStart(m => offsetMonth(m, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-lg border-default"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="text-glass-text font-semibold">{formatMonthYear(monthStart)}</span>
          <button
            onClick={() => setMonthStart(m => offsetMonth(m, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-lg border-default"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        {isError && <p className="text-red-400 text-sm">Failed to load report. Please try again.</p>}

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 rounded-2xl bg-white/10" />
            <div className="h-16 rounded-2xl bg-white/10" />
          </div>
        )}

        {!isLoading && report && (
          <>
            {/* Calorie bar chart */}
            <div className="rounded-2xl p-5 space-y-3 surface-card">
              <p className="text-glass-muted text-[10px] uppercase tracking-widest">Daily Calories</p>
              <CalorieBarChart
                summaries={report.dailySummaries}
                labels={computeDayLabels(report.dailySummaries)}
                chartHeight={88}
              />
              <p className="text-glass-muted text-xs">
                {report.dailySummaries.length} days — gap days shown in grey
              </p>
            </div>

            {/* Summary row */}
            <div className="flex items-center gap-6 rounded-2xl p-5 surface-card-raised">
              <ComplianceArc rate={report.complianceRate} />
              <div className="space-y-1.5">
                <p className="text-glass-text font-semibold">{report.totalCalories} kcal total</p>
                <p className="text-glass-muted text-sm leading-relaxed">{report.motivatingCopy}</p>
              </div>
            </div>

            {/* Pattern insight */}
            {report.patternInsight && (
              <div className="rounded-2xl px-5 py-4 insight-warn">
                <p className="text-sm leading-relaxed text-warn-insight">{report.patternInsight}</p>
              </div>
            )}

            {!report.dailySummaries.some(d => d.hasEntries) && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center icon-ring">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-stroke)" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <p className="text-glass-muted text-sm">Nothing logged this month — a blank slate is fine, start whenever you're ready.</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
