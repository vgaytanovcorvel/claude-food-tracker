import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageLightbox } from './image-lightbox'

describe('ImageLightbox', () => {
  it('render_ShouldDisplayImage_WhenImageUrlProvided', () => {
    // Arrange
    const imageUrl = 'data:image/jpeg;base64,abc123'
    const props = { imageUrl, onClose: vi.fn() }

    // Act
    render(<ImageLightbox {...props} />)

    // Assert
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', imageUrl)
    expect(img).toHaveAttribute('alt', 'Alternative food')
  })

  it('render_ShouldCallOnClose_WhenOverlayClicked', async () => {
    // Arrange
    const onClose = vi.fn()
    const props = { imageUrl: 'data:image/jpeg;base64,abc123', onClose }

    // Act
    const { container } = render(<ImageLightbox {...props} />)
    // The overlay is the outermost div with onClick={onClose}
    await userEvent.click(container.firstChild as Element)

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('render_ShouldCallOnClose_WhenImageClicked', async () => {
    // Arrange
    const onClose = vi.fn()
    const props = { imageUrl: 'data:image/jpeg;base64,abc123', onClose }

    // Act
    render(<ImageLightbox {...props} />)
    // click bubbles from img up to overlay div
    await userEvent.click(screen.getByRole('img'))

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
