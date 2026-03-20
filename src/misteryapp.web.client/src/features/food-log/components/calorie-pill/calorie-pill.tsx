interface CaloriePillProps {
  calories: number
  calorieUserEdited: boolean
  expanded: boolean
  editValue: string
  onPillClick: () => void
  onEditChange: (value: string) => void
  onConfirm: () => void
}

export function CaloriePill({
  calories,
  calorieUserEdited,
  expanded,
  editValue,
  onPillClick,
  onEditChange,
  onConfirm,
}: CaloriePillProps) {
  return (
    <div className="space-y-1">
      <label className="field-label">Estimated calories</label>
      {expanded ? (
        <input
          type="number"
          min="0"
          max="9999"
          step="1"
          value={editValue}
          onChange={e => onEditChange(e.target.value)}
          onBlur={onConfirm}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm() }}
          autoFocus
          className="input-glass"
          placeholder="e.g. 300"
        />
      ) : (
        <button
          type="button"
          onClick={onPillClick}
          className="w-full text-left px-4 py-2.5 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {calories > 0 ? (
            <span className="text-sm font-medium text-white">{!calorieUserEdited && '~'}{calories} kcal</span>
          ) : (
            <span className="text-sm text-glass-muted">Tap to set calories</span>
          )}
        </button>
      )}
    </div>
  )
}
