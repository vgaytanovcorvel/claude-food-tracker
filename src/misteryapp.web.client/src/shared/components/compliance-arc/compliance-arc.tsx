import s from './compliance-arc.module.css'

interface ComplianceArcProps {
  rate: number
}

export function ComplianceArc({ rate }: ComplianceArcProps) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - rate)
  const percent = Math.round(rate * 100)

  // Gradient stop colors and glow per compliance tier — using CSS var references
  const gradStart = rate >= 0.7 ? 'var(--green-300)' : rate >= 0.5 ? 'var(--amber-300)' : 'var(--red-300)'
  const gradEnd   = rate >= 0.7 ? 'var(--green-400)' : rate >= 0.5 ? 'var(--amber-500)' : 'var(--red-400)'
  const glowColor = rate >= 0.7 ? 'var(--compliance-glow-ok)' : rate >= 0.5 ? 'var(--compliance-glow-warn)' : 'var(--compliance-glow-low)'
  const gradId = 'arcGrad'

  return (
    <div className={s.root}>
      {/*
        overflow="visible" is critical — it lets the CSS drop-shadow bleed
        outside the 72x72 viewport so the glow stays circular, not square-clipped.
        No SVG filter here; we use only CSS filter on the circle itself.
      */}
      <svg width="72" height="72" viewBox="0 0 72 72" overflow="visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle cx="36" cy="36" r={radius} fill="none" stroke="var(--ring-track)" strokeWidth="7" />

        {/* Arc — glow via CSS filter directly on this element */}
        {rate > 0 && (
          <circle
            cx="36" cy="36" r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
            style={{
              filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 20px ${glowColor})`,
            }}
          />
        )}

        {/* Percent label */}
        <text
          x="36" y="41"
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
        >
          {percent}%
        </text>
      </svg>
      <span className={s.caption}>compliance</span>
    </div>
  )
}
