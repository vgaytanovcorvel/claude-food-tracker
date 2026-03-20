import { Link } from 'react-router-dom'
import type { FoodEntry } from '../../../../domain/models'
import { SeverityBadge } from '../severity-badge/severity-badge'

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
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.25)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(56,189,248,0.7)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <div>
          <p className="text-glass-text font-medium text-sm">Nothing logged yet</p>
          <p className="text-glass-muted text-xs mt-1">Tap Log to add your first meal today.</p>
        </div>
        <Link
          to="/food-log"
          className="px-5 py-2 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:brightness-110"
          style={{ background: 'linear-gradient(to bottom, #38bdf8, #0284c7)', boxShadow: '0 6px 16px -3px rgba(14,165,233,0.45)' }}
        >
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
            <li
              key={entry.id}
              className="flex items-center rounded-2xl overflow-hidden gap-0"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {entry.imageBase64 && (
                <img
                  src={`data:image/jpeg;base64,${entry.imageBase64}`}
                  alt={entry.foodName}
                  className="w-16 h-16 object-cover shrink-0"
                />
              )}
              <div className="flex items-center justify-between flex-1 px-4 py-4 gap-3 min-w-0">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <span className="text-glass-text font-medium truncate leading-snug">
                    {entry.foodName}
                  </span>
                  <span className="text-glass-muted text-xs">
                    {entry.estimatedCalories} kcal
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {showBadge && <SeverityBadge severity={analysis!.severity} />}
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="text-white/25 hover:text-red-400 text-xs transition-colors duration-200"
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
      <Link
        to="/food-log"
        className="inline-block text-sm font-medium transition-colors duration-200"
        style={{ color: 'rgba(56,189,248,0.8)' }}
      >
        + Log another meal
      </Link>
    </>
  )
}
