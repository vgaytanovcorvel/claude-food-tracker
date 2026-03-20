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
          className="input-glass w-full"
          style={aiIdentified ? { paddingRight: '4.5rem' } : undefined}
        />
        {aiIdentified && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium px-2 py-0.5 rounded-full pointer-events-none"
            style={{ background: 'rgba(56,189,248,0.15)', color: 'rgba(56,189,248,0.9)', border: '1px solid rgba(56,189,248,0.3)' }}
          >
            AI ✦
          </span>
        )}
      </div>
    </div>
  )
}
