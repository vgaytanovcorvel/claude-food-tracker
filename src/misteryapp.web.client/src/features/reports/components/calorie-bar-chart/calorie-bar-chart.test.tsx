import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalorieBarChart } from './calorie-bar-chart'
import type { DailyCalorieSummary } from '../../../../domain/models'

function makeSummary(overrides: Partial<DailyCalorieSummary> = {}): DailyCalorieSummary {
  return {
    date: '2024-01-15',
    totalCalories: 500,
    onGoalCount: 1,
    conflictCount: 0,
    hasEntries: true,
    ...overrides,
  }
}

describe('CalorieBarChart', () => {
  it('render_ShouldRenderCorrectNumberOfBars_WhenDataProvided', () => {
    // Arrange
    const summaries = [
      makeSummary({ date: '2024-01-15' }),
      makeSummary({ date: '2024-01-16' }),
      makeSummary({ date: '2024-01-17' }),
    ]

    // Act
    const { container } = render(<CalorieBarChart summaries={summaries} />)

    // Assert — each bar has a [title] attribute
    const bars = container.querySelectorAll('[title]')
    expect(bars).toHaveLength(3)
  })

  it('render_ShouldRenderNoBars_WhenDataIsEmpty', () => {
    // Arrange
    const summaries: DailyCalorieSummary[] = []

    // Act
    const { container } = render(<CalorieBarChart summaries={summaries} />)

    // Assert
    const bars = container.querySelectorAll('[title]')
    expect(bars).toHaveLength(0)
  })

  it('render_ShouldGiveMaxBarFullHeight_WhenMaxValuePresent', () => {
    // Arrange
    const summaries = [
      makeSummary({ date: '2024-01-15', totalCalories: 1000 }),
      makeSummary({ date: '2024-01-16', totalCalories: 500 }),
    ]

    // Act
    render(<CalorieBarChart summaries={summaries} />)

    // Assert — the bar with 1000 kcal title exists, meaning it was rendered as the max
    expect(screen.getByTitle('2024-01-15: 1000 kcal')).toBeInTheDocument()
    expect(screen.getByTitle('2024-01-16: 500 kcal')).toBeInTheDocument()
  })

  it('render_ShouldShowNoEntriesTitle_WhenBarHasNoEntries', () => {
    // Arrange
    const summaries = [
      makeSummary({ date: '2024-01-15', hasEntries: false, totalCalories: 0 }),
    ]

    // Act
    render(<CalorieBarChart summaries={summaries} />)

    // Assert
    expect(screen.getByTitle('2024-01-15: no entries')).toBeInTheDocument()
  })

  it('render_ShouldRenderLabels_WhenLabelsProvided', () => {
    // Arrange
    const summaries = [
      makeSummary({ date: '2024-01-15' }),
      makeSummary({ date: '2024-01-16' }),
    ]
    const labels = ['Mon', 'Tue']

    // Act
    render(<CalorieBarChart summaries={summaries} labels={labels} />)

    // Assert
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
  })
})
