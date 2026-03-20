import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { EntryList } from './entry-list'
import type { FoodEntry } from '../../../../domain/models'

function makeEntry(overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: 1,
    userId: 42,
    foodName: 'Chicken Salad',
    estimatedCalories: 350,
    loggedAt: '2024-01-15T12:00:00Z',
    source: 'Manual',
    analysisResult: null,
    imageBase64: null,
    ...overrides,
  }
}

describe('EntryList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('render_ShouldShowEmptyState_WhenEntriesIsEmpty', () => {
    // Arrange
    const onDelete = vi.fn()

    // Act
    render(
      <MemoryRouter>
        <EntryList entries={[]} onDelete={onDelete} />
      </MemoryRouter>
    )

    // Assert
    expect(screen.getByText('Nothing logged yet')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log Food' })).toBeInTheDocument()
  })

  it('render_ShouldRenderFoodNameAndCalories_WhenEntriesProvided', () => {
    // Arrange
    const onDelete = vi.fn()
    const entries = [
      makeEntry({ id: 1, foodName: 'Chicken Salad', estimatedCalories: 350 }),
      makeEntry({ id: 2, foodName: 'Greek Yogurt', estimatedCalories: 120 }),
    ]

    // Act
    render(
      <MemoryRouter>
        <EntryList entries={entries} onDelete={onDelete} />
      </MemoryRouter>
    )

    // Assert
    expect(screen.getByText('Chicken Salad')).toBeInTheDocument()
    expect(screen.getByText('350 kcal')).toBeInTheDocument()
    expect(screen.getByText('Greek Yogurt')).toBeInTheDocument()
    expect(screen.getByText('120 kcal')).toBeInTheDocument()
  })

  it('render_ShouldCallOnDelete_WhenRemoveButtonClicked', async () => {
    // Arrange
    const onDelete = vi.fn()
    const entries = [makeEntry({ id: 5, foodName: 'Chicken Salad' })]

    // Act
    render(
      <MemoryRouter>
        <EntryList entries={entries} onDelete={onDelete} />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete Chicken Salad' }))

    // Assert
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(5)
  })

  it('render_ShouldShowSeverityBadge_WhenAnalysisResultHasConflict', () => {
    // Arrange
    const onDelete = vi.fn()
    const entries = [
      makeEntry({
        analysisResult: JSON.stringify({ compatible: false, severity: 'High' }),
      }),
    ]

    // Act
    render(
      <MemoryRouter>
        <EntryList entries={entries} onDelete={onDelete} />
      </MemoryRouter>
    )

    // Assert
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('render_ShouldNotShowSeverityBadge_WhenAnalysisResultIsNull', () => {
    // Arrange
    const onDelete = vi.fn()
    const entries = [makeEntry({ analysisResult: null })]

    // Act
    render(
      <MemoryRouter>
        <EntryList entries={entries} onDelete={onDelete} />
      </MemoryRouter>
    )

    // Assert
    expect(screen.queryByText('High')).not.toBeInTheDocument()
    expect(screen.queryByText('Medium')).not.toBeInTheDocument()
    expect(screen.queryByText('Low')).not.toBeInTheDocument()
  })

  it('render_ShouldNotShowSeverityBadge_WhenSeverityIsNoneEvenIfConflict', () => {
    // Arrange
    const onDelete = vi.fn()
    const entries = [
      makeEntry({ analysisResult: JSON.stringify({ compatible: false, severity: 'None' }) }),
    ]

    // Act
    render(
      <MemoryRouter>
        <EntryList entries={entries} onDelete={onDelete} />
      </MemoryRouter>
    )

    // Assert
    expect(screen.queryByText('None')).not.toBeInTheDocument()
  })

  it('render_ShouldNotShowSeverityBadge_WhenAnalysisResultIsMalformedJson', () => {
    // Arrange
    const onDelete = vi.fn()
    const entries = [makeEntry({ analysisResult: 'not-valid-json' })]

    // Act
    render(
      <MemoryRouter>
        <EntryList entries={entries} onDelete={onDelete} />
      </MemoryRouter>
    )

    // Assert
    expect(screen.queryByText('High')).not.toBeInTheDocument()
  })

  it('render_ShouldRenderThumbnail_WhenEntryHasImageBase64', () => {
    // Arrange
    const onDelete = vi.fn()
    const entries = [makeEntry({ foodName: 'Pasta', imageBase64: 'xyz789' })]

    // Act
    render(
      <MemoryRouter>
        <EntryList entries={entries} onDelete={onDelete} />
      </MemoryRouter>
    )

    // Assert
    const img = screen.getByRole('img', { name: 'Pasta' })
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,xyz789')
  })

  it('render_ShouldShowLogAnotherMealLink_WhenEntriesProvided', () => {
    // Arrange
    const onDelete = vi.fn()
    const entries = [makeEntry()]

    // Act
    render(
      <MemoryRouter>
        <EntryList entries={entries} onDelete={onDelete} />
      </MemoryRouter>
    )

    // Assert
    expect(screen.getByText('+ Log another meal')).toBeInTheDocument()
  })
})
