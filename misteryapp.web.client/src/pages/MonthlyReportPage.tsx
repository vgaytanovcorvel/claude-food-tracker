import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import { getMonthlyReport, type MonthlyReport, type DailyCalorieSummary } from '../api/reportApi'
import ComplianceArc from '../components/ComplianceArc'

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

function CalorieBarChart({ summaries }: { summaries: DailyCalorieSummary[] }) {
  const maxCalories = Math.max(...summaries.map(s => s.totalCalories), 1)
  return (
    <div className="flex items-end gap-px h-20">
      {summaries.map(s => {
        const heightPct = s.hasEntries ? Math.max((s.totalCalories / maxCalories) * 100, 5) : 0
        const barColor = !s.hasEntries
          ? 'bg-white/10'
          : s.conflictCount > s.onGoalCount
            ? 'bg-amber-500/60'
            : 'bg-brand-500/60'
        return (
          <div key={s.date} className="flex-1 flex flex-col justify-end">
            <div
              className={`w-full rounded-t-sm ${barColor}`}
              style={{ height: `${heightPct}%` }}
              title={s.hasEntries ? `${s.date}: ${s.totalCalories} kcal` : `${s.date}: no entries`}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function MonthlyReportPage() {
  const { userId } = useIdentity()
  const navigate = useNavigate()
  const [monthStart, setMonthStart] = useState<string>(currentMonthStart)
  const [report, setReport] = useState<MonthlyReport | null>(null)
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

    getMonthlyReport(Number(userId), monthStart, controller.signal)
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
  }, [userId, monthStart, navigate])

  return (
    <div className="flex min-h-screen items-start justify-center p-6">
      <div className="glass-surface-lg w-full max-w-lg p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-display-md text-glass-text">Monthly Report</h1>
          <Link to="/" className="text-sm text-brand-500 hover:underline">Home</Link>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setMonthStart(m => offsetMonth(m, -1))}
            className="text-brand-500 hover:underline text-sm px-2 py-1"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="text-glass-text font-semibold">{formatMonthYear(monthStart)}</span>
          <button
            onClick={() => setMonthStart(m => offsetMonth(m, 1))}
            className="text-brand-500 hover:underline text-sm px-2 py-1"
            aria-label="Next month"
          >
            →
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-lg bg-white/10" />
            <div className="h-16 rounded-lg bg-white/10" />
          </div>
        )}

        {!loading && report && (
          <>
            {/* Calorie bar chart */}
            <div className="border border-glass-border rounded-lg p-4 space-y-2">
              <p className="text-glass-muted text-xs uppercase tracking-wide">Daily Calories</p>
              <CalorieBarChart summaries={report.dailySummaries} />
              <p className="text-glass-muted text-xs">
                {report.dailySummaries.length} days — gap days shown in grey, no streak penalties
              </p>
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

            {!report.dailySummaries.some(d => d.hasEntries) && (
              <p className="text-glass-muted text-sm">
                Nothing logged this month — a blank slate is fine, start whenever you're ready.
              </p>
            )}
          </>
        )}

        <div className="flex gap-4 pt-2">
          <Link to="/reports/weekly" className="text-sm text-brand-500 hover:underline">
            Weekly view
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
