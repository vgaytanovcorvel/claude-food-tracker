interface ComplianceArcProps {
  rate: number
}

export function ComplianceArc({ rate }: ComplianceArcProps) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - rate)
  const percent = Math.round(rate * 100)

  // Gradient stop colors and glow per compliance tier
  const gradStart = rate >= 0.7 ? '#a7f3d0' : rate >= 0.5 ? '#fde68a' : '#fca5a5'
  const gradEnd   = rate >= 0.7 ? '#4ade80' : rate >= 0.5 ? '#f59e0b' : '#f87171'
  const glowRgba  = rate >= 0.7
    ? 'rgba(74,222,128,0.55)'
    : rate >= 0.5
      ? 'rgba(245,158,11,0.55)'
      : 'rgba(248,113,113,0.55)'
  const gradId = 'arcGrad'

  return (
    <div className="flex flex-col items-center gap-1">
      {/*
        overflow="visible" is critical — it lets the CSS drop-shadow bleed
        outside the 72×72 viewport so the glow stays circular, not square-clipped.
        No SVG <filter> here; we use only CSS filter on the <circle> itself.
      */}
      <svg width="72" height="72" viewBox="0 0 72 72" overflow="visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />

        {/* Arc — glow via CSS filter directly on this element, not on any wrapper */}
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
              filter: `drop-shadow(0 0 8px ${glowRgba}) drop-shadow(0 0 20px ${glowRgba})`,
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
      <span className="text-glass-muted text-xs">compliance</span>
    </div>
  )
}
