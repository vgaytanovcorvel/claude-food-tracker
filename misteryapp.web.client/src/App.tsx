import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useIdentity } from './hooks/useIdentity'
import HomePage from './pages/HomePage'
import OnboardingPage from './pages/OnboardingPage'
import ProfilePage from './pages/ProfilePage'
import FoodLoggingPage from './pages/FoodLoggingPage'

function ProtectedRoute({ element }: { element: React.ReactElement }) {
  const { userId } = useIdentity()
  return userId ? element : <Navigate to="/onboarding" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
        <Route path="/food-log" element={<ProtectedRoute element={<FoodLoggingPage />} />} />
        <Route path="/" element={<ProtectedRoute element={<HomePage />} />} />
      </Routes>
    </BrowserRouter>
  )
}
