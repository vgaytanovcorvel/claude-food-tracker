import { Navigate } from 'react-router-dom'
import { useIdentity } from '../hooks/useIdentity'

export function ProtectedRoute({ element }: { element: React.ReactElement }) {
  const { userId } = useIdentity()
  return userId ? element : <Navigate to="/onboarding" replace />
}
