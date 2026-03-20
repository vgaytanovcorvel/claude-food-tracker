import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'
import { HttpUserProfileRepository } from './http-user-profile-repository'
import { NotFoundException } from '../domain/errors'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const repo = new HttpUserProfileRepository()

const expectedUser = {
  id: 1,
  name: 'Test User',
  dietStyle: 'Mediterranean',
  createdAt: '2024-01-01T00:00:00Z',
  lastActiveAt: '2024-01-15T10:00:00Z',
}

describe('HttpUserProfileRepository', () => {
  describe('userProfileCreate', () => {
    it('userProfileCreate_ShouldReturnMappedDomainModel_WhenApiReturnsSuccess', async () => {
      // Arrange
      const name = 'Test User'
      const dietStyle = 'Mediterranean' as const

      // Act
      const result = await repo.userProfileCreate(name, dietStyle)

      // Assert
      expect(result).toEqual(expectedUser)
    })
  })

  describe('userProfileSingleById', () => {
    it('userProfileSingleById_ShouldReturnUser_WhenUserExists', async () => {
      // Arrange
      const userId = 1

      // Act
      const result = await repo.userProfileSingleById(userId)

      // Assert
      expect(result).toEqual(expectedUser)
    })

    it('userProfileSingleById_ShouldThrowNotFoundException_WhenApiReturns404', async () => {
      // Arrange
      const unknownUserId = 999

      // Act
      const act = () => repo.userProfileSingleById(unknownUserId)

      // Assert
      await expect(act()).rejects.toThrow(NotFoundException)
    })
  })

  describe('userProfileUpdate', () => {
    it('userProfileUpdate_ShouldReturnUpdatedUser_WhenApiReturnsSuccess', async () => {
      // Arrange
      const userId = 1
      const newDietStyle = 'Keto' as const

      // Act
      const result = await repo.userProfileUpdate(userId, newDietStyle)

      // Assert
      expect(result.dietStyle).toBe('Keto')
      expect(result.id).toBe(1)
    })
  })

  describe('userProfileDelete', () => {
    it('userProfileDelete_ShouldCompleteWithoutError_WhenApiReturnsSuccess', async () => {
      // Arrange
      const userId = 1

      // Act
      const act = () => repo.userProfileDelete(userId)

      // Assert
      await expect(act()).resolves.toBeUndefined()
    })

    it('userProfileDelete_ShouldThrowAppError_WhenApiReturnsError', async () => {
      // Arrange
      server.use(
        http.delete('/api/users/:id', () => new HttpResponse(null, { status: 500 }))
      )

      // Act
      const act = () => repo.userProfileDelete(1)

      // Assert
      await expect(act()).rejects.toThrow()
    })
  })
})
