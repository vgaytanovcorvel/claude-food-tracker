import type { IUserProfileService } from '../domain/interfaces/i-user-profile-service'
import type { IUserProfileRepository } from '../domain/interfaces/i-user-profile-repository'
import type { UserProfile, DietStyle } from '../domain/models'

export class UserProfileService implements IUserProfileService {
  constructor(private readonly repo: IUserProfileRepository) {}

  getProfile(id: number): Promise<UserProfile | null> {
    return this.repo.userProfileSingleOrDefaultById(id)
  }

  createProfile(name: string, dietStyle: DietStyle): Promise<UserProfile> {
    return this.repo.userProfileCreate(name, dietStyle)
  }

  updateProfile(id: number, dietStyle: DietStyle): Promise<UserProfile> {
    return this.repo.userProfileUpdate(id, dietStyle)
  }

  deleteProfile(id: number): Promise<void> {
    return this.repo.userProfileDelete(id)
  }
}
