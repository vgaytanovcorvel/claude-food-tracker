import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import { useWeeklyReport } from '../features/reports/state/use-weekly-report'
import type { DailyCalorieSummary } from '../domain/models'
import ComplianceArc from '../components/ComplianceArc'
import BottomNav from '../components/BottomNav'

function getMondayOfWeek(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1
  const monday = new Date(year, month - 1, day - dow)
  return toDateStr(monday)
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function offsetWeek(weekStart: string, weeks: number): string {
  const [year, month, day] = weekStart.split('-').map(Number)
  const d = new Date(year, month - 1, day + weeks * 7)
  return toDateStr(d)
}

function todayString(): string {
  return toDateStr(new Date())
}

function formatDateRange(start: string, end: string): string {
  const fmt = (s: string) => {
    const [y, mo, d] = s.split('-').map(Number)
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  const [y] = start.split('-')
  return `${fmt(start)} – ${fmt(end)}, ${y}`
}

const SHORT_DAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function CalorieBarChart({ summaries }: { summaries: DailyCalorieSummary[] }) {
  const maxCalories = Math.max(...summaries.map(s => s.totalCalories), 1)
  return (
    <div className="flex justify-between items-end gap-1" style={{ height: '112px' }}>
      {summaries.map((s, i) => {
        const heightPct = s.hasEntries ? Math.max((s.totalCalories / maxCalories) * 100, 6) : 0
        const barBackground = !s.hasEntries
          ? 'rgba(255,255,255,0.10)'
          : s.conflictCount > s.onGoalCount
            ? 'linear-gradient(to bottom, #fbbf24, #d97706)'
            : 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)'
        return (
          <div key={s.date} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
            <div
              style={{
                width: '24px',
                height: s.hasEntries ? `${heightPct}%` : '4px',
                background: barBackground,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1)',
                filter: s.hasEntries
                  ? s.conflictCount <= s.onGoalCount
                    ? 'drop-shadow(0 0 15px rgba(14,165,233,0.7))'
                    : 'drop-shadow(0 0 15px rgba(251,191,36,0.5))'
                  : 'none',
              }}
              title={s.hasEntries ? `${s.date}: ${s.totalCalories} kcal` : `${s.date}: no entries`}
            />
            <span className="text-glass-muted text-xs uppercase" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>
              {SHORT_DAY[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function WeeklyReportPage() {
  const { userId } = useIdentity()
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState<string>(() => getMondayOfWeek(todayString()))

  const { data: report, isLoading, isError } = useWeeklyReport(userId, weekStart)

  useEffect(() => {
    if (!userId) {
      navigate('/onboarding', { replace: true })
    }
  }, [userId, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center p-6 pb-28">
      <div className="glass-modal w-full max-w-lg px-8 py-10 flex flex-col justify-center gap-6" style={{ minHeight: '520px' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-display-md text-glass-text">Weekly Report</h1>
          <Link
            to="/reports/monthly"
            className="btn-ghost px-4 py-2 text-xs"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Monthly →
          </Link>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setWeekStart(w => offsetWeek(w, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-lg"
            aria-label="Previous week"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
          >
            ←
          </button>
          <span className="text-glass-text font-semibold text-sm">
            {report ? formatDateRange(report.weekStart, report.weekEnd) : '…'}
          </span>
          <button
            onClick={() => setWeekStart(w => offsetWeek(w, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-lg"
            aria-label="Next week"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
          >
            →
          </button>
        </div>

        {isError && <p className="text-red-400 text-sm">Failed to load report. Please try again.</p>}

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-28 rounded-2xl bg-white/10" />
            <div className="h-16 rounded-2xl bg-white/10" />
          </div>
        )}

        {!isLoading && report && (
          <>
            {/* Calorie bar chart */}
            <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-glass-muted text-xs uppercase tracking-widest" style={{ fontSize: '10px' }}>Daily Calories</p>
              <CalorieBarChart summaries={report.dailySummaries} />
            </div>

            {/* Summary row */}
            <div className="flex items-center gap-6 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <ComplianceArc rate={report.complianceRate} />
              <div className="space-y-1.5">
                <p className="text-glass-text font-semibold">{report.totalCalories} kcal total</p>
                <p className="text-glass-muted text-sm leading-relaxed">{report.motivatingCopy}</p>
              </div>
            </div>

            {/* Pattern insight */}
            {report.patternInsight && (
              <div className="rounded-2xl px-5 py-4 bg-amber-500/10" style={{ border: '1px solid rgba(245,158,11,0.25)' }}>
                <p className="text-amber-300 text-sm leading-relaxed">{report.patternInsight}</p>
              </div>
            )}

            {/* Empty state */}
            {!report.dailySummaries.some(d => d.hasEntries) && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.10)', border: '1px solid rgba(14,165,233,0.2)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" />
                  </svg>
                </div>
                <p className="text-glass-muted text-sm">No entries this week — start logging to see your trends.</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
