interface ComplianceArcProps {
  rate: number
}

export default function ComplianceArc({ rate }: ComplianceArcProps) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - rate)
  const percent = Math.round(rate * 100)
  const arcColor = rate >= 0.7 ? '#22c55e' : rate >= 0.5 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        {rate > 0 && (
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
          />
        )}
        <text x="36" y="41" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
          {percent}%
        </text>
      </svg>
      <span className="text-glass-muted text-xs">compliance</span>
    </div>
  )
}
