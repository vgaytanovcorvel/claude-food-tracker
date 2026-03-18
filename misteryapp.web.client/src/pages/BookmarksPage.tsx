import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import {
  getUserBookmarks,
  deleteBookmark,
  type AlternativeBookmark,
} from '../api/bookmarksApi'

export default function BookmarksPage() {
  const { userId } = useIdentity()
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState<AlternativeBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!userId) {
      navigate('/onboarding', { replace: true })
      return
    }
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)

    getUserBookmarks(Number(userId), controller.signal)
      .then(items => {
        if (controller.signal.aborted) return
        setBookmarks(items)
        setLoading(false)
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setError('Failed to load bookmarks. Please try again.')
        setLoading(false)
      })

    return () => controller.abort()
  }, [userId, navigate])

  async function handleDelete(id: number) {
    try {
      await deleteBookmark(id)
      setBookmarks(bm => bm.filter(b => b.id !== id))
    } catch {
      setError('Failed to remove bookmark. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen items-start justify-center p-6">
      <div className="glass-surface-lg w-full max-w-lg p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-display-md text-glass-text">Saved Alternatives</h1>
          <Link to="/" className="text-sm text-brand-500 hover:underline">Home</Link>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-lg bg-white/10" />
            ))}
          </div>
        )}

        {!loading && !error && bookmarks.length === 0 && (
          <p className="text-glass-muted text-sm">
            No saved alternatives yet. When a meal conflicts with your diet, save the suggested alternative to revisit later.
          </p>
        )}

        {!loading && !error && bookmarks.length > 0 && (
          <ul className="space-y-3">
            {bookmarks.map(bookmark => (
              <li
                key={bookmark.id}
                className="flex items-center gap-4 border border-glass-border rounded-lg p-3"
              >
                {bookmark.imageBase64 && bookmark.mimeType && (
                  <img
                    src={`data:${bookmark.mimeType};base64,${bookmark.imageBase64}`}
                    alt={bookmark.alternativeFoodName}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-glass-text font-medium truncate">
                    {bookmark.alternativeFoodName}
                  </p>
                  <p className="text-glass-muted text-xs">
                    Saved {new Date(bookmark.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  className="text-glass-muted hover:text-red-400 text-xs shrink-0"
                  aria-label={`Remove ${bookmark.alternativeFoodName}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-4 pt-2">
          <Link to="/reports/weekly" className="text-sm text-brand-500 hover:underline">
            Weekly report
          </Link>
          <Link to="/daily-log" className="text-sm text-brand-500 hover:underline">
            Daily log
          </Link>
        </div>
      </div>
    </div>
  )
}
