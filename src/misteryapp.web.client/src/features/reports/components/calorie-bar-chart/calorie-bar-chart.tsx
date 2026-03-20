import type { DailyCalorieSummary } from '../../../../domain/models'

interface CalorieBarChartProps {
  summaries: DailyCalorieSummary[]
  labels?: (string | null)[]
  chartHeight?: number
}

function barBackground(s: DailyCalorieSummary): string {
  if (!s.hasEntries) return 'rgba(255,255,255,0.10)'
  if (s.conflictCount > s.onGoalCount) return 'linear-gradient(to bottom, #fbbf24, #d97706)'
  return 'linear-gradient(180deg, #38bdf8 0%, #0ea5e9 100%)'
}

function barFilter(s: DailyCalorieSummary): string {
  if (!s.hasEntries) return 'none'
  if (s.conflictCount <= s.onGoalCount) return 'drop-shadow(0 0 15px rgba(14,165,233,0.7))'
  return 'drop-shadow(0 0 15px rgba(251,191,36,0.5))'
}

export function CalorieBarChart({ summaries, labels, chartHeight = 112 }: CalorieBarChartProps) {
  const maxCalories = Math.max(...summaries.map(s => s.totalCalories), 1)

  return (
    <div className="flex justify-between items-end gap-1" style={{ height: `${chartHeight}px` }}>
      {summaries.map((s, i) => {
        const heightPct = s.hasEntries ? Math.max((s.totalCalories / maxCalories) * 100, 6) : 0
        return (
          <div key={s.date} className="flex-1 flex flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
            <div
              style={{
                width: '100%',
                height: s.hasEntries ? `${heightPct}%` : '4px',
                background: barBackground(s),
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1)',
                filter: barFilter(s),
              }}
              title={s.hasEntries ? `${s.date}: ${s.totalCalories} kcal` : `${s.date}: no entries`}
            />
            {labels && (
              <span className="text-glass-muted text-xs uppercase" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>
                {labels[i] ?? ''}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
