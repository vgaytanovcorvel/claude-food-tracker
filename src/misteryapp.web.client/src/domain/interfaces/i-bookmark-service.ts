import type { AlternativeBookmark } from '../models'

export interface IBookmarkService {
  createBookmark(
    userId: number,
    alternativeFoodName: string,
    imageBase64: string | null,
    mimeType: string | null
  ): Promise<AlternativeBookmark>
  getBookmarks(userId: number, signal?: AbortSignal): Promise<AlternativeBookmark[]>
  deleteBookmark(id: number): Promise<void>
}
