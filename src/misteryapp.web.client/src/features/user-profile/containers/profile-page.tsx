import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DietStyle } from '../../../domain/models'
import { useIdentity } from '../../../hooks/useIdentity'
import { useProfile } from '../state/use-profile'
import { useUpdateProfile } from '../state/use-update-profile'
import { useDeleteProfile } from '../state/use-delete-profile'
import { DietPicker } from '../components/diet-picker/diet-picker'
import { BottomNav } from '../../../shared/components/bottom-nav/bottom-nav'

const DIET_OPTIONS: { value: DietStyle; label: string }[] = [
  { value: 'Keto', label: 'Keto' },
  { value: 'LowFat', label: 'Low Fat' },
  { value: 'Mediterranean', label: 'Mediterranean' },
]

export function ProfilePage() {
  const navigate = useNavigate()
  const { userId, clearIdentity } = useIdentity()
  const { data: profile, isLoading, isError } = useProfile(userId)
  const updateProfile = useUpdateProfile(userId)
  const deleteProfile = useDeleteProfile()
  const [selectedDiet, setSelectedDiet] = useState<DietStyle>('Keto')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) { navigate('/onboarding'); return }
  }, [userId, navigate])

  useEffect(() => {
    if (!isLoading && !profile) {
      navigate('/onboarding')
      return
    }
    if (profile) setSelectedDiet(profile.dietStyle)
  }, [profile, isLoading, navigate])

  useEffect(() => {
    if (isError) setError('Failed to load profile.')
  }, [isError])

  async function handleSaveDiet() {
    if (!profile) return
    setError(null)
    try {
      await updateProfile.mutateAsync(selectedDiet)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    }
  }

  async function handleDeleteAccount() {
    if (!profile) return
    if (!window.confirm('Delete your account and all data? This cannot be undone.')) return
    await deleteProfile.mutateAsync(profile.id)
    clearIdentity()
    navigate('/onboarding')
  }

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-glass-muted">Loading...</p>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center p-6 pb-24">
      <div className="glass-modal w-full max-w-md p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-display-md text-glass-text">Your Profile</h1>
          <p className="text-body-lg text-glass-muted">{profile?.name}</p>
        </div>

        <div className="space-y-3">
          <span className="field-label">Diet style</span>
          <DietPicker value={selectedDiet} onChange={setSelectedDiet} options={DIET_OPTIONS} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="space-y-3">
          <button
            onClick={handleSaveDiet}
            disabled={updateProfile.isPending || selectedDiet === profile?.dietStyle}
            className="btn-primary w-full py-3"
          >
            {updateProfile.isPending ? 'Saving...' : 'Save changes'}
          </button>

          <button
            onClick={() => { clearIdentity(); navigate('/onboarding') }}
            className="w-full rounded-xl border border-white/10 px-6 py-3 font-medium text-glass-muted text-sm transition-colors hover:bg-white/8 hover:text-glass-text"
          >
            Log out
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full rounded-xl border border-red-400/40 px-6 py-3 font-medium text-red-400/80 text-sm transition-colors hover:bg-red-400/10 hover:text-red-400"
          >
            Delete account
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
