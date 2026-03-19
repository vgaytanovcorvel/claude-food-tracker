import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import { getUserProfile } from '../api/userProfileApi'
import { getDailySummary } from '../api/foodLogApi'
import BottomNav from '../components/BottomNav'

const CALORIE_TARGET = 2000

function daysBetween(isoDateStr: string, today: Date): number {
  const [y, mo, d] = isoDateStr.split('-').map(Number)
  const past = new Date(y, mo - 1, d)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.floor((todayMidnight.getTime() - past.getTime()) / (1000 * 60 * 60 * 24))
}

function CalorieRing({ calories }: { calories: number }) {
  const r = 52
  const size = 140
  const cx = size / 2
  const circumference = 2 * Math.PI * r
  const progress = Math.min(calories / CALORIE_TARGET, 1)
  const offset = circumference * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${cx} ${cx})`}
          filter="url(#ringGlow)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)', filter: 'drop-shadow(0 0 8px #22d3ee) drop-shadow(0 0 4px #06b6d4)' }}
        />
        {/* Calories */}
        <text x={cx} y={cx - 8} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="32" fontWeight="800" fontFamily="Inter, sans-serif"
          style={{ filter: 'drop-shadow(0 0 10px rgba(34,211,238,0.65))' }}>
          {calories}
        </text>
        <text x={cx} y={cx + 14} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.4)" fontSize="11" fontFamily="Inter, sans-serif" letterSpacing="0.06em">
          / {CALORIE_TARGET} kcal
        </text>
      </svg>
      <p className="text-xs text-white/35 uppercase" style={{ letterSpacing: '0.22em' }}>Today's Calories</p>
    </div>
  )
}

export default function HomePage() {
  const { userId } = useIdentity()
  const [greeting, setGreeting] = useState<string | null>(null)
  const [calories, setCalories] = useState(0)

  useEffect(() => {
    if (!userId) return
    const numericId = Number(userId)

    getUserProfile(numericId).then(profile => {
      if (!profile) return
      const today = new Date()
      const lastActive = profile.lastActiveAt
        ? profile.lastActiveAt.slice(0, 10)
        : profile.createdAt.slice(0, 10)
      setGreeting(daysBetween(lastActive, today) > 1 ? 'Welcome back. Ready to log?' : 'Good to see you.')
    }).catch(() => setGreeting('Welcome back.'))

    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    getDailySummary(numericId, dateStr).then(s => { if (s) setCalories(s.totalCalories) }).catch(() => {})
  }, [userId])

  return (
    <div className="flex min-h-screen items-center justify-center p-6 pb-24">
      <div className="glass-modal w-full max-w-sm pt-[50px] px-10 pb-10 flex flex-col gap-8" style={{ animation: 'fadeinup 0.5s cubic-bezier(0.4,0,0.2,1) both' }}>

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-display-md text-white font-extrabold tracking-tight">Food Habit Tracker</h1>
          <p className="text-white/55 text-sm">
            {userId ? (greeting ?? 'Welcome back.') : 'Track your food habits.'}
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
