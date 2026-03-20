import type { UserProfile, DietStyle } from '../models'

export interface IUserProfileRepository {
  userProfileSingleById(id: number): Promise<UserProfile>
  userProfileSingleOrDefaultById(id: number): Promise<UserProfile | null>
  userProfileCreate(name: string, dietStyle: DietStyle): Promise<UserProfile>
  userProfileUpdate(id: number, dietStyle: DietStyle): Promise<UserProfile>
  userProfileDelete(id: number): Promise<void>
}
