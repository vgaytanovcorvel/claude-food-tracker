import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeverityBadge } from './severity-badge'

describe('SeverityBadge', () => {
  it('render_ShouldDisplayNoneLabel_WhenSeverityIsNone', () => {
    // Arrange
    const severity = 'None'

    // Act
    const { container } = render(<SeverityBadge severity={severity} />)

    // Assert
    expect(container.firstChild).toBeNull()
  })

  it('render_ShouldDisplayLowLabel_WhenSeverityIsLow', () => {
    // Arrange
    const severity = 'Low'

    // Act
    render(<SeverityBadge severity={severity} />)

    // Assert
    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('render_ShouldDisplayMediumLabel_WhenSeverityIsMedium', () => {
    // Arrange
    const severity = 'Medium'

    // Act
    render(<SeverityBadge severity={severity} />)

    // Assert
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('render_ShouldDisplayHighLabel_WhenSeverityIsHigh', () => {
    // Arrange
    const severity = 'High'

    // Act
    render(<SeverityBadge severity={severity} />)

    // Assert
    expect(screen.getByText('High')).toBeInTheDocument()
  })
})
