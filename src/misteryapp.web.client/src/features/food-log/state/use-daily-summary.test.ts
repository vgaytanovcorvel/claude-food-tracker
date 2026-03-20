import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import { useDailySummary } from './use-daily-summary'

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

describe('useDailySummary', () => {
  it('useDailySummary_ShouldNotFetch_WhenUserIdIsNull', async () => {
    // Arrange
    const services = makeServices()
    const wrapper = makeWrapper(services)

    // Act
    renderHook(() => useDailySummary(null, '2024-01-15'), { wrapper })
    await act(async () => {})

    // Assert
    expect(services.foodLogService.getDailySummary).not.toHaveBeenCalled()
  })

  it('useDailySummary_ShouldReturnSummary_WhenUserIdProvided', async () => {
    // Arrange
    const mockSummary = {
      date: '2024-01-15',
      totalCalories: 350,
      onGoalCount: 1,
      conflictCount: 0,
      complianceLabel: '1 of 1 meals on goal',
    }
    const services = makeServices()
    vi.mocked(services.foodLogService.getDailySummary).mockResolvedValue(mockSummary as never)
    const wrapper = makeWrapper(services)

    // Act
    const { result } = renderHook(() => useDailySummary('1', '2024-01-15'), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalCalories).toBe(350)
  })
})
