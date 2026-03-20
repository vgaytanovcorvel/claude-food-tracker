import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import type { AnalysisPreviewResult } from '../../../domain/models'
import { useAnalysePreview } from './use-analyse-preview'

const mockPreviewResult: AnalysisPreviewResult = {
  compatible: true,
  severity: 'None',
  educationText: null,
  alternativeFoodName: null,
  estimatedCalories: 300,
}

function makeServices(analysePreviewMock: ReturnType<typeof vi.fn>): Services {
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
      analysePreview: analysePreviewMock,
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
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ServicesProvider, { services }, children)
    )
  }
}

describe('useAnalysePreview', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('analysePreview_ShouldNotFireImmediately_WhenDebounceDelayIs1200ms', () => {
    // Arrange
    const analysePreviewMock = vi.fn().mockResolvedValue(mockPreviewResult)
    const services = makeServices(analysePreviewMock)
    const immediateRef = { current: false }

    // Act
    renderHook(
      () => useAnalysePreview({ foodName: 'Pasta', userId: '1', immediateRef }),
      { wrapper: makeWrapper(services) }
    )
    act(() => { vi.advanceTimersByTime(1100) })

    // Assert
    expect(analysePreviewMock).not.toHaveBeenCalled()
  })

  it('analysePreview_ShouldFireAfterDebounce_WhenDelayElapses', async () => {
    // Arrange
    const analysePreviewMock = vi.fn().mockResolvedValue(mockPreviewResult)
    const services = makeServices(analysePreviewMock)
    const immediateRef = { current: false }

    // Act
    renderHook(
      () => useAnalysePreview({ foodName: 'Pasta', userId: '1', immediateRef }),
      { wrapper: makeWrapper(services) }
    )
    await act(async () => {
      vi.advanceTimersByTime(1200)
    })

    // Assert
    expect(analysePreviewMock).toHaveBeenCalledTimes(1)
    expect(analysePreviewMock).toHaveBeenCalledWith('Pasta', 1, expect.any(AbortSignal))
  })

  it('analysePreview_ShouldFireImmediately_WhenImmediateRefIsTrue', async () => {
    // Arrange
    const analysePreviewMock = vi.fn().mockResolvedValue(mockPreviewResult)
    const services = makeServices(analysePreviewMock)
    const immediateRef = { current: true }

    // Act
    renderHook(
      () => useAnalysePreview({ foodName: 'Apple', userId: '1', immediateRef }),
      { wrapper: makeWrapper(services) }
    )
    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    // Assert
    expect(analysePreviewMock).toHaveBeenCalledTimes(1)
    expect(analysePreviewMock).toHaveBeenCalledWith('Apple', 1, expect.any(AbortSignal))
  })

  it('clearPreview_ShouldResetPreviewResult_WhenCalled', async () => {
    // Arrange
    const analysePreviewMock = vi.fn().mockResolvedValue(mockPreviewResult)
    const services = makeServices(analysePreviewMock)
    const immediateRef = { current: false }

    const { result } = renderHook(
      () => useAnalysePreview({ foodName: 'Salad', userId: '1', immediateRef }),
      { wrapper: makeWrapper(services) }
    )
    await act(async () => {
      vi.advanceTimersByTime(1200)
    })

    expect(result.current.previewResult).toEqual(mockPreviewResult)

    // Act
    act(() => {
      result.current.clearPreview()
    })

    // Assert
    expect(result.current.previewResult).toBeNull()
    expect(result.current.previewedFoodName).toBe('')
    expect(result.current.previewLoading).toBe(false)
  })

  it('analysePreview_ShouldNotFire_WhenFoodNameIsTooShort', async () => {
    // Arrange
    const analysePreviewMock = vi.fn().mockResolvedValue(mockPreviewResult)
    const services = makeServices(analysePreviewMock)
    const immediateRef = { current: false }

    // Act
    renderHook(
      () => useAnalysePreview({ foodName: 'Hi', userId: '1', immediateRef }),
      { wrapper: makeWrapper(services) }
    )
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    // Assert
    expect(analysePreviewMock).not.toHaveBeenCalled()
  })

  it('analysePreview_ShouldNotFire_WhenUserIdIsNull', async () => {
    // Arrange
    const analysePreviewMock = vi.fn().mockResolvedValue(mockPreviewResult)
    const services = makeServices(analysePreviewMock)
    const immediateRef = { current: false }

    // Act
    renderHook(
      () => useAnalysePreview({ foodName: 'Pasta', userId: null, immediateRef }),
      { wrapper: makeWrapper(services) }
    )
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })

    // Assert
    expect(analysePreviewMock).not.toHaveBeenCalled()
  })
})
