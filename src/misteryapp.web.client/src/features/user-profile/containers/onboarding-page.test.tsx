import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import { OnboardingPage } from './onboarding-page'

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

function renderOnboarding(services: Services) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <QueryClientProvider client={queryClient}>
        <ServicesProvider services={services}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/" element={<div>Home Page</div>} />
          </Routes>
        </ServicesProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

afterEach(() => {
  localStorage.clear()
})

describe('OnboardingPage', () => {
  it('render_ShouldShowWelcomeTitle_WhenRendered', () => {
    // Arrange
    const services = makeServices()

    // Act
    renderOnboarding(services)

    // Assert
    expect(screen.getByText('Welcome')).toBeInTheDocument()
  })

  it('render_ShouldShowGetStartedButton_WhenRendered', () => {
    // Arrange
    const services = makeServices()

    // Act
    renderOnboarding(services)

    // Assert
    expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument()
  })

  it('handleSubmit_ShouldShowError_WhenNameIsEmpty', () => {
    // Arrange
    const services = makeServices()
    renderOnboarding(services)

    // Act
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))

    // Assert
    expect(screen.getByText('Name is required.')).toBeInTheDocument()
  })

  it('handleSubmit_ShouldCallCreateProfile_WhenNameAndDietEntered', async () => {
    // Arrange
    const services = makeServices()
    renderOnboarding(services)
    const nameInput = screen.getByLabelText('Your name')

    // Act
    fireEvent.change(nameInput, { target: { value: 'Alex' } })
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))

    // Assert
    await waitFor(() =>
      expect(services.userProfileService.createProfile).toHaveBeenCalledWith('Alex', 'Keto')
    )
  })

  it('handleSubmit_ShouldNavigateHome_WhenProfileCreated', async () => {
    // Arrange
    const services = makeServices()
    renderOnboarding(services)
    const nameInput = screen.getByLabelText('Your name')

    // Act
    fireEvent.change(nameInput, { target: { value: 'Alex' } })
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))

    // Assert
    await waitFor(() =>
      expect(screen.getByText('Home Page')).toBeInTheDocument()
    )
  })
})
