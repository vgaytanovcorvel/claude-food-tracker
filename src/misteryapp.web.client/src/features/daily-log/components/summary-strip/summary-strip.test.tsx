import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SummaryStrip } from './summary-strip'

describe('SummaryStrip', () => {
  it('render_ShouldDisplayTotalCaloriesWithSuffix_WhenTotalCaloriesProvided', () => {
    // Arrange
    const totalCalories = 1450

    // Act
    render(<SummaryStrip totalCalories={totalCalories} complianceLabel="3 of 4 meals on goal" />)

    // Assert
    expect(screen.getByText('1450 kcal total')).toBeInTheDocument()
  })

  it('render_ShouldDisplayComplianceLabel_WhenComplianceLabelProvided', () => {
    // Arrange
    const complianceLabel = '3 of 4 meals on goal'

    // Act
    render(<SummaryStrip totalCalories={1450} complianceLabel={complianceLabel} />)

    // Assert
    expect(screen.getByText('3 of 4 meals on goal')).toBeInTheDocument()
  })

  it('render_ShouldDisplayZeroCaloriesWithSuffix_WhenTotalCaloriesIsZero', () => {
    // Arrange
    const totalCalories = 0

    // Act
    render(<SummaryStrip totalCalories={totalCalories} complianceLabel="No meals analysed yet" />)

    // Assert
    expect(screen.getByText('0 kcal total')).toBeInTheDocument()
  })
})
