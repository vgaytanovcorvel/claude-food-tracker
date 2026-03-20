import type { AlternativeBookmark } from '../../../../domain/models'
import s from './bookmark-list.module.css'

interface BookmarkListProps {
  bookmarks: AlternativeBookmark[]
  onDelete: (id: number) => void
}

export function BookmarkList({ bookmarks, onDelete }: BookmarkListProps) {
  if (bookmarks.length === 0) {
    return (
      <div className={s.emptyState}>
        <div className={s.emptyIcon}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-stroke)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <p className={s.emptyTitle}>No saved alternatives yet</p>
          <p className={s.emptySubtitle}>
            When a meal conflicts with your diet, you can save the AI-suggested alternative here to revisit later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {bookmarks.map(bookmark => (
        <li key={bookmark.id} className={s.item}>
          {bookmark.imageBase64 && bookmark.mimeType && (
            <img
              src={`data:${bookmark.mimeType};base64,${bookmark.imageBase64}`}
              alt={bookmark.alternativeFoodName}
              className={s.itemThumb}
            />
          )}
          {!bookmark.imageBase64 && (
            <div className={s.itemThumbPlaceholder}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-icon-stroke)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          )}
          <div className={s.itemContent}>
            <p className={s.itemName}>{bookmark.alternativeFoodName}</p>
            <p className={s.itemDate}>
              Saved {new Date(bookmark.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={() => onDelete(bookmark.id)}
            className={s.deleteBtn}
            aria-label={`Remove ${bookmark.alternativeFoodName}`}
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  )
}
