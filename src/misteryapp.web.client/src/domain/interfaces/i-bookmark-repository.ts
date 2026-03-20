import type { AlternativeBookmark } from '../models'

export interface IBookmarkRepository {
  bookmarkCreate(
    userId: number,
    alternativeFoodName: string,
    imageBase64: string | null,
    mimeType: string | null
  ): Promise<AlternativeBookmark>
  bookmarkGetByUser(userId: number, signal?: AbortSignal): Promise<AlternativeBookmark[]>
  bookmarkDelete(id: number): Promise<void>
}
