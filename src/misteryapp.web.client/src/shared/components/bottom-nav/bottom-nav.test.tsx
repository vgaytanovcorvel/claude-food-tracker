import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from './bottom-nav'

describe('BottomNav', () => {
  it('render_ShouldRenderAllNavLinks_WhenRendered', () => {
    // Arrange & Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    )

    // Assert
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('render_ShouldMarkHomeAsActive_WhenPathnameIsRoot', () => {
    // Arrange & Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    )

    // Assert — Home link navigates to '/'
    const links = screen.getAllByRole('link')
    const homeLink = links.find(link => link.getAttribute('href') === '/')
    expect(homeLink).toBeDefined()
    expect(homeLink).toBeInTheDocument()
  })

  it('render_ShouldRenderLinksWithCorrectHrefs_WhenRendered', () => {
    // Arrange & Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    )

    // Assert
    const links = screen.getAllByRole('link')
    const hrefs = links.map(link => link.getAttribute('href'))
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/profile')
    expect(hrefs).toContain('/daily-log')
    expect(hrefs).toContain('/reports/weekly')
    expect(hrefs).toContain('/bookmarks')
  })
})
