import clsx from 'clsx'
import s from './week-strip.module.css'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

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

interface WeekStripProps {
  date: string
  onDateChange: (d: string) => void
}

export function WeekStrip({ date, onDateChange }: WeekStripProps) {
  const weekDays = getWeekDays(date)

  return (
    <div className="flex justify-between gap-1">
      {weekDays.map((day, i) => {
        const isSelected = day === date
        return (
          <button
            key={day}
            onClick={() => onDateChange(day)}
            className={clsx(s.dayBtn, isSelected && s.dayBtnSelected)}
            aria-label={day}
            aria-pressed={isSelected}
          >
            <span className={s.dayLabel}>{DAY_LABELS[i]}</span>
            <span className={clsx(s.dayNumber, isSelected ? s.dayNumberSelected : s.dayNumberNormal)}>
              {day.split('-')[2]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
