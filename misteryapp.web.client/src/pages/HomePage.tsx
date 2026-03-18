import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'
import { getUserProfile } from '../api/userProfileApi'

function daysBetween(isoDateStr: string, today: Date): number {
  const [y, mo, d] = isoDateStr.split('-').map(Number)
  const past = new Date(y, mo - 1, d)
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.floor((todayMidnight.getTime() - past.getTime()) / (1000 * 60 * 60 * 24))
}

export default function HomePage() {
  const { userId } = useIdentity()
  const [greeting, setGreeting] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    const numericId = Number(userId)
    getUserProfile(numericId).then(profile => {
      if (!profile) return
      const today = new Date()
      const lastActive = profile.lastActiveAt
        ? profile.lastActiveAt.slice(0, 10)
        : profile.createdAt.slice(0, 10)
      const gap = daysBetween(lastActive, today)
      setGreeting(gap > 1 ? 'Welcome back. Ready to log?' : 'Good to see you.')
    }).catch(() => {
      setGreeting('Welcome back.')
    })
  }, [userId])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-surface-lg w-full max-w-md p-8 space-y-4">
        <h1 className="text-display-md text-glass-text">Food Habit Tracker</h1>
        <p className="text-body-lg text-glass-muted">
          {userId ? (greeting ?? 'Welcome back.') : 'Track your food habits.'}
        </p>
        {userId && (
          <div className="flex gap-4">
            <Link
              to="/food-log"
              className="inline-block text-brand-500 hover:underline text-sm"
            >
              Log food
            </Link>
            <Link
              to="/profile"
              className="inline-block text-brand-500 hover:underline text-sm"
            >
              Edit profile
            </Link>
            <Link
              to="/daily-log"
              className="inline-block text-brand-500 hover:underline text-sm"
            >
              Today's log
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
