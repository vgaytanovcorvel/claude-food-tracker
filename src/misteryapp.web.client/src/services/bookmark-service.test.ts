import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BookmarkService } from './bookmark-service'
import type { IBookmarkRepository } from '../domain/interfaces/i-bookmark-repository'
import type { AlternativeBookmark } from '../domain/models'

const mockBookmark: AlternativeBookmark = {
  id: 1,
  userId: 1,
  alternativeFoodName: 'Salad',
  imageBase64: null,
  mimeType: null,
  createdAt: '2024-01-15T00:00:00Z',
}

function makeMockRepo(): IBookmarkRepository {
  return {
    bookmarkCreate: vi.fn(),
    bookmarkGetByUser: vi.fn(),
    bookmarkDelete: vi.fn(),
  }
}

describe('BookmarkService', () => {
  let repo: IBookmarkRepository
  let service: BookmarkService

  beforeEach(() => {
    repo = makeMockRepo()
    service = new BookmarkService(repo)
  })

  describe('createBookmark', () => {
    it('createBookmark_ShouldDelegateToRepo_WhenCalled', async () => {
      // Arrange
      const userId = 1
      const alternativeFoodName = 'Salad'
      const imageBase64 = null
      const mimeType = null
      vi.mocked(repo.bookmarkCreate).mockResolvedValue(mockBookmark)

      // Act
      const result = await service.createBookmark(userId, alternativeFoodName, imageBase64, mimeType)

      // Assert
      expect(repo.bookmarkCreate).toHaveBeenCalledTimes(1)
      expect(repo.bookmarkCreate).toHaveBeenCalledWith(userId, alternativeFoodName, imageBase64, mimeType)
      expect(result).toEqual(mockBookmark)
    })

    it('createBookmark_ShouldPassImageData_WhenImageProvided', async () => {
      // Arrange
      const userId = 1
      const alternativeFoodName = 'Salad'
      const imageBase64 = 'abc123'
      const mimeType = 'image/jpeg'
      const bookmarkWithImage: AlternativeBookmark = { ...mockBookmark, imageBase64, mimeType }
      vi.mocked(repo.bookmarkCreate).mockResolvedValue(bookmarkWithImage)

      // Act
      const result = await service.createBookmark(userId, alternativeFoodName, imageBase64, mimeType)

      // Assert
      expect(repo.bookmarkCreate).toHaveBeenCalledTimes(1)
      expect(repo.bookmarkCreate).toHaveBeenCalledWith(userId, alternativeFoodName, imageBase64, mimeType)
      expect(result.imageBase64).toBe('abc123')
      expect(result.mimeType).toBe('image/jpeg')
    })
  })

  describe('getBookmarks', () => {
    it('getBookmarks_ShouldDelegateToRepo_WhenCalled', async () => {
      // Arrange
      const userId = 1
      vi.mocked(repo.bookmarkGetByUser).mockResolvedValue([mockBookmark])

      // Act
      const result = await service.getBookmarks(userId)

      // Assert
      expect(repo.bookmarkGetByUser).toHaveBeenCalledTimes(1)
      expect(repo.bookmarkGetByUser).toHaveBeenCalledWith(userId, undefined)
      expect(result).toEqual([mockBookmark])
    })

    it('getBookmarks_ShouldPassSignal_WhenSignalProvided', async () => {
      // Arrange
      const userId = 1
      const controller = new AbortController()
      const signal = controller.signal
      vi.mocked(repo.bookmarkGetByUser).mockResolvedValue([mockBookmark])

      // Act
      const result = await service.getBookmarks(userId, signal)

      // Assert
      expect(repo.bookmarkGetByUser).toHaveBeenCalledTimes(1)
      expect(repo.bookmarkGetByUser).toHaveBeenCalledWith(userId, signal)
      expect(result).toEqual([mockBookmark])
    })

    it('getBookmarks_ShouldReturnEmptyArray_WhenRepoReturnsEmpty', async () => {
      // Arrange
      const userId = 1
      vi.mocked(repo.bookmarkGetByUser).mockResolvedValue([])

      // Act
      const result = await service.getBookmarks(userId)

      // Assert
      expect(repo.bookmarkGetByUser).toHaveBeenCalledTimes(1)
      expect(result).toEqual([])
    })
  })

  describe('deleteBookmark', () => {
    it('deleteBookmark_ShouldDelegateToRepo_WhenCalled', async () => {
      // Arrange
      const bookmarkId = 1
      vi.mocked(repo.bookmarkDelete).mockResolvedValue(undefined)

      // Act
      await service.deleteBookmark(bookmarkId)

      // Assert
      expect(repo.bookmarkDelete).toHaveBeenCalledTimes(1)
      expect(repo.bookmarkDelete).toHaveBeenCalledWith(bookmarkId)
    })
  })
})
