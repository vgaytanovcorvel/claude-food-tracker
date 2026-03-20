import type { IBookmarkService } from '../domain/interfaces/i-bookmark-service'
import type { IBookmarkRepository } from '../domain/interfaces/i-bookmark-repository'
import type { AlternativeBookmark } from '../domain/models'

export class BookmarkService implements IBookmarkService {
  constructor(private readonly repo: IBookmarkRepository) {}

  createBookmark(
    userId: number,
    alternativeFoodName: string,
    imageBase64: string | null,
    mimeType: string | null
  ): Promise<AlternativeBookmark> {
    return this.repo.bookmarkCreate(userId, alternativeFoodName, imageBase64, mimeType)
  }

  getBookmarks(userId: number, signal?: AbortSignal): Promise<AlternativeBookmark[]> {
    return this.repo.bookmarkGetByUser(userId, signal)
  }

  deleteBookmark(id: number): Promise<void> {
    return this.repo.bookmarkDelete(id)
  }
}
