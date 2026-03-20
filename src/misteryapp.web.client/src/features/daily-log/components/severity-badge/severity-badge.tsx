import clsx from 'clsx'
import s from './severity-badge.module.css'

interface SeverityBadgeProps {
  severity: string
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  if (severity === 'None') return null
  return (
    <span className={clsx(s.badge, severity === 'High' ? s.high : s.warn)}>
      {severity}
    </span>
  )
}
