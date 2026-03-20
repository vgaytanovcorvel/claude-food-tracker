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
  )
}
