import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import { useDailyEntries } from '../features/food-log/state/use-daily-entries'
import { useDailySummary } from '../features/food-log/state/use-daily-summary'
import { useDeleteFoodEntry } from '../features/food-log/state/use-delete-food-entry'

import BottomNav from '../components/BottomNav'

function formatDate(d: string): string {
  const [year, month, day] = d.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function offsetDate(d: string, days: number): string {
  const [year, month, day] = d.split('-').map(Number)
  const date = new Date(year, month - 1, day + days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function todayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekDays(dateStr: string): string[] {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1
  const monday = new Date(year, month - 1, day - dayOfWeek)
  return Array.from({ length: 7 }, (_, i) => {
    const curr = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const y = curr.getFullYear()
    const m = String(curr.getMonth() + 1).padStart(2, '0')
    const dd = String(curr.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  })
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function parseAnalysis(json: string | null): { compatible: boolean; severity: string } | null {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'None') return null
  const cls =
    severity === 'High'
      ? 'bg-red-500/30 text-red-300'
      : 'bg-amber-500/30 text-amber-300'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {severity}
    </span>
  )
}


export default function DailyLogPage() {
  const { userId } = useIdentity()
  const navigate = useNavigate()
  const [date, setDate] = useState<string>(todayString())

  const { data: entries = [], isLoading: entriesLoading, isError: entriesError } = useDailyEntries(userId, date)
  const { data: summary, isLoading: summaryLoading } = useDailySummary(userId, date)
  const deleteFoodEntry = useDeleteFoodEntry(userId)

  const loading = entriesLoading || summaryLoading

  useEffect(() => {
    if (!userId) {
      navigate('/onboarding', { replace: true })
    }
  }, [userId, navigate])

  async function handleDelete(id: number) {
    await deleteFoodEntry.mutateAsync(id)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 pb-28">
      <div className="glass-modal w-full max-w-lg p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-display-md text-glass-text">Daily Log</h1>
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setDate(d => offsetDate(d, -1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-lg"
            aria-label="Previous day"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
          >
            ←
          </button>
          <span className="text-glass-text font-semibold">{formatDate(date)}</span>
          <button
            onClick={() => setDate(d => offsetDate(d, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-lg"
            aria-label="Next day"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
          >
            →
          </button>
        </div>

        {/* Week strip — glowing pill active day */}
        <div className="flex justify-between gap-1">
          {getWeekDays(date).map((day, i) => {
            const isSelected = day === date
            return (
              <button
                key={day}
                onClick={() => setDate(day)}
                className="flex flex-col items-center flex-1 py-2 rounded-2xl text-xs transition-all duration-200"
                style={
                  isSelected
                    ? {
                        background: 'linear-gradient(to bottom, #38bdf8, #0284c7)',
                        boxShadow: '0 0 14px rgba(14,165,233,0.55), 0 4px 10px rgba(14,165,233,0.3)',
                        color: 'white',
                      }
                    : {
                        color: 'rgba(255,255,255,0.38)',
                        background: 'transparent',
                      }
                }
                aria-label={day}
                aria-pressed={isSelected}
              >
                <span className="font-semibold uppercase tracking-widest" style={{ fontSize: '9px' }}>
                  {DAY_LABELS[i]}
                </span>
                <span className={`mt-0.5 font-${isSelected ? 'bold' : 'normal'} text-sm`}>
                  {day.split('-')[2]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Summary strip */}
        {!loading && summary && (
          <div className="rounded-2xl p-5 space-y-1.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-glass-text font-semibold text-base">
              {summary.totalCalories} kcal total
            </p>
            <p className="text-glass-muted text-sm leading-relaxed">{summary.complianceLabel}</p>
          </div>
        )}

        {/* Error state */}
        {entriesError && (
          <p className="text-red-400 text-sm">Failed to load entries. Please try again.</p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-2xl bg-white/10" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !entriesError && entries.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(56,189,248,0.7)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <p className="text-glass-text font-medium text-sm">Nothing logged yet</p>
              <p className="text-glass-muted text-xs mt-1">Tap Log to add your first meal today.</p>
            </div>
            <Link
              to="/food-log"
              className="px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:brightness-110"
              style={{ background: 'linear-gradient(to bottom, #38bdf8, #0284c7)', boxShadow: '0 6px 16px -3px rgba(14,165,233,0.45)' }}
            >
              Log Food
            </Link>
          </div>
        )}

        {/* Entry list */}
        {!loading && !entriesError && entries.length > 0 && (
          <ul className="space-y-3">
            {entries.map(entry => {
              const analysis = parseAnalysis(entry.analysisResult)
              const showBadge =
                analysis !== null && !analysis.compatible && analysis.severity !== 'None'
              return (
                <li
                  key={entry.id}
                  className="flex items-center rounded-2xl overflow-hidden gap-0"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {entry.imageBase64 && (
                    <img
                      src={`data:image/jpeg;base64,${entry.imageBase64}`}
                      alt={entry.foodName}
                      className="w-16 h-16 object-cover shrink-0"
                    />
                  )}
                  <div className="flex items-center justify-between flex-1 px-4 py-4 gap-3 min-w-0">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span className="text-glass-text font-medium truncate leading-snug">
                        {entry.foodName}
                      </span>
                      <span className="text-glass-muted text-xs">
                        {entry.estimatedCalories} kcal
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {showBadge && <SeverityBadge severity={analysis!.severity} />}
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-white/25 hover:text-red-400 text-xs transition-colors duration-200"
                        aria-label={`Delete ${entry.foodName}`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Log food CTA (when entries exist) */}
        {!loading && !entriesError && entries.length > 0 && (
          <Link
            to="/food-log"
            className="inline-block text-sm font-medium transition-colors duration-200"
            style={{ color: 'rgba(56,189,248,0.8)' }}
          >
            + Log another meal
          </Link>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
