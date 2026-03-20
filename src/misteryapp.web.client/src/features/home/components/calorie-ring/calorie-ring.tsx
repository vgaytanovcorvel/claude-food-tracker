import s from './calorie-ring.module.css'

const CALORIE_TARGET = 2000

interface CalorieRingProps {
  calories: number
}

export function CalorieRing({ calories }: CalorieRingProps) {
  const r = 52
  const size = 140
  const cx = size / 2
  const circumference = 2 * Math.PI * r
  const progress = Math.min(calories / CALORIE_TARGET, 1)
  const offset = circumference * (1 - progress)

  return (
    <div className={s.root}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--ring-grad-from)" />
            <stop offset="100%" stopColor="var(--ring-grad-to)" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--ring-track)" strokeWidth="9" />
        {/* Progress arc — strokeDashoffset is data-driven; transition + filter moved to CSS module */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cx})`}
          className={s.progressArc}
        />
        {/* Calories */}
        <text x={cx} y={cx - 8} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="32" fontWeight="800" fontFamily="Inter, sans-serif"
          className={s.calorieLabelGlow}>
          {calories}
        </text>
        <text x={cx} y={cx + 14} textAnchor="middle" dominantBaseline="central" fill="var(--color-text-faint)" fontSize="11" fontFamily="Inter, sans-serif" letterSpacing="0.06em">
          / {CALORIE_TARGET} kcal
        </text>
      </svg>
      <p className={s.caption}>Today's Calories</p>
    </div>
  )
}
