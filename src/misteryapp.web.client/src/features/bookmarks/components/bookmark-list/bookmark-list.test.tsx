import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BookmarkList } from './bookmark-list'
import type { AlternativeBookmark } from '../../../../domain/models'

function makeBookmark(overrides: Partial<AlternativeBookmark> = {}): AlternativeBookmark {
  return {
    id: 1,
    userId: 42,
    alternativeFoodName: 'Greek Salad',
    imageBase64: null,
    mimeType: null,
    createdAt: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

describe('BookmarkList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('render_ShouldShowEmptyState_WhenBookmarksIsEmpty', () => {
    // Arrange
    const onDelete = vi.fn()

    // Act
    render(<BookmarkList bookmarks={[]} onDelete={onDelete} />)

    // Assert
    expect(screen.getByText('No saved alternatives yet')).toBeInTheDocument()
  })

  it('render_ShouldRenderBookmarkNames_WhenBookmarksProvided', () => {
    // Arrange
    const onDelete = vi.fn()
    const bookmarks = [
      makeBookmark({ id: 1, alternativeFoodName: 'Greek Salad' }),
      makeBookmark({ id: 2, alternativeFoodName: 'Quinoa Bowl' }),
    ]

    // Act
    render(<BookmarkList bookmarks={bookmarks} onDelete={onDelete} />)

    // Assert
    expect(screen.getByText('Greek Salad')).toBeInTheDocument()
    expect(screen.getByText('Quinoa Bowl')).toBeInTheDocument()
  })

  it('render_ShouldCallOnDelete_WhenRemoveButtonClicked', async () => {
    // Arrange
    const onDelete = vi.fn()
    const bookmarks = [
      makeBookmark({ id: 7, alternativeFoodName: 'Greek Salad' }),
    ]

    // Act
    render(<BookmarkList bookmarks={bookmarks} onDelete={onDelete} />)
    await userEvent.click(screen.getByRole('button', { name: 'Remove Greek Salad' }))

    // Assert
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(7)
  })

  it('render_ShouldRenderImage_WhenImageBase64AndMimeTypePresent', () => {
    // Arrange
    const onDelete = vi.fn()
    const bookmarks = [
      makeBookmark({ imageBase64: 'abc123', mimeType: 'image/jpeg', alternativeFoodName: 'Greek Salad' }),
    ]

    // Act
    render(<BookmarkList bookmarks={bookmarks} onDelete={onDelete} />)

    // Assert
    const img = screen.getByRole('img', { name: 'Greek Salad' })
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,abc123')
  })

  it('render_ShouldNotRenderImage_WhenImageBase64IsNull', () => {
    // Arrange
    const onDelete = vi.fn()
    const bookmarks = [
      makeBookmark({ imageBase64: null, mimeType: null, alternativeFoodName: 'Greek Salad' }),
    ]

    // Act
    render(<BookmarkList bookmarks={bookmarks} onDelete={onDelete} />)

    // Assert
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('render_ShouldNotRenderImage_WhenImageBase64SetButMimeTypeIsNull', () => {
    // Arrange — source condition is `imageBase64 && mimeType`, so both must be truthy
    const onDelete = vi.fn()
    const bookmarks = [
      makeBookmark({ imageBase64: 'abc123', mimeType: null }),
    ]

    // Act
    render(<BookmarkList bookmarks={bookmarks} onDelete={onDelete} />)

    // Assert
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
