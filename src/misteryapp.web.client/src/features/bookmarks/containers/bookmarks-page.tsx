import { useIdentity } from '../../../hooks/useIdentity'
import { useBookmarks } from '../state/use-bookmarks'
import { useDeleteBookmark } from '../state/use-delete-bookmark'
import { BookmarkList } from '../components/bookmark-list/bookmark-list'
import { BottomNav } from '../../../shared/components/bottom-nav/bottom-nav'

export function BookmarksPage() {
  const { userId } = useIdentity()

  const { data: bookmarks = [], isLoading, isError } = useBookmarks(userId)
  const deleteBookmark = useDeleteBookmark(userId)

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

        {!isLoading && !isError && (
          <BookmarkList bookmarks={bookmarks} onDelete={handleDelete} />
        )}
      </div>

      <BottomNav />
    </div>
  )
}
