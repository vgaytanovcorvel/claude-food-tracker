import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import {
  getDailyEntries,
  getDailySummary,
  deleteFoodEntry,
  type FoodEntry,
  type DailyLogSummary,
} from '../api/foodLogApi'

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
  // Get Monday of the current week
  const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1 // 0=Mon...6=Sun
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
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [summary, setSummary] = useState<DailyLogSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!userId) {
      navigate('/onboarding', { replace: true })
      return
    }
    const numericUserId = Number(userId)
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    Promise.all([
      getDailyEntries(numericUserId, date, controller.signal),
      getDailySummary(numericUserId, date, controller.signal),
    ])
      .then(([fetchedEntries, fetchedSummary]) => {
        if (controller.signal.aborted) return
        setEntries(fetchedEntries)
        setSummary(fetchedSummary)
        setLoading(false)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setError('Failed to load entries. Please try again.')
        setLoading(false)
      })

    return () => controller.abort()
  }, [userId, date, navigate])

  async function handleDelete(id: number) {
    await deleteFoodEntry(id)
    const numericUserId = Number(userId)
    const updatedEntries = entries.filter(e => e.id !== id)
    setEntries(updatedEntries)
    const freshSummary = await getDailySummary(numericUserId, date)
    setSummary(freshSummary)
  }

  return (
    <div className="flex min-h-screen items-start justify-center p-6">
      <div className="glass-surface-lg w-full max-w-lg p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-display-md text-glass-text">Daily Log</h1>
          <Link to="/" className="text-sm text-brand-500 hover:underline">
            Home
          </Link>
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setDate(d => offsetDate(d, -1))}
            className="text-brand-500 hover:underline text-sm px-2 py-1"
            aria-label="Previous day"
          >
            ←
          </button>
          <span className="text-glass-text font-semibold">{formatDate(date)}</span>
          <button
            onClick={() => setDate(d => offsetDate(d, 1))}
            className="text-brand-500 hover:underline text-sm px-2 py-1"
            aria-label="Next day"
          >
            →
          </button>
        </div>

        {/* Week strip — neutral, no streak markers */}
        <div className="flex justify-between gap-1">
          {getWeekDays(date).map((day, i) => {
            const isSelected = day === date
            return (
              <button
                key={day}
                onClick={() => setDate(day)}
                className={`flex flex-col items-center flex-1 py-1.5 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? 'bg-brand-500/30 text-brand-400 font-semibold'
                    : 'text-glass-muted hover:bg-white/5'
                }`}
                aria-label={day}
                aria-pressed={isSelected}
              >
                <span>{DAY_LABELS[i]}</span>
                <span>{day.split('-')[2]}</span>
              </button>
            )
          })}
        </div>

        {/* Summary strip */}
        {!loading && summary && (
          <div className="border border-glass-border rounded-lg p-4 space-y-1">
            <p className="text-glass-text font-semibold">
              {summary.totalCalories} kcal total
            </p>
            <p className="text-glass-muted text-sm">{summary.complianceLabel}</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 rounded-lg bg-white/10" />
            ))}
          </div>
        )}

        {/* Entry list */}
        {!loading && !error && entries.length === 0 && (
          <p className="text-glass-muted text-sm">
            Nothing logged yet — tap &lsquo;Log food&rsquo; to add your first meal today.
          </p>
        )}

        {!loading && !error && entries.length > 0 && (
          <ul className="space-y-3">
            {entries.map(entry => {
              const analysis = parseAnalysis(entry.analysisResult)
              const showBadge =
                analysis !== null && !analysis.compatible && analysis.severity !== 'None'
              return (
                <li
                  key={entry.id}
                  className="flex items-center justify-between border border-glass-border rounded-lg px-4 py-3 gap-3"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-glass-text font-medium truncate">
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
                      className="text-glass-muted hover:text-red-400 text-xs"
                      aria-label={`Delete ${entry.foodName}`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* Log food CTA */}
        <Link
          to="/food-log"
          className="inline-block text-brand-500 hover:underline text-sm"
        >
          Log food
        </Link>
      </div>
    </div>
  )
}
