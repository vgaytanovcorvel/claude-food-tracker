import type { IUserProfileRepository } from '../domain/interfaces/i-user-profile-repository'
import type { ApiResponse, UserProfile, DietStyle } from '../domain/models'
import { AppError, NotFoundException } from '../domain/errors'

export class HttpUserProfileRepository implements IUserProfileRepository {
  async userProfileSingleOrDefaultById(id: number): Promise<UserProfile | null> {
    const res = await fetch(`/api/users/${id}`)
    if (res.status === 404) return null
    const json: ApiResponse<UserProfile> = await res.json()
    if (!json.success || !json.data) throw new AppError(json.error ?? 'Failed to fetch profile', 'API_ERROR')
    return json.data
  }

  async userProfileSingleById(id: number): Promise<UserProfile> {
    const profile = await this.userProfileSingleOrDefaultById(id)
    if (!profile) throw new NotFoundException(`User profile not found (UserId: ${id})`)
    return profile
  }

  async userProfileCreate(name: string, dietStyle: DietStyle): Promise<UserProfile> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, dietStyle }),
    })
    const json: ApiResponse<UserProfile> = await res.json()
    if (!json.success || !json.data) throw new AppError(json.error ?? 'Failed to create profile', 'API_ERROR')
    return json.data
  }

  async userProfileUpdate(id: number, dietStyle: DietStyle): Promise<UserProfile> {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dietStyle }),
    })
    const json: ApiResponse<UserProfile> = await res.json()
    if (!json.success || !json.data) throw new AppError(json.error ?? 'Failed to update profile', 'API_ERROR')
    return json.data
  }

  async userProfileDelete(id: number): Promise<void> {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new AppError(`Delete failed (status ${res.status})`, 'API_ERROR')
  }
}
