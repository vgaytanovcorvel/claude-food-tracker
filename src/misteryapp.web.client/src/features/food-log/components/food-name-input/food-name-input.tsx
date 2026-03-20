import clsx from 'clsx'
import s from './food-name-input.module.css'

interface FoodNameInputProps {
  value: string
  aiIdentified: boolean
  onChange: (value: string) => void
}

export function FoodNameInput({ value, aiIdentified, onChange }: FoodNameInputProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="food-name" className="field-label">Food name</label>
      <div className="relative">
        <input
          id="food-name"
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="e.g. Chicken breast"
          className={clsx('input-glass w-full', aiIdentified && s.inputWithBadge)}
        />
        {aiIdentified && (
          <span className={s.aiBadge}>
            AI ✦
          </span>
        )}
      </div>
    </div>
  )
}
