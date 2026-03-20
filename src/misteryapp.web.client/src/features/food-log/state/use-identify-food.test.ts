import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import { useIdentifyFood } from './use-identify-food'

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

describe('useIdentifyFood', () => {
  it('useIdentifyFood_ShouldCallService_WhenMutated', async () => {
    // Arrange
    const mockIdentificationResult = { foodName: 'Apple', estimatedCalories: 95, confidenceLevel: 0.9 }
    const services = makeServices()
    vi.mocked(services.foodLogService.identifyFood).mockResolvedValue(mockIdentificationResult as never)
    const wrapper = makeWrapper(services)
    const mockFile = new File([], 'photo.jpg')

    // Act
    const { result } = renderHook(() => useIdentifyFood(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ image: mockFile, userId: 1 })
    })

    // Assert
    expect(services.foodLogService.identifyFood).toHaveBeenCalledWith(expect.any(File), 1, undefined)
  })
})
