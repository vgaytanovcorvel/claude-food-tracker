import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import { WeeklyReportPage } from '../containers/weekly-report-page'

function makeServices(overrides: Partial<Services> = {}): Services {
  return {
    userProfileService: {
      getProfile: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Test User',
        dietStyle: 'Mediterranean',
        createdAt: '2024-01-01T00:00:00Z',
        lastActiveAt: '2024-01-15T10:00:00Z',
      }),
      createProfile: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Test User',
        dietStyle: 'Keto',
        createdAt: '2024-01-01T00:00:00Z',
        lastActiveAt: null,
      }),
      updateProfile: vi.fn().mockResolvedValue({
        id: 1,
        name: 'Test User',
        dietStyle: 'Keto',
        createdAt: '2024-01-01T00:00:00Z',
        lastActiveAt: null,
      }),
      deleteProfile: vi.fn().mockResolvedValue(undefined),
    },
    foodLogService: {
      createEntry: vi.fn().mockResolvedValue({
        id: 10,
        userId: 1,
        foodName: 'Chicken',
        estimatedCalories: 350,
        loggedAt: '2024-01-15T12:00:00Z',
        source: 'Manual',
        analysisResult: null,
        imageBase64: null,
      }),
      deleteEntry: vi.fn().mockResolvedValue(undefined),
      getDailyEntries: vi.fn().mockResolvedValue([{
        id: 10,
        userId: 1,
        foodName: 'Grilled Chicken',
        estimatedCalories: 350,
        loggedAt: '2024-01-15T12:00:00Z',
        source: 'Manual',
        analysisResult: null,
        imageBase64: null,
      }]),
      getDailySummary: vi.fn().mockResolvedValue({
        date: '2024-01-15',
        totalCalories: 350,
        onGoalCount: 1,
        conflictCount: 0,
        complianceLabel: '1 of 1 meals on goal',
      }),
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
      getWeeklyReport: vi.fn().mockResolvedValue({
        weekStart: '2024-01-15',
        weekEnd: '2024-01-21',
        dailySummaries: [],
        totalCalories: 1750,
        complianceRate: 0.8,
        patternInsight: null,
        motivatingCopy: 'Keep going!',
      }),
      getMonthlyReport: vi.fn().mockResolvedValue({
        monthStart: '2024-01-01',
        monthEnd: '2024-01-31',
        dailySummaries: [],
        totalCalories: 7500,
        complianceRate: 0.75,
        patternInsight: null,
        motivatingCopy: 'Great month!',
      }),
    },
    bookmarkService: {
      getBookmarks: vi.fn().mockResolvedValue([{
        id: 1,
        userId: 1,
        alternativeFoodName: 'Salad',
        imageBase64: null,
        mimeType: null,
        createdAt: '2024-01-15T00:00:00Z',
      }]),
      createBookmark: vi.fn().mockResolvedValue({
        id: 2,
        userId: 1,
        alternativeFoodName: 'Fruit Bowl',
        imageBase64: null,
        mimeType: null,
        createdAt: '2024-01-15T00:00:00Z',
      }),
      deleteBookmark: vi.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  }
}

function renderPage(services: Services) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
  return render(
    <MemoryRouter initialEntries={['/reports/weekly']}>
      <QueryClientProvider client={queryClient}>
        <ServicesProvider services={services}>
          <Routes>
            <Route path="/reports/weekly" element={<WeeklyReportPage />} />
            <Route path="/reports/monthly" element={<div>Monthly Report Page</div>} />
          </Routes>
        </ServicesProvider>
      </QueryClientProvider>
    </MemoryRouter>
  )
}

afterEach(() => {
  localStorage.clear()
})

describe('WeeklyReportPage', () => {
  it('render_ShouldShowTitle_WhenRendered', () => {
    // Arrange
    localStorage.setItem('misteryapp:userId', '1')
    const services = makeServices()

    // Act
    renderPage(services)

    // Assert
    expect(screen.getByText('Weekly Report')).toBeInTheDocument()
  })

  it('render_ShouldShowMotivatingCopy_WhenReportLoaded', async () => {
    // Arrange
    localStorage.setItem('misteryapp:userId', '1')
    const services = makeServices()
    services.reportService.getWeeklyReport = vi.fn().mockResolvedValue({
      weekStart: '2024-01-15',
      weekEnd: '2024-01-21',
      dailySummaries: [],
      totalCalories: 1750,
      complianceRate: 0.8,
      patternInsight: null,
      motivatingCopy: 'Keep going!',
    })

    // Act
    renderPage(services)

    // Assert
    await waitFor(() => expect(screen.getByText('Keep going!')).toBeInTheDocument())
  })

  it('render_ShouldShowError_WhenFetchFails', async () => {
    // Arrange
    localStorage.setItem('misteryapp:userId', '1')
    const services = makeServices()
    services.reportService.getWeeklyReport = vi.fn().mockRejectedValue(new Error('Network error'))

    // Act
    renderPage(services)

    // Assert
    await waitFor(() =>
      expect(screen.getByText(/failed to load report/i)).toBeInTheDocument()
    )
  })

  it('render_ShouldShowTotalCalories_WhenReportLoaded', async () => {
    // Arrange
    localStorage.setItem('misteryapp:userId', '1')
    const services = makeServices()
    services.reportService.getWeeklyReport = vi.fn().mockResolvedValue({
      weekStart: '2024-01-15',
      weekEnd: '2024-01-21',
      dailySummaries: [],
      totalCalories: 1750,
      complianceRate: 0.8,
      patternInsight: null,
      motivatingCopy: 'Keep going!',
    })

    // Act
    renderPage(services)

    // Assert
    await waitFor(() => expect(screen.getByText('1750 kcal total')).toBeInTheDocument())
  })
})
