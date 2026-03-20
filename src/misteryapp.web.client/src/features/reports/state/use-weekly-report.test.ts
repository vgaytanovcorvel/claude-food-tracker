import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import { useWeeklyReport } from './use-weekly-report'

function makeServices(): Services {
  return {
    userProfileService: {
      getProfile: vi.fn(),
      createProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteProfile: vi.fn(),
    },
    foodLogService: {
      createEntry: vi.fn(),
      deleteEntry: vi.fn(),
      getDailyEntries: vi.fn(),
      getDailySummary: vi.fn(),
      identifyFood: vi.fn(),
      analyseEntry: vi.fn(),
      analysePreview: vi.fn(),
      patchAnalysis: vi.fn(),
      suggestAlternative: vi.fn(),
      suggestAlternativeByName: vi.fn(),
      getAlternativeImage: vi.fn(),
      getImageForFoodName: vi.fn(),
    },
    reportService: {
      getWeeklyReport: vi.fn(),
      getMonthlyReport: vi.fn(),
    },
    bookmarkService: {
      getBookmarks: vi.fn(),
      createBookmark: vi.fn(),
      deleteBookmark: vi.fn(),
    },
  }
}

function makeWrapper(services: Services) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ServicesProvider, { services }, children)
    )
  }
}

describe('useWeeklyReport', () => {
  it('useWeeklyReport_ShouldNotFetch_WhenUserIdIsNull', async () => {
    // Arrange
    const services = makeServices()
    const wrapper = makeWrapper(services)

    // Act
    renderHook(() => useWeeklyReport(null, '2024-01-15'), { wrapper })
    await act(async () => {})

    // Assert
    expect(services.reportService.getWeeklyReport).not.toHaveBeenCalled()
  })

  it('useWeeklyReport_ShouldReturnReport_WhenUserIdProvided', async () => {
    // Arrange
    const mockWeeklyReport = {
      weekStart: '2024-01-15',
      weekEnd: '2024-01-21',
      dailySummaries: [],
      totalCalories: 0,
      complianceRate: 0,
      patternInsight: null,
      motivatingCopy: 'Keep going!',
    }
    const services = makeServices()
    vi.mocked(services.reportService.getWeeklyReport).mockResolvedValue(mockWeeklyReport as never)
    const wrapper = makeWrapper(services)

    // Act
    const { result } = renderHook(() => useWeeklyReport('1', '2024-01-15'), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.motivatingCopy).toBe('Keep going!')
  })
})
