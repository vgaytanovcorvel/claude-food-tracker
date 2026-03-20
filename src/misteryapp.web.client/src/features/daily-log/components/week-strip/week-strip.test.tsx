import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WeekStrip } from './week-strip'

describe('WeekStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('render_ShouldRenderSevenDayButtons_WhenDateProvided', () => {
    // Arrange
    const onDateChange = vi.fn()

    // Act
    render(<WeekStrip date="2024-01-15" onDateChange={onDateChange} />)

    // Assert
    expect(screen.getAllByRole('button')).toHaveLength(7)
  })

  it('render_ShouldMarkSelectedDayAsPressed_WhenDateMatches', () => {
    // Arrange
    const onDateChange = vi.fn()

    // Act
    render(<WeekStrip date="2024-01-15" onDateChange={onDateChange} />)

    // Assert
    const selectedButton = screen.getByRole('button', { name: '2024-01-15' })
    expect(selectedButton).toHaveAttribute('aria-pressed', 'true')

    const otherButton = screen.getByRole('button', { name: '2024-01-16' })
    expect(otherButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('render_ShouldCallOnDateChange_WhenDayButtonClicked', async () => {
    // Arrange
    const onDateChange = vi.fn()

    // Act
    render(<WeekStrip date="2024-01-15" onDateChange={onDateChange} />)
    await userEvent.click(screen.getByRole('button', { name: '2024-01-17' }))

    // Assert
    expect(onDateChange).toHaveBeenCalledTimes(1)
    expect(onDateChange).toHaveBeenCalledWith('2024-01-17')
  })

  it('render_ShouldShowCorrectWeek_WhenMidweekDateProvided', () => {
    // Arrange
    const onDateChange = vi.fn()

    // Act
    render(<WeekStrip date="2024-01-17" onDateChange={onDateChange} />)

    // Assert — Monday of that week must be present
    expect(screen.getByRole('button', { name: '2024-01-15' })).toBeInTheDocument()
    // And Sunday of that week
    expect(screen.getByRole('button', { name: '2024-01-21' })).toBeInTheDocument()
  })

  it('render_ShouldShowCorrectWeek_WhenSundayDateProvided', () => {
    // Arrange — 2024-01-21 is a Sunday; week should be Mon 15 – Sun 21
    const onDateChange = vi.fn()

    // Act
    render(<WeekStrip date="2024-01-21" onDateChange={onDateChange} />)

    // Assert
    expect(screen.getByRole('button', { name: '2024-01-15' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2024-01-21' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2024-01-21' })).toHaveAttribute('aria-pressed', 'true')
  })
})
