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
      <div className="glass-modal w-full max-w-sm pt-[50px] px-10 pb-10 flex flex-col gap-8" style={{ animation: 'fadeinup 0.5s cubic-bezier(0.4,0,0.2,1) both' }}>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-display-md text-white font-extrabold tracking-tight">Food Habit Tracker</h1>
          <p className="text-white/55 text-sm">
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
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'linear-gradient(to bottom, #38bdf8, #0284c7)', boxShadow: '0 10px 25px -5px rgba(14,165,233,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Log Food
            </Link>

            {/* Ghost button */}
            <Link
              to="/daily-log"
              className="block w-full py-3 text-center rounded-xl text-white/70 text-sm font-medium transition-all duration-200 hover:bg-white/8 hover:text-white"
              style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'transparent' }}
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
