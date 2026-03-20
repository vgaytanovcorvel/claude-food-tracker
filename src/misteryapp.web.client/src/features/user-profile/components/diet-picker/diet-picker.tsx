import clsx from 'clsx'
import type { DietStyle } from '../../../../domain/models'
import s from './diet-picker.module.css'

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
          className={clsx(s.option, value === opt.value && s.optionSelected)}
        >
          <input
            type="radio"
            name="dietStyle"
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="accent-brand-500"
          />
          <span className={s.optionLabel}>{opt.label}</span>
          {opt.description && (
            <span className={s.optionDescription}>{opt.description}</span>
          )}
        </label>
      ))}
    </div>
  )
}
