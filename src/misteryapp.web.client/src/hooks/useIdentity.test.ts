import { describe, it, expect, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIdentity } from './useIdentity'

const IDENTITY_KEY = 'misteryapp:userId'

afterEach(() => {
  localStorage.clear()
})

describe('useIdentity', () => {
  it('useIdentity_ShouldReturnNullUserId_WhenLocalStorageIsEmpty', () => {
    // Arrange — localStorage is empty (cleared in afterEach)

    // Act
    const { result } = renderHook(() => useIdentity())

    // Assert
    expect(result.current.userId).toBeNull()
  })

  it('useIdentity_ShouldReturnExistingUserId_WhenLocalStorageHasValue', () => {
    // Arrange
    localStorage.setItem(IDENTITY_KEY, '42')

    // Act
    const { result } = renderHook(() => useIdentity())

    // Assert
    expect(result.current.userId).toBe('42')
  })

  it('setUserId_ShouldUpdateUserId_WhenCalled', () => {
    // Arrange
    const { result } = renderHook(() => useIdentity())

    // Act
    act(() => {
      result.current.setUserId('99')
    })

    // Assert
    expect(result.current.userId).toBe('99')
  })

  it('setUserId_ShouldPersistToLocalStorage_WhenCalled', () => {
    // Arrange
    const { result } = renderHook(() => useIdentity())

    // Act
    act(() => {
      result.current.setUserId('7')
    })

    // Assert
    expect(localStorage.getItem(IDENTITY_KEY)).toBe('7')
  })

  it('clearIdentity_ShouldSetUserIdToNull_WhenCalled', () => {
    // Arrange
    const { result } = renderHook(() => useIdentity())
    act(() => {
      result.current.setUserId('5')
    })

    // Act
    act(() => {
      result.current.clearIdentity()
    })

    // Assert
    expect(result.current.userId).toBeNull()
  })

  it('clearIdentity_ShouldRemoveFromLocalStorage_WhenCalled', () => {
    // Arrange
    const { result } = renderHook(() => useIdentity())
    act(() => {
      result.current.setUserId('5')
    })

    // Act
    act(() => {
      result.current.clearIdentity()
    })

    // Assert
    expect(localStorage.getItem(IDENTITY_KEY)).toBeNull()
  })

  it('useIdentity_ShouldUpdateUserId_WhenStorageEventFired', () => {
    // Arrange
    const { result } = renderHook(() => useIdentity())

    // Act
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: IDENTITY_KEY, newValue: 'cross-tab-id' })
      )
    })

    // Assert
    expect(result.current.userId).toBe('cross-tab-id')
  })

  it('useIdentity_ShouldIgnoreStorageEvent_WhenKeyDoesNotMatch', () => {
    // Arrange
    const { result } = renderHook(() => useIdentity())

    // Act
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'other:key', newValue: 'ignored' })
      )
    })

    // Assert
    expect(result.current.userId).toBeNull()
  })
})
