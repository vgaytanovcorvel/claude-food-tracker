import type { ApiResponse } from './types'

export type { ApiResponse }
export type DietStyle = 'Keto' | 'LowFat' | 'Mediterranean'

export interface UserProfile {
  id: number
  name: string
  dietStyle: DietStyle
  createdAt: string
  lastActiveAt: string | null
}

export async function createUserProfile(name: string, dietStyle: DietStyle): Promise<UserProfile> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, dietStyle }),
  })
  const json: ApiResponse<UserProfile> = await res.json()
  if (!json.success || !json.data) throw new Error(json.error ?? 'Failed to create profile')
  return json.data
}

export async function getUserProfile(id: number): Promise<UserProfile | null> {
  const res = await fetch(`/api/users/${id}`)
  if (res.status === 404) return null
  const json: ApiResponse<UserProfile> = await res.json()
  if (!json.success || !json.data) throw new Error(json.error ?? 'Failed to fetch profile')
  return json.data
}

export async function updateUserProfile(id: number, dietStyle: DietStyle): Promise<UserProfile> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dietStyle }),
  })
  const json: ApiResponse<UserProfile> = await res.json()
  if (!json.success || !json.data) throw new Error(json.error ?? 'Failed to update profile')
  return json.data
}

export async function deleteUserProfile(id: number): Promise<void> {
  await fetch(`/api/users/${id}`, { method: 'DELETE' })
}
