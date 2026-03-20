import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import { useCreateBookmark } from './use-create-bookmark'

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

describe('useCreateBookmark', () => {
  it('useCreateBookmark_ShouldCallService_WhenMutated', async () => {
    // Arrange
    const mockBookmark = {
      id: 1,
      userId: 1,
      alternativeFoodName: 'Salad',
      imageBase64: null,
      mimeType: null,
      createdAt: '2024-01-15T00:00:00Z',
    }
    const services = makeServices()
    vi.mocked(services.bookmarkService.createBookmark).mockResolvedValue(mockBookmark as never)
    const wrapper = makeWrapper(services)

    // Act
    const { result } = renderHook(() => useCreateBookmark('1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ userId: 1, alternativeFoodName: 'Salad', imageBase64: null, mimeType: null })
    })

    // Assert
    expect(services.bookmarkService.createBookmark).toHaveBeenCalledWith(1, 'Salad', null, null)
  })
})
