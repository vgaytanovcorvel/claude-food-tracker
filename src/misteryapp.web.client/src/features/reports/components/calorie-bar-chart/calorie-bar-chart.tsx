import clsx from 'clsx'
import type { DailyCalorieSummary } from '../../../../domain/models'
import s from './calorie-bar-chart.module.css'

interface CalorieBarChartProps {
  summaries: DailyCalorieSummary[]
  labels?: (string | null)[]
  chartHeight?: number
}

function barClass(summary: DailyCalorieSummary): string {
  if (!summary.hasEntries) return s.barEmpty
  return summary.conflictCount > summary.onGoalCount ? s.barWarn : s.barOk
}

export function CalorieBarChart({ summaries, labels, chartHeight = 112 }: CalorieBarChartProps) {
  const maxCalories = Math.max(...summaries.map(s => s.totalCalories), 1)

  return (
    <div className={s.chart} style={{ height: `${chartHeight}px` }}>
      {summaries.map((summary, i) => {
        const heightPct = summary.hasEntries ? Math.max((summary.totalCalories / maxCalories) * 100, 6) : 0
        return (
          <div key={summary.date} className={s.barCol}>
            <div
              className={clsx(s.bar, barClass(summary))}
              style={{
                height: summary.hasEntries ? `${heightPct}%` : '4px',
              }}
              title={summary.hasEntries ? `${summary.date}: ${summary.totalCalories} kcal` : `${summary.date}: no entries`}
            />
            {labels && (
              <span className={s.barLabel}>{labels[i] ?? ''}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
