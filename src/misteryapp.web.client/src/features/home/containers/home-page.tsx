import { Link } from 'react-router-dom'
import { useIdentity } from '../../../hooks/useIdentity'
import { useProfile } from '../../user-profile/state/use-profile'
import { useDailySummary } from '../../food-log/state/use-daily-summary'
import { CalorieRing } from '../components/calorie-ring/calorie-ring'
import { BottomNav } from '../../../shared/components/bottom-nav/bottom-nav'

function daysBetween(isoDateStr: string, today: Date): number {
  const [y, mo, d] = isoDateStr.split('-').map(Number)
  const past = new Date(y, mo - 1, d)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.floor((todayMidnight.getTime() - past.getTime()) / (1000 * 60 * 60 * 24))
}

function todayDateString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function deriveGreeting(profile: { lastActiveAt: string | null; createdAt: string } | null | undefined): string {
  if (!profile) return 'Welcome back.'
  const today = new Date()
  const lastActive = profile.lastActiveAt
    ? profile.lastActiveAt.slice(0, 10)
    : profile.createdAt.slice(0, 10)
  return daysBetween(lastActive, today) > 1 ? 'Welcome back. Ready to log?' : 'Good to see you.'
}

export function HomePage() {
  const { userId } = useIdentity()
  const todayStr = todayDateString()
  const { data: profile } = useProfile(userId)
  const { data: summary } = useDailySummary(userId, todayStr)

  const calories = summary?.totalCalories ?? 0
  const greeting = deriveGreeting(profile)

  return (
    <div className="flex min-h-screen items-center justify-center p-6 pb-24">
      <div
        className="glass-modal w-full max-w-sm pt-[50px] px-10 pb-10 flex flex-col gap-8 animate-fadeinup"
      >
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-display-md text-white font-extrabold tracking-tight">Food Habit Tracker</h1>
          <p className="text-sm text-white-55">
            {userId ? greeting : 'Track your food habits.'}
          </p>
        </div>

        {/* Calorie ring */}
        {userId && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <CalorieRing calories={calories} />
          </div>
        )}

        {/* Actions */}
        {userId && (
          <div className="space-y-3">
            {/* Primary CTA */}
            <Link
              to="/food-log"
              className="btn-primary flex items-center justify-center gap-2 w-full py-3.5 rounded-xl"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Log Food
            </Link>

            {/* Ghost button */}
            <Link
              to="/daily-log"
              className="btn-ghost block w-full py-3 text-center text-white-70"
            >
              Today's Log
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
