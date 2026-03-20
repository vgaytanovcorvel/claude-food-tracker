import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './protected-route'

const IDENTITY_KEY = 'misteryapp:userId'

afterEach(() => {
  localStorage.clear()
})

function renderProtectedRoute(userId: string | null) {
  if (userId) localStorage.setItem(IDENTITY_KEY, userId)
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/protected" element={<ProtectedRoute element={<div>Protected Content</div>} />} />
        <Route path="/onboarding" element={<div>Onboarding</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('render_ShouldRenderElement_WhenUserIdExists', () => {
    // Arrange
    const userId = '1'

    // Act
    renderProtectedRoute(userId)

    // Assert
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('render_ShouldRedirectToOnboarding_WhenUserIdIsNull', () => {
    // Arrange — no userId

    // Act
    renderProtectedRoute(null)

    // Assert
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
  })

  it('render_ShouldRedirectToOnboarding_WhenUserIdIsEmptyString', () => {
    // Arrange — empty string is falsy; localStorage.setItem with '' still sets the key
    localStorage.setItem('misteryapp:userId', '')

    // Act
    renderProtectedRoute(null)  // renderProtectedRoute(null) won't overwrite, key already set to ''

    // Assert
    expect(screen.getByText('Onboarding')).toBeInTheDocument()
  })
})
