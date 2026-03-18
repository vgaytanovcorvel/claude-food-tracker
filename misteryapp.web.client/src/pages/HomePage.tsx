import { Link } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'

export default function HomePage() {
  const { userId } = useIdentity()

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-surface-lg w-full max-w-md p-8 space-y-4">
        <h1 className="text-display-md text-glass-text">Food Habit Tracker</h1>
        <p className="text-body-lg text-glass-muted">
          {userId ? 'Welcome back.' : 'Track your food habits.'}
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
