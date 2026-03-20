import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import { useBookmarks } from '../features/bookmarks/state/use-bookmarks'
import { useDeleteBookmark } from '../features/bookmarks/state/use-delete-bookmark'
import BottomNav from '../components/BottomNav'

export default function BookmarksPage() {
  const { userId } = useIdentity()
  const navigate = useNavigate()

  const { data: bookmarks = [], isLoading, isError } = useBookmarks(userId)
  const deleteBookmark = useDeleteBookmark(userId)

  useEffect(() => {
    if (!userId) {
      navigate('/onboarding', { replace: true })
    }
  }, [userId, navigate])

  async function handleDelete(id: number) {
    await deleteBookmark.mutateAsync(id)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 pb-28">
      <div className="glass-modal w-full max-w-lg p-8 space-y-6">
        <div>
          <h1 className="text-display-md text-glass-text">Saved Alternatives</h1>
          <p className="text-glass-muted text-sm mt-1">Meals to try instead when your diet conflicts.</p>
        </div>

        {isError && <p className="text-red-400 text-sm">Failed to load bookmarks. Please try again.</p>}
        {deleteBookmark.isError && <p className="text-red-400 text-sm">Failed to remove bookmark. Please try again.</p>}

        {isLoading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-white/10" />
            ))}
          </div>
        )}

        {!isLoading && !isError && bookmarks.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.10)', border: '1px solid rgba(14,165,233,0.2)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(56,189,248,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-glass-text font-medium">No saved alternatives yet</p>
              <p className="text-glass-muted text-sm mt-1 leading-relaxed max-w-xs">
                When a meal conflicts with your diet, you can save the AI-suggested alternative here to revisit later.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !isError && bookmarks.length > 0 && (
          <ul className="space-y-3">
            {bookmarks.map(bookmark => (
              <li
                key={bookmark.id}
                className="flex items-center gap-4 rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {bookmark.imageBase64 && bookmark.mimeType && (
                  <img
                    src={`data:${bookmark.mimeType};base64,${bookmark.imageBase64}`}
                    alt={bookmark.alternativeFoodName}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                )}
                {!bookmark.imageBase64 && (
                  <div className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center" style={{ background: 'rgba(14,165,233,0.10)', border: '1px solid rgba(14,165,233,0.15)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(56,189,248,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-glass-text font-medium truncate leading-snug">
                    {bookmark.alternativeFoodName}
                  </p>
                  <p className="text-glass-muted text-xs mt-1">
                    Saved {new Date(bookmark.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  className="text-white/25 hover:text-red-400 text-xs transition-colors duration-200 shrink-0"
                  aria-label={`Remove ${bookmark.alternativeFoodName}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
