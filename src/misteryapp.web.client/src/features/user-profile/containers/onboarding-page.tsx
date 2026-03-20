import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DietStyle } from '../../../domain/models'
import { useIdentity } from '../../../hooks/useIdentity'
import { useServices } from '../../../core/providers'
import { DietPicker } from '../components/diet-picker/diet-picker'

const DIET_OPTIONS: { value: DietStyle; label: string; description: string }[] = [
  { value: 'Keto', label: 'Keto', description: 'Low-carb, high-fat' },
  { value: 'LowFat', label: 'Low Fat', description: 'Reduced fat intake' },
  { value: 'Mediterranean', label: 'Mediterranean', description: 'Balanced, plant-forward' },
]

export function OnboardingPage() {
  const navigate = useNavigate()
  const { setUserId } = useIdentity()
  const { userProfileService } = useServices()
  const [name, setName] = useState('')
  const [dietStyle, setDietStyle] = useState<DietStyle>('Keto')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    setLoading(true)
    setError(null)
    try {
      const profile = await userProfileService.createProfile(name.trim(), dietStyle)
      setUserId(String(profile.id))
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-modal w-full max-w-md p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-display-md text-glass-text">Welcome</h1>
          <p className="text-body-lg text-glass-muted">Set up your profile to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="field-label" htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="input-glass"
            />
          </div>

          <div className="space-y-2">
            <span className="field-label">Diet style</span>
            <DietPicker value={dietStyle} onChange={setDietStyle} options={DIET_OPTIONS} />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Creating...' : 'Get started'}
          </button>
        </form>
      </div>
    </div>
  )
}
