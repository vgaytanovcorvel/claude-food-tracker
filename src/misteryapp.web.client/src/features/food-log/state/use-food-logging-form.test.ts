import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { createElement, type ReactNode } from 'react'
import { ServicesProvider } from '../../../core/providers'
import type { Services } from '../../../core/providers'
import type { FoodEntry } from '../../../domain/models'
import { useFoodLoggingForm } from './use-food-logging-form'

const mockEntry: FoodEntry = {
  id: 10,
  userId: 1,
  foodName: 'Pasta',
  estimatedCalories: 400,
  loggedAt: '2024-01-15T12:00:00Z',
  source: 'Manual',
  analysisResult: null,
  imageBase64: null,
}

function makeServices(): Services {
  return {
    userProfileService: {
      getProfile: vi.fn(),
      createProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteProfile: vi.fn(),
    },
    foodLogService: {
      createEntry: vi.fn().mockResolvedValue(mockEntry),
      deleteEntry: vi.fn(),
      getDailyEntries: vi.fn().mockResolvedValue([]),
      getDailySummary: vi.fn().mockResolvedValue(null),
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
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      MemoryRouter,
      {},
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(ServicesProvider, { services }, children)
      )
    )
  }
}

describe('useFoodLoggingForm', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.setItem('misteryapp:userId', '1')
  })

  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('setFoodName_ShouldUpdateFoodName_WhenCalled', () => {
    // Arrange
    const services = makeServices()
    const { result } = renderHook(() => useFoodLoggingForm(), { wrapper: makeWrapper(services) })

    // Act
    act(() => {
      result.current.handleFoodNameChange('Pizza')
    })

    // Assert
    expect(result.current.foodName).toBe('Pizza')
  })

  it('setCalories_ShouldUpdateCalories_WhenCalled', () => {
    // Arrange
    const services = makeServices()
    const { result } = renderHook(() => useFoodLoggingForm(), { wrapper: makeWrapper(services) })

    // Act
    act(() => { result.current.setCalorieEditValue('500') })
    act(() => { result.current.handleCalorieConfirm() })

    // Assert
    expect(result.current.calories).toBe(500)
    expect(result.current.calorieUserEdited).toBe(true)
  })

  it('useFoodLoggingForm_ShouldHaveEmptyInitialState_WhenFirstRendered', () => {
    // Arrange
    const services = makeServices()

    // Act
    const { result } = renderHook(() => useFoodLoggingForm(), { wrapper: makeWrapper(services) })

    // Assert
    expect(result.current.foodName).toBe('')
    expect(result.current.calories).toBe(0)
    expect(result.current.saving).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.showAnalysisPhase).toBe(false)
  })

  it('handleFoodNameChange_ShouldResetAiIdentifiedFlag_WhenCalled', () => {
    // Arrange
    const services = makeServices()
    const { result } = renderHook(() => useFoodLoggingForm(), { wrapper: makeWrapper(services) })

    // Act
    act(() => {
      result.current.handleFoodNameChange('Burger')
    })

    // Assert
    expect(result.current.aiIdentified).toBe(false)
  })

  it('handleCaloriePillClick_ShouldExpandCalorieEditor_WhenCalled', () => {
    // Arrange
    const services = makeServices()
    const { result } = renderHook(() => useFoodLoggingForm(), { wrapper: makeWrapper(services) })

    // Act
    act(() => {
      result.current.handleCaloriePillClick()
    })

    // Assert
    expect(result.current.calorieExpanded).toBe(true)
  })

  it('handleSave_ShouldSetFoodNameError_WhenFoodNameIsEmpty', async () => {
    // Arrange
    const services = makeServices()
    const { result } = renderHook(() => useFoodLoggingForm(), { wrapper: makeWrapper(services) })

    // Act
    await act(async () => {
      await result.current.handleSave()
    })

    // Assert
    expect(result.current.error).toBe('Food name is required.')
  })

  it('handleSave_ShouldSetSessionError_WhenNoUserIdInStorage', async () => {
    // Arrange
    localStorage.clear()
    const services = makeServices()
    const { result } = renderHook(() => useFoodLoggingForm(), { wrapper: makeWrapper(services) })
    act(() => { result.current.handleFoodNameChange('Pasta') })

    // Act
    await act(async () => {
      await result.current.handleSave()
    })

    // Assert
    expect(result.current.error).toMatch(/no user session/i)
  })
})
