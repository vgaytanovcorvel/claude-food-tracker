import s from './summary-strip.module.css'

interface SummaryStripProps {
  totalCalories: number
  complianceLabel: string
}

export function SummaryStrip({ totalCalories, complianceLabel }: SummaryStripProps) {
  return (
    <div
      className={`rounded-2xl p-5 space-y-1.5 ${s.strip}`}
    >
      <p className="text-glass-text font-semibold text-base">
        {totalCalories} kcal total
      </p>
      <p className="text-glass-muted text-sm leading-relaxed">{complianceLabel}</p>
    </div>
  )
}
