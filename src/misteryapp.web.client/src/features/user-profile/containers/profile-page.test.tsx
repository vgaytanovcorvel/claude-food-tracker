import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import { ProfilePage } from './profile-page'

function makeServices(): Services {
  return {
    userProfileService: {
      getProfile: vi.fn().mockResolvedValue({
        id: 1, name: 'Test User', dietStyle: 'Mediterranean',
        createdAt: '2024-01-01T00:00:00Z', lastActiveAt: '2024-01-15T10:00:00Z',
      }),
      createProfile: vi.fn().mockResolvedValue({
        id: 1, name: 'Alex', dietStyle: 'Keto',
        createdAt: '2024-01-01T00:00:00Z', lastActiveAt: null,
      }),
      updateProfile: vi.fn().mockResolvedValue({
        id: 1, name: 'Test User', dietStyle: 'Keto',
        createdAt: '2024-01-01T00:00:00Z', lastActiveAt: null,
      }),
      deleteProfile: vi.fn().mockResolvedValue(undefined),
    },
    foodLogService: {
      createEntry: vi.fn().mockResolvedValue({ id: 10, userId: 1, foodName: 'Chicken', estimatedCalories: 350, loggedAt: '2024-01-15T12:00:00Z', source: 'Manual', analysisResult: null, imageBase64: null }),
      deleteEntry: vi.fn().mockResolvedValue(undefined),
      getDailyEntries: vi.fn().mockResolvedValue([]),
      getDailySummary: vi.fn().mockResolvedValue({ date: '2024-01-15', totalCalories: 0, onGoalCount: 0, conflictCount: 0, complianceLabel: 'No meals analysed yet' }),
      identifyFood: vi.fn().mockResolvedValue(null),
      analyseEntry: vi.fn().mockResolvedValue(null),
      analysePreview: vi.fn().mockResolvedValue(null),
      patchAnalysis: vi.fn().mockResolvedValue(undefined),
      suggestAlternative: vi.fn().mockResolvedValue(null),
      suggestAlternativeByName: vi.fn().mockResolvedValue(null),
      getAlternativeImage: vi.fn().mockResolvedValue(null),
      getImageForFoodName: vi.fn().mockResolvedValue(null),
    },
    reportService: {
      getWeeklyReport: vi.fn().mockResolvedValue({ weekStart: '2024-01-15', weekEnd: '2024-01-21', dailySummaries: [], totalCalories: 0, complianceRate: 0, patternInsight: null, motivatingCopy: 'Keep going!' }),
      getMonthlyReport: vi.fn().mockResolvedValue({ monthStart: '2024-01-01', monthEnd: '2024-01-31', dailySummaries: [], totalCalories: 0, complianceRate: 0, patternInsight: null, motivatingCopy: 'Great month!' }),
    },
    bookmarkService: {
      getBookmarks: vi.fn().mockResolvedValue([]),
      createBookmark: vi.fn().mockResolvedValue({ id: 1, userId: 1, alternativeFoodName: 'Salad', imageBase64: null, mimeType: null, createdAt: '2024-01-15T00:00:00Z' }),
      deleteBookmark: vi.fn().mockResolvedValue(undefined),
    },
  }
}

function renderProfilePage(services: Services) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <QueryClientProvider client={queryClient}>
        <ServicesProvider services={services}>
          <Routes>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/onboarding" element={<div>Onboarding</div>} />
          </Routes>
        </ServicesProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('ProfilePage', () => {
  it('render_ShouldRedirectToOnboarding_WhenNoUserId', () => {
    // Arrange
    // No localStorage userId set
    const services = makeServices()

    // Act
    renderProfilePage(services)

    // Assert
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
  })

  it('render_ShouldShowProfileTitle_WhenUserIdPresent', async () => {
    // Arrange
    localStorage.setItem('misteryapp:userId', '1')
    const services = makeServices()

    // Act
    renderProfilePage(services)

    // Assert
    await waitFor(() =>
      expect(screen.getByText('Your Profile')).toBeInTheDocument()
    )
  })

  it('render_ShouldShowProfileName_WhenDataLoaded', async () => {
    // Arrange
    localStorage.setItem('misteryapp:userId', '1')
    const services = makeServices()
    vi.mocked(services.userProfileService.getProfile).mockResolvedValue({
      id: 1, name: 'Test User', dietStyle: 'Mediterranean',
      createdAt: '2024-01-01T00:00:00Z', lastActiveAt: '2024-01-15T10:00:00Z',
    })

    // Act
    renderProfilePage(services)

    // Assert
    await waitFor(() =>
      expect(screen.getByText('Test User')).toBeInTheDocument()
    )
  })

  it('handleLogOut_ShouldNavigateToOnboarding_WhenClicked', async () => {
    // Arrange
    localStorage.setItem('misteryapp:userId', '1')
    const services = makeServices()
    renderProfilePage(services)

    // Act
    await waitFor(() => screen.getByText('Log out'))
    fireEvent.click(screen.getByText('Log out'))

    // Assert
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
  })

  it('render_ShouldShowSaveButton_WhenProfileLoaded', async () => {
    // Arrange
    localStorage.setItem('misteryapp:userId', '1')
    const services = makeServices()

    // Act
    renderProfilePage(services)

    // Assert
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    )
  })
})
