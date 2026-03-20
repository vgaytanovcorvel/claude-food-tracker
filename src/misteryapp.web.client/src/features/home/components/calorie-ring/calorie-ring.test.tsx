import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalorieRing } from './calorie-ring'

describe('CalorieRing', () => {
  it('render_ShouldDisplayCalorieCount_WhenCaloriesProvided', () => {
    // Arrange
    const calories = 1200

    // Act
    render(<CalorieRing calories={calories} />)

    // Assert
    expect(screen.getByText('1200')).toBeInTheDocument()
  })

  it('render_ShouldDisplayCalorieTarget_WhenRendered', () => {
    // Arrange
    const calories = 800

    // Act
    render(<CalorieRing calories={calories} />)

    // Assert
    expect(screen.getByText('/ 2000 kcal')).toBeInTheDocument()
  })

  it('render_ShouldDisplayTodaysCaloriesCaption_WhenRendered', () => {
    // Arrange
    const calories = 500

    // Act
    render(<CalorieRing calories={calories} />)

    // Assert
    expect(screen.getByText("Today's Calories")).toBeInTheDocument()
  })
})
