import type { DietStyle } from '../../../../domain/models'

interface DietPickerOption {
  value: DietStyle
  label: string
  description?: string
}

interface DietPickerProps {
  value: DietStyle
  onChange: (diet: DietStyle) => void
  options: DietPickerOption[]
}

export function DietPicker({ value, onChange, options }: DietPickerProps) {
  return (
    <div className="space-y-2">
      {options.map(opt => (
        <label
          key={opt.value}
          className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
            value === opt.value
              ? 'border-brand-500/60 bg-brand-500/10'
              : 'border-white/10 bg-white/5'
          }`}
        >
          <input
            type="radio"
            name="dietStyle"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-brand-500"
          />
          <span className="text-glass-text font-medium">{opt.label}</span>
          {opt.description && (
            <span className="text-glass-muted text-sm">{opt.description}</span>
          )}
        </label>
      ))}
    </div>
  )
}
