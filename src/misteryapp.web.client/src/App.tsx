import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './core/protected-route'
import { HomePage } from './features/home/containers/home-page'
import { OnboardingPage } from './features/user-profile/containers/onboarding-page'
import { ProfilePage } from './features/user-profile/containers/profile-page'
import FoodLoggingPage from './features/food-log/containers/food-logging-page'
import { DailyLogPage } from './features/daily-log/containers/daily-log-page'
import { WeeklyReportPage } from './features/reports/containers/weekly-report-page'
import { MonthlyReportPage } from './features/reports/containers/monthly-report-page'
import { BookmarksPage } from './features/bookmarks/containers/bookmarks-page'

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
