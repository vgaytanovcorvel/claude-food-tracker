import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplianceArc } from './compliance-arc'

describe('ComplianceArc', () => {
  it('render_ShouldDisplayRoundedPercentage_WhenRateProvided', () => {
    // Arrange
    const rate = 0.756

    // Act
    render(<ComplianceArc rate={rate} />)

    // Assert
    expect(screen.getByText('76%')).toBeInTheDocument()
  })

  it('render_ShouldDisplayComplianceCaption_WhenRendered', () => {
    // Arrange
    const rate = 0.5

    // Act
    render(<ComplianceArc rate={rate} />)

    // Assert
    expect(screen.getByText('compliance')).toBeInTheDocument()
  })

  it('render_ShouldDisplayZeroPercent_WhenRateIsZero', () => {
    // Arrange
    const rate = 0

    // Act
    render(<ComplianceArc rate={rate} />)

    // Assert
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('render_ShouldRenderOnlyTrackCircle_WhenRateIsZero', () => {
    // Arrange
    const rate = 0

    // Act
    const { container } = render(<ComplianceArc rate={rate} />)

    // Assert
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(1)
    expect(circles[0]).toHaveAttribute('stroke', 'var(--ring-track)')
  })

  it('render_ShouldRenderArcCircle_WhenRateIsGreaterThanZero', () => {
    // Arrange
    const rate = 0.6

    // Act
    const { container } = render(<ComplianceArc rate={rate} />)

    // Assert
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
    const arcCircle = circles[1]
    expect(arcCircle).toHaveAttribute('stroke', 'url(#arcGrad)')
  })
})
