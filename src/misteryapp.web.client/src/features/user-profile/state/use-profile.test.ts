import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import { useProfile } from './use-profile'

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

describe('useProfile', () => {
  it('useProfile_ShouldNotFetch_WhenUserIdIsNull', async () => {
    // Arrange
    const services = makeServices()
    const wrapper = makeWrapper(services)

    // Act
    const { result } = renderHook(() => useProfile(null), { wrapper })
    await act(async () => {})

    // Assert
    expect(services.userProfileService.getProfile).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('useProfile_ShouldReturnProfile_WhenUserIdProvided', async () => {
    // Arrange
    const mockProfile = {
      id: 1,
      name: 'Test User',
      dietStyle: 'Mediterranean',
      createdAt: '2024-01-01T00:00:00Z',
      lastActiveAt: '2024-01-15T10:00:00Z',
    }
    const services = makeServices()
    vi.mocked(services.userProfileService.getProfile).mockResolvedValue(mockProfile as never)
    const wrapper = makeWrapper(services)

    // Act
    const { result } = renderHook(() => useProfile('1'), { wrapper })

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockProfile)
  })
})
