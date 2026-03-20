interface SummaryStripProps {
  totalCalories: number
  complianceLabel: string
}

export function SummaryStrip({ totalCalories, complianceLabel }: SummaryStripProps) {
  return (
    <div className="rounded-2xl p-5 space-y-1.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-glass-text font-semibold text-base">
        {totalCalories} kcal total
      </p>
      <p className="text-glass-muted text-sm leading-relaxed">{complianceLabel}</p>
    </div>
  )
}
