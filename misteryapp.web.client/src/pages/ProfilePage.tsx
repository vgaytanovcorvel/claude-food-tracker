import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { type DietStyle, type UserProfile, getUserProfile, updateUserProfile, deleteUserProfile } from '../api/userProfileApi'
import { useIdentity } from '../hooks/useIdentity'

const DIET_OPTIONS: { value: DietStyle; label: string }[] = [
  { value: 'Keto', label: 'Keto' },
  { value: 'LowFat', label: 'Low Fat' },
  { value: 'Mediterranean', label: 'Mediterranean' },
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const { userId, clearIdentity } = useIdentity()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedDiet, setSelectedDiet] = useState<DietStyle>('Keto')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) { navigate('/onboarding'); return }
    getUserProfile(Number(userId)).then(p => {
      if (!p) { navigate('/onboarding'); return }
      setProfile(p)
      setSelectedDiet(p.dietStyle)
    }).catch(() => setError('Failed to load profile.')).finally(() => setLoading(false))
  }, [userId, navigate])

  async function handleSaveDiet() {
    if (!profile) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateUserProfile(profile.id, selectedDiet)
      setProfile(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!profile) return
    if (!window.confirm('Delete your account and all data? This cannot be undone.')) return
    await deleteUserProfile(profile.id)
    clearIdentity()
    navigate('/onboarding')
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-glass-muted">Loading...</p>
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-surface-lg w-full max-w-md p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-display-md text-glass-text">Your profile</h1>
          <p className="text-body-lg text-glass-muted">{profile?.name}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-glass-text">Diet style</p>
          <div className="space-y-2">
            {DIET_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  selectedDiet === opt.value
                    ? 'border-brand-500 bg-brand-500/10'
                    : 'border-glass-border bg-glass-white'
                }`}
              >
                <input
                  type="radio"
                  name="dietStyle"
                  value={opt.value}
                  checked={selectedDiet === opt.value}
                  onChange={() => setSelectedDiet(opt.value)}
                  className="accent-brand-500"
                />
                <span className="text-glass-text font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="space-y-3">
          <button
            onClick={handleSaveDiet}
            disabled={saving || selectedDiet === profile?.dietStyle}
            className="w-full rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full rounded-lg border border-red-400/50 px-6 py-3 font-medium text-red-400 transition-colors hover:bg-red-400/10"
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  )
}
