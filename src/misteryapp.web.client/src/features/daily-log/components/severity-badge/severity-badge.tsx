interface SeverityBadgeProps {
  severity: string
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  if (severity === 'None') return null
  const cls =
    severity === 'High'
      ? 'bg-red-500/30 text-red-300'
      : 'bg-amber-500/30 text-amber-300'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {severity}
    </span>
  )
}
