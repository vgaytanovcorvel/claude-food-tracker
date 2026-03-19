import type { ApiResponse } from './types'

export interface AlternativeBookmark {
  id: number
  userId: number
  alternativeFoodName: string
  imageBase64: string | null
  mimeType: string | null
  createdAt: string
}

export async function createBookmark(
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
  if (!json.success || !json.data) throw new Error(json.error ?? 'Failed to save bookmark')
  return json.data
}

export async function getUserBookmarks(
  userId: number,
  signal?: AbortSignal
): Promise<AlternativeBookmark[]> {
  try {
    const res = await fetch(`/api/alternatives/bookmarks?userId=${userId}`, { signal })
    if (!res.ok) return []
    const json: ApiResponse<AlternativeBookmark[]> = await res.json()
    return json.success && json.data ? json.data : []
  } catch {
    return []
  }
}

export async function deleteBookmark(id: number): Promise<void> {
  const res = await fetch(`/api/alternatives/bookmarks/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete bookmark (status ${res.status})`)
}
