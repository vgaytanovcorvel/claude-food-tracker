import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import { useLogFood } from './use-log-food'

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

describe('useLogFood', () => {
  it('useLogFood_ShouldCallService_WhenMutated', async () => {
    // Arrange
    const mockEntry = {
      id: 10,
      userId: 1,
      foodName: 'Pasta',
      estimatedCalories: 400,
      loggedAt: '2024-01-15T12:00:00Z',
      source: 'Manual',
      analysisResult: null,
      imageBase64: null,
    }
    const services = makeServices()
    vi.mocked(services.foodLogService.createEntry).mockResolvedValue(mockEntry as never)
    const wrapper = makeWrapper(services)

    // Act
    const { result } = renderHook(() => useLogFood('1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ userId: 1, foodName: 'Pasta', estimatedCalories: 400, source: 'Manual', imageBase64: null })
    })

    // Assert
    expect(services.foodLogService.createEntry).toHaveBeenCalledWith(1, 'Pasta', 400, 'Manual', null)
  })
})
