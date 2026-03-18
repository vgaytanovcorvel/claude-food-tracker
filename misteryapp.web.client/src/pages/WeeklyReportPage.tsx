import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import { getWeeklyReport, type WeeklyReport, type DailyCalorieSummary } from '../api/reportApi'
import ComplianceArc from '../components/ComplianceArc'

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
    <div className="flex items-end gap-1 h-24">
      {summaries.map((s, i) => {
        const heightPct = s.hasEntries ? Math.max((s.totalCalories / maxCalories) * 100, 6) : 0
        const barColor = !s.hasEntries
          ? 'bg-white/10'
          : s.conflictCount > s.onGoalCount
            ? 'bg-amber-500/60'
            : 'bg-brand-500/60'
        return (
          <div key={s.date} className="flex-1 flex flex-col items-center justify-end gap-0.5">
            <div
              className={`w-full rounded-t-sm transition-all ${barColor}`}
              style={{ height: `${heightPct}%` }}
              title={s.hasEntries ? `${s.date}: ${s.totalCalories} kcal` : `${s.date}: no entries`}
            />
            <span className="text-glass-muted text-xs">{SHORT_DAY[i]}</span>
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
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!userId) {
      navigate('/onboarding', { replace: true })
      return
    }
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)

    getWeeklyReport(Number(userId), weekStart, controller.signal)
      .then(r => {
        if (controller.signal.aborted) return
        setReport(r)
        setLoading(false)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setError('Failed to load report. Please try again.')
        setLoading(false)
      })

    return () => controller.abort()
  }, [userId, weekStart, navigate])

  return (
    <div className="flex min-h-screen items-start justify-center p-6">
      <div className="glass-surface-lg w-full max-w-lg p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-display-md text-glass-text">Weekly Report</h1>
          <Link to="/" className="text-sm text-brand-500 hover:underline">Home</Link>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setWeekStart(w => offsetWeek(w, -1))}
            className="text-brand-500 hover:underline text-sm px-2 py-1"
            aria-label="Previous week"
          >
            ←
          </button>
          <span className="text-glass-text font-semibold text-sm">
            {report ? formatDateRange(report.weekStart, report.weekEnd) : '…'}
          </span>
          <button
            onClick={() => setWeekStart(w => offsetWeek(w, 1))}
            className="text-brand-500 hover:underline text-sm px-2 py-1"
            aria-label="Next week"
          >
            →
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-24 rounded-lg bg-white/10" />
            <div className="h-16 rounded-lg bg-white/10" />
          </div>
        )}

        {!loading && report && (
          <>
            {/* Calorie bar chart */}
            <div className="border border-glass-border rounded-lg p-4 space-y-2">
              <p className="text-glass-muted text-xs uppercase tracking-wide">Daily Calories</p>
              <CalorieBarChart summaries={report.dailySummaries} />
            </div>

            {/* Summary row */}
            <div className="flex items-center gap-6">
              <ComplianceArc rate={report.complianceRate} />
              <div className="space-y-1">
                <p className="text-glass-text font-semibold">{report.totalCalories} kcal total</p>
                <p className="text-glass-muted text-sm">{report.motivatingCopy}</p>
              </div>
            </div>

            {/* Pattern insight */}
            {report.patternInsight && (
              <div className="border border-amber-500/30 rounded-lg px-4 py-3 bg-amber-500/10">
                <p className="text-amber-300 text-sm">{report.patternInsight}</p>
              </div>
            )}

            {/* Empty state */}
            {!report.dailySummaries.some(d => d.hasEntries) && (
              <p className="text-glass-muted text-sm">
                No entries this week — tap &lsquo;Log food&rsquo; to start tracking.
              </p>
            )}
          </>
        )}

        <div className="flex gap-4 pt-2">
          <Link to="/reports/monthly" className="text-sm text-brand-500 hover:underline">
            Monthly view
          </Link>
          <Link to="/daily-log" className="text-sm text-brand-500 hover:underline">
            Daily log
          </Link>
          <Link to="/bookmarks" className="text-sm text-brand-500 hover:underline">
            Bookmarks
          </Link>
        </div>
      </div>
    </div>
  )
}
