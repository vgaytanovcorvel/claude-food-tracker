import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { useIdentity } from './hooks/useIdentity'
import HomePage from './pages/HomePage'
import OnboardingPage from './pages/OnboardingPage'
import ProfilePage from './pages/ProfilePage'
import FoodLoggingPage from './pages/FoodLoggingPage'
import DailyLogPage from './pages/DailyLogPage'
import WeeklyReportPage from './pages/WeeklyReportPage'
import MonthlyReportPage from './pages/MonthlyReportPage'
import BookmarksPage from './pages/BookmarksPage'

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
        <Route path="/daily-log" element={<ProtectedRoute element={<DailyLogPage />} />} />
        <Route path="/reports/weekly" element={<ProtectedRoute element={<WeeklyReportPage />} />} />
        <Route path="/reports/monthly" element={<ProtectedRoute element={<MonthlyReportPage />} />} />
        <Route path="/bookmarks" element={<ProtectedRoute element={<BookmarksPage />} />} />
        <Route path="/" element={<ProtectedRoute element={<HomePage />} />} />
      </Routes>
    </BrowserRouter>
  )
}
