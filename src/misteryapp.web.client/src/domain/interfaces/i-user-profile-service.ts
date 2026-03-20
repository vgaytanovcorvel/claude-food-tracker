import type { UserProfile, DietStyle } from '../models'

export interface IUserProfileService {
  getProfile(id: number): Promise<UserProfile | null>
  createProfile(name: string, dietStyle: DietStyle): Promise<UserProfile>
  updateProfile(id: number, dietStyle: DietStyle): Promise<UserProfile>
  deleteProfile(id: number): Promise<void>
}
