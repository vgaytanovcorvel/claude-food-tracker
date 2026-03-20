import type { IBookmarkRepository } from '../domain/interfaces/i-bookmark-repository'
import type { ApiResponse, AlternativeBookmark } from '../domain/models'
import { AppError } from '../domain/errors'

export class HttpBookmarkRepository implements IBookmarkRepository {
  async bookmarkCreate(
    userId: number,
    alternativeFoodName: string,
    imageBase64: string | null,
    mimeType: string | null
  ): Promise<AlternativeBookmark> {
    const res = await fetch('/api/alternatives/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, alternativeFoodName, imageBase64, mimeType }),
    })
    const json: ApiResponse<AlternativeBookmark> = await res.json()
    if (!json.success || !json.data) throw new AppError(json.error ?? 'Failed to save bookmark', 'API_ERROR')
    return json.data
  }

  async bookmarkGetByUser(userId: number, signal?: AbortSignal): Promise<AlternativeBookmark[]> {
    try {
      const res = await fetch(`/api/alternatives/bookmarks?userId=${userId}`, { signal })
      if (!res.ok) return []
      const json: ApiResponse<AlternativeBookmark[]> = await res.json()
      return json.success && json.data ? json.data : []
    } catch {
      return []
    }
  }

  async bookmarkDelete(id: number): Promise<void> {
    const res = await fetch(`/api/alternatives/bookmarks/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new AppError(`Failed to delete bookmark (status ${res.status})`, 'API_ERROR')
  }
}
