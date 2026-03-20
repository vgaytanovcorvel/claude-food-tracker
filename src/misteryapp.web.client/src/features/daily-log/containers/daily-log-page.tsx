import { useState } from 'react'
import { useIdentity } from '../../../hooks/useIdentity'
import { useDailyEntries } from '../../food-log/state/use-daily-entries'
import { useDailySummary } from '../../food-log/state/use-daily-summary'
import { useDeleteFoodEntry } from '../../food-log/state/use-delete-food-entry'
import { WeekStrip } from '../components/week-strip/week-strip'
import { SummaryStrip } from '../components/summary-strip/summary-strip'
import { EntryList } from '../components/entry-list/entry-list'
import { BottomNav } from '../../../shared/components/bottom-nav/bottom-nav'

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

export function DailyLogPage() {
  const { userId } = useIdentity()
  const [date, setDate] = useState<string>(todayString())

  const { data: entries = [], isLoading: entriesLoading, isError: entriesError } = useDailyEntries(userId, date)
  const { data: summary, isLoading: summaryLoading } = useDailySummary(userId, date)
  const deleteFoodEntry = useDeleteFoodEntry(userId)

  const loading = entriesLoading || summaryLoading

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
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-lg border-default"
            aria-label="Previous day"
          >
            ←
          </button>
          <span className="text-glass-text font-semibold">{formatDate(date)}</span>
          <button
            onClick={() => setDate(d => offsetDate(d, 1))}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/8 transition-all duration-200 text-lg border-default"
            aria-label="Next day"
          >
            →
          </button>
        </div>

        {/* Week strip */}
        <WeekStrip date={date} onDateChange={setDate} />

        {/* Summary strip */}
        {!loading && summary && (
          <SummaryStrip totalCalories={summary.totalCalories} complianceLabel={summary.complianceLabel} />
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

        {/* Entry list */}
        {!loading && !entriesError && (
          <EntryList entries={entries} onDelete={handleDelete} />
        )}
      </div>

      <BottomNav />
    </div>
  )
}
