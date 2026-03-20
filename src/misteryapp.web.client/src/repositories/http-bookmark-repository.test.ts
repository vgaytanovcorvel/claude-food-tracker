import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import { HttpBookmarkRepository } from './http-bookmark-repository'
import { AppError } from '../domain/errors'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const repo = new HttpBookmarkRepository()

const expectedBookmark = {
  id: 1,
  userId: 1,
  alternativeFoodName: 'Salad',
  imageBase64: null,
  mimeType: null,
  createdAt: '2024-01-15T00:00:00Z',
}

describe('HttpBookmarkRepository', () => {
  describe('bookmarkCreate', () => {
    it('bookmarkCreate_ShouldReturnMappedBookmark_WhenApiReturnsSuccess', async () => {
      // Arrange
      const userId = 1
      const alternativeFoodName = 'Salad'
      const imageBase64 = null
      const mimeType = null

      // Act
      const result = await repo.bookmarkCreate(userId, alternativeFoodName, imageBase64, mimeType)

      // Assert
      expect(result).toEqual(expectedBookmark)
    })

    it('bookmarkCreate_ShouldThrowAppError_WhenApiReturnsFailure', async () => {
      // Arrange
      server.use(
        http.post('/api/alternatives/bookmarks', () =>
          HttpResponse.json({ success: false, data: null, error: 'Failed to save bookmark', statusCode: 500 }, { status: 500 })
        )
      )

      // Act
      const act = () => repo.bookmarkCreate(1, 'Salad', null, null)

      // Assert
      await expect(act()).rejects.toThrow(AppError)
    })
  })

  describe('bookmarkGetByUser', () => {
    it('bookmarkGetByUser_ShouldReturnBookmarkList_WhenApiReturnsSuccess', async () => {
      // Arrange
      const userId = 1

      // Act
      const result = await repo.bookmarkGetByUser(userId)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(expectedBookmark)
    })

    it('bookmarkGetByUser_ShouldReturnEmptyArray_WhenApiReturnsError', async () => {
      // Arrange
      server.use(
        http.get('/api/alternatives/bookmarks', () => new HttpResponse(null, { status: 500 }))
      )

      // Act
      const result = await repo.bookmarkGetByUser(1)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('bookmarkDelete', () => {
    it('bookmarkDelete_ShouldCompleteWithoutError_WhenApiReturnsSuccess', async () => {
      // Arrange
      const bookmarkId = 1

      // Act
      const act = () => repo.bookmarkDelete(bookmarkId)

      // Assert
      await expect(act()).resolves.toBeUndefined()
    })

    it('bookmarkDelete_ShouldThrowAppError_WhenApiReturnsNonOkResponse', async () => {
      // Arrange
      server.use(
        http.delete('/api/alternatives/bookmarks/:id', () => new HttpResponse(null, { status: 500 }))
      )

      // Act
      const act = () => repo.bookmarkDelete(1)

      // Assert
      await expect(act()).rejects.toThrow(AppError)
    })
  })
})
