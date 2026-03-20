import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserProfileService } from './user-profile-service'
import type { IUserProfileRepository } from '../domain/interfaces/i-user-profile-repository'
import type { UserProfile } from '../domain/models'

const mockUser: UserProfile = {
  id: 1,
  name: 'Test User',
  dietStyle: 'Mediterranean',
  createdAt: '2024-01-01T00:00:00Z',
  lastActiveAt: '2024-01-15T10:00:00Z',
}

function makeMockRepo(): IUserProfileRepository {
  return {
    userProfileSingleById: vi.fn(),
    userProfileSingleOrDefaultById: vi.fn(),
    userProfileCreate: vi.fn(),
    userProfileUpdate: vi.fn(),
    userProfileDelete: vi.fn(),
  }
}

describe('UserProfileService', () => {
  let repo: IUserProfileRepository
  let service: UserProfileService

  beforeEach(() => {
    repo = makeMockRepo()
    service = new UserProfileService(repo)
  })

  describe('getProfile', () => {
    it('getUserProfile_ShouldCallRepoSingleById_WhenCalled', async () => {
      // Arrange
      const userId = 1
      vi.mocked(repo.userProfileSingleOrDefaultById).mockResolvedValue(mockUser)

      // Act
      const result = await service.getProfile(userId)

      // Assert
      expect(repo.userProfileSingleOrDefaultById).toHaveBeenCalledTimes(1)
      expect(repo.userProfileSingleOrDefaultById).toHaveBeenCalledWith(userId)
      expect(result).toEqual(mockUser)
    })

    it('getUserProfile_ShouldReturnNull_WhenUserDoesNotExist', async () => {
      // Arrange
      const userId = 999
      vi.mocked(repo.userProfileSingleOrDefaultById).mockResolvedValue(null)

      // Act
      const result = await service.getProfile(userId)

      // Assert
      expect(repo.userProfileSingleOrDefaultById).toHaveBeenCalledTimes(1)
      expect(repo.userProfileSingleOrDefaultById).toHaveBeenCalledWith(userId)
      expect(result).toBeNull()
    })
  })

  describe('createProfile', () => {
    it('createUserProfile_ShouldCallRepoCreate_WhenCalled', async () => {
      // Arrange
      const name = 'Test User'
      const dietStyle = 'Mediterranean' as const
      vi.mocked(repo.userProfileCreate).mockResolvedValue(mockUser)

      // Act
      const result = await service.createProfile(name, dietStyle)

      // Assert
      expect(repo.userProfileCreate).toHaveBeenCalledTimes(1)
      expect(repo.userProfileCreate).toHaveBeenCalledWith(name, dietStyle)
      expect(result).toEqual(mockUser)
    })
  })

  describe('updateProfile', () => {
    it('updateUserProfile_ShouldCallRepoUpdate_WhenCalled', async () => {
      // Arrange
      const userId = 1
      const newDietStyle = 'Keto' as const
      const updatedUser = { ...mockUser, dietStyle: newDietStyle }
      vi.mocked(repo.userProfileUpdate).mockResolvedValue(updatedUser)

      // Act
      const result = await service.updateProfile(userId, newDietStyle)

      // Assert
      expect(repo.userProfileUpdate).toHaveBeenCalledTimes(1)
      expect(repo.userProfileUpdate).toHaveBeenCalledWith(userId, newDietStyle)
      expect(result.dietStyle).toBe('Keto')
    })
  })

  describe('deleteProfile', () => {
    it('deleteUserProfile_ShouldCallRepoDelete_WhenCalled', async () => {
      // Arrange
      const userId = 1
      vi.mocked(repo.userProfileDelete).mockResolvedValue(undefined)

      // Act
      await service.deleteProfile(userId)

      // Assert
      expect(repo.userProfileDelete).toHaveBeenCalledTimes(1)
      expect(repo.userProfileDelete).toHaveBeenCalledWith(userId)
    })
  })
})
