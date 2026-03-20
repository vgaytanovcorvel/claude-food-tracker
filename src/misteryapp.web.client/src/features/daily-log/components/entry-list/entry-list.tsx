import { Link } from 'react-router-dom'
import type { FoodEntry } from '../../../../domain/models'
import { SeverityBadge } from '../severity-badge/severity-badge'
import s from './entry-list.module.css'

function parseAnalysis(json: string | null): { compatible: boolean; severity: string } | null {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

interface EntryListProps {
  entries: FoodEntry[]
  onDelete: (id: number) => void
}

export function EntryList({ entries, onDelete }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className={s.emptyState}>
        <div className={s.emptyIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" stroke="var(--color-icon-stroke-lg)" />
          </svg>
        </div>
        <div>
          <p className={s.emptyTitle}>Nothing logged yet</p>
          <p className={s.emptySubtitle}>Tap Log to add your first meal today.</p>
        </div>
        <Link to="/food-log" className={s.logLink}>
          Log Food
        </Link>
      </div>
    )
  }

  return (
    <>
      <ul className="space-y-3">
        {entries.map(entry => {
          const analysis = parseAnalysis(entry.analysisResult)
          const showBadge = analysis !== null && !analysis.compatible && analysis.severity !== 'None'
          return (
            <li key={entry.id} className={s.entryItem}>
              {entry.imageBase64 && (
                <img
                  src={`data:image/jpeg;base64,${entry.imageBase64}`}
                  alt={entry.foodName}
                  className={s.entryThumb}
                />
              )}
              <div className={s.entryContent}>
                <div className={s.entryMeta}>
                  <span className={s.entryName}>{entry.foodName}</span>
                  <span className={s.entryCalories}>{entry.estimatedCalories} kcal</span>
                </div>
                <div className={s.entryActions}>
                  {showBadge && <SeverityBadge severity={analysis!.severity} />}
                  <button
                    onClick={() => onDelete(entry.id)}
                    className={s.deleteBtn}
                    aria-label={`Delete ${entry.foodName}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <Link to="/food-log" className={s.logAnotherLink}>
        + Log another meal
      </Link>
    </>
  )
}
