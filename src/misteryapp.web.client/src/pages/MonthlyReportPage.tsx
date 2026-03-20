import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import { useMonthlyReport } from '../features/reports/state/use-monthly-report'
import type { DailyCalorieSummary } from '../domain/models'
import ComplianceArc from '../components/ComplianceArc'
import BottomNav from '../components/BottomNav'

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
    <div className="space-y-1">
      <div className="flex items-end gap-px" style={{ height: '88px' }}>
        {summaries.map(s => {
          const heightPct = s.hasEntries ? Math.max((s.totalCalories / maxCalories) * 100, 5) : 0
          const barBackground = !s.hasEntries
            ? 'rgba(255,255,255,0.08)'
            : s.conflictCount > s.onGoalCount
              ? 'linear-gradient(to bottom, #fbbf24, #d97706)'
              : 'linear-gradient(to bottom, #7dd3fc, #0284c7)'
          return (
            <div key={s.date} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
              <div
                style={{
                  width: '100%',
                  height: s.hasEntries ? `${heightPct}%` : '3px',
                  background: barBackground,
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.5s ease',
                }}
                title={s.hasEntries ? `${s.date}: ${s.totalCalories} kcal` : `${s.date}: no entries`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-px">
        {summaries.map(s => {
          const day = Number(s.date.split('-')[2])
          const showLabel = day === 1 || day % 5 === 0
          return (
            <div key={s.date} className="flex-1 text-center">
              <span className="text-glass-muted" style={{ fontSize: '9px' }}>
                {showLabel ? day : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function MonthlyReportPage() {
  const { userId } = useIdentity()
  const navigate = useNavigate()
  const [monthStart, setMonthStart] = useState<string>(currentMonthStart)

  const { data: report, isLoading, isError } = useMonthlyReport(userId, monthStart)

  useEffect(() => {
    if (!userId) {
      navigate('/onboarding', { replace: true })
    }
  }, [userId, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center p-6 pb-28">
      <div className="glass-modal w-full max-w-lg p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-display-md text-glass-text">Monthly Report</h1>
          <Link
            to="/reports/weekly"
            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:bg-white/8"
            style={{ color: 'rgba(56,189,248,0.8)', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            ← Weekly
          </Link>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setMonthStart(m => offsetMonth(m, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-lg"
            aria-label="Previous month"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
          >
            ←
          </button>
          <span className="text-glass-text font-semibold">{formatMonthYear(monthStart)}</span>
          <button
            onClick={() => setMonthStart(m => offsetMonth(m, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-lg"
            aria-label="Next month"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
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
            <div className="rounded-2xl p-5 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-glass-muted text-xs uppercase tracking-widest" style={{ fontSize: '10px' }}>Daily Calories</p>
              <CalorieBarChart summaries={report.dailySummaries} />
              <p className="text-glass-muted text-xs">
                {report.dailySummaries.length} days — gap days shown in grey
              </p>
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

            {!report.dailySummaries.some(d => d.hasEntries) && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.10)', border: '1px solid rgba(14,165,233,0.2)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" strokeLinecap="round">
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
