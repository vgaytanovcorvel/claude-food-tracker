import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import { useUpdateProfile } from './use-update-profile'

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

describe('useUpdateProfile', () => {
  it('useUpdateProfile_ShouldCallService_WhenUserIdProvided', async () => {
    // Arrange
    const services = makeServices()
    vi.mocked(services.userProfileService.updateProfile).mockResolvedValue(undefined as never)
    const wrapper = makeWrapper(services)

    // Act
    const { result } = renderHook(() => useUpdateProfile('1'), { wrapper })
    await act(async () => {
      await result.current.mutateAsync('Keto')
    })

    // Assert
    expect(services.userProfileService.updateProfile).toHaveBeenCalledWith(1, 'Keto')
  })

  it('useUpdateProfile_ShouldReject_WhenUserIdIsNull', async () => {
    // Arrange
    const services = makeServices()
    const wrapper = makeWrapper(services)

    // Act
    const { result } = renderHook(() => useUpdateProfile(null), { wrapper })
    let caughtError: Error | undefined
    await act(async () => {
      try {
        await result.current.mutateAsync('Keto')
      } catch (e) {
        caughtError = e as Error
      }
    })

    // Assert
    expect(caughtError?.message).toBe('No user session')
    expect(services.userProfileService.updateProfile).not.toHaveBeenCalled()
  })
})
