import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalysisCard } from './analysis-card'
import type { AlternativeImageResult } from '../../../../domain/models'

function makeDefaultProps() {
  return {
    compatible: true,
    severity: 'None' as string,
    educationText: null,
    alternativeName: null,
    alternativeImage: null,
    imageLoading: false,
    suggestClickCount: 0,
    suggesting: false,
    bookmarkSaved: false,
    bookmarkSaving: false,
    onSuggestAnother: vi.fn(),
    onBookmark: vi.fn(),
    onImageZoom: vi.fn(),
  }
}

describe('AnalysisCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('render_ShouldShowCompatibleMessage_WhenResultIsCompatible', () => {
    // Arrange
    const props = { ...makeDefaultProps(), compatible: true }

    // Act
    render(<AnalysisCard {...props} />)

    // Assert
    expect(screen.getByText('Great choice!')).toBeInTheDocument()
  })

  it('render_ShouldShowConflictMessage_WhenResultIsNotCompatible', () => {
    // Arrange
    const props = {
      ...makeDefaultProps(),
      compatible: false,
      severity: 'Medium',
      alternativeName: 'Greek Salad',
    }

    // Act
    render(<AnalysisCard {...props} />)

    // Assert
    expect(screen.getByText('Diet conflict detected')).toBeInTheDocument()
    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('render_ShouldCallOnSuggestAnother_WhenButtonClicked', async () => {
    // Arrange
    const onSuggestAnother = vi.fn()
    const props = {
      ...makeDefaultProps(),
      compatible: false,
      severity: 'Low',
      alternativeName: 'Greek Salad',
      onSuggestAnother,
    }

    // Act
    render(<AnalysisCard {...props} />)
    await userEvent.click(screen.getByText('Suggest another'))

    // Assert
    expect(onSuggestAnother).toHaveBeenCalledTimes(1)
  })

  it('render_ShouldCallOnBookmark_WhenBookmarkButtonClicked', async () => {
    // Arrange
    const onBookmark = vi.fn()
    const props = {
      ...makeDefaultProps(),
      compatible: false,
      severity: 'Low',
      alternativeName: 'Greek Salad',
      onBookmark,
    }

    // Act
    render(<AnalysisCard {...props} />)
    await userEvent.click(screen.getByText('Save for later'))

    // Assert
    expect(onBookmark).toHaveBeenCalledTimes(1)
  })

  it('render_ShouldShowAlternativeName_WhenAlternativeNameProvided', () => {
    // Arrange
    const props = {
      ...makeDefaultProps(),
      compatible: false,
      severity: 'Low',
      alternativeName: 'Quinoa Bowl',
    }

    // Act
    render(<AnalysisCard {...props} />)

    // Assert
    expect(screen.getByText('Try instead')).toBeInTheDocument()
    expect(screen.getByText('Quinoa Bowl')).toBeInTheDocument()
  })

  it('render_ShouldHideSuggestButton_WhenSuggestClickCountReachesMax', () => {
    // Arrange
    const props = {
      ...makeDefaultProps(),
      compatible: false,
      severity: 'Low',
      alternativeName: 'Greek Salad',
      suggestClickCount: 3,
    }

    // Act
    render(<AnalysisCard {...props} />)

    // Assert
    expect(screen.queryByText(/Suggest another/)).not.toBeInTheDocument()
  })

  it('render_ShouldShowSavedIndicator_WhenBookmarkSaved', () => {
    // Arrange
    const props = {
      ...makeDefaultProps(),
      compatible: false,
      severity: 'Low',
      alternativeName: 'Greek Salad',
      bookmarkSaved: true,
    }

    // Act
    render(<AnalysisCard {...props} />)

    // Assert
    expect(screen.getByText('✓ Saved')).toBeInTheDocument()
    expect(screen.queryByText('Save for later')).not.toBeInTheDocument()
  })

  it('render_ShouldRenderAlternativeImage_WhenImageBase64IsPresent', () => {
    // Arrange
    const alternativeImage: AlternativeImageResult = {
      imageBase64: 'abc123',
      mimeType: 'image/jpeg',
    }
    const props = {
      ...makeDefaultProps(),
      compatible: false,
      severity: 'Low',
      alternativeName: 'Greek Salad',
      alternativeImage,
    }

    // Act
    render(<AnalysisCard {...props} />)

    // Assert
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'data:image/jpeg;base64,abc123')
    expect(img).toHaveAttribute('alt', 'Suggested: Greek Salad')
  })

  it('render_ShouldCallOnImageZoom_WhenImageIsClicked', async () => {
    // Arrange
    const onImageZoom = vi.fn()
    const alternativeImage: AlternativeImageResult = {
      imageBase64: 'abc123',
      mimeType: 'image/jpeg',
    }
    const props = {
      ...makeDefaultProps(),
      compatible: false,
      severity: 'Low',
      alternativeName: 'Greek Salad',
      alternativeImage,
      onImageZoom,
    }

    // Act
    render(<AnalysisCard {...props} />)
    await userEvent.click(screen.getByRole('img'))

    // Assert
    expect(onImageZoom).toHaveBeenCalledTimes(1)
    expect(onImageZoom).toHaveBeenCalledWith('data:image/jpeg;base64,abc123')
  })
})
