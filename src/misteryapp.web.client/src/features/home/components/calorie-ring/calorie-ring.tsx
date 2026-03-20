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
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cx})`}
          filter="url(#ringGlow)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)', filter: 'drop-shadow(0 0 8px #22d3ee) drop-shadow(0 0 4px #06b6d4)' }}
        />
        {/* Calories */}
        <text x={cx} y={cx - 8} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="32" fontWeight="800" fontFamily="Inter, sans-serif"
          style={{ filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.65))' }}>
          {calories}
        </text>
        <text x={cx} y={cx + 14} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Inter, sans-serif" letterSpacing="0.06em">
          / {CALORIE_TARGET} kcal
        </text>
      </svg>
      <p className="text-xs text-white/35 uppercase" style={{ letterSpacing: '0.22em' }}>Today's Calories</p>
    </div>
  )
}
