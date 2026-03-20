interface SummaryStripProps {
  totalCalories: number
  complianceLabel: string
}

export function SummaryStrip({ totalCalories, complianceLabel }: SummaryStripProps) {
  return (
    <div className="surface-card rounded-2xl p-5 space-y-1.5">
      <p className="text-glass-text font-semibold text-base">
        {totalCalories} kcal total
      </p>
      <p className="text-glass-muted text-sm leading-relaxed">{complianceLabel}</p>
    </div>
  )
}
