import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhotoCapture } from './photo-capture'

describe('PhotoCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('render_ShouldShowTakePhotoLabel_WhenNoPreviewUrl', () => {
    // Arrange
    const ref = { current: null }

    // Act
    render(
      <PhotoCapture
        previewUrl={null}
        identifying={false}
        fileInputRef={ref}
        onFileChange={vi.fn()}
        onRemovePhoto={vi.fn()}
        onImageZoom={vi.fn()}
      />
    )

    // Assert
    expect(screen.getByText('Take or upload a photo')).toBeInTheDocument()
  })

  it('render_ShouldShowChangePhotoLabel_WhenPreviewUrlPresent', () => {
    // Arrange
    const ref = { current: null }

    // Act
    render(
      <PhotoCapture
        previewUrl="blob:http://localhost/abc"
        identifying={false}
        fileInputRef={ref}
        onFileChange={vi.fn()}
        onRemovePhoto={vi.fn()}
        onImageZoom={vi.fn()}
      />
    )

    // Assert
    expect(screen.getByText('Change photo')).toBeInTheDocument()
  })

  it('render_ShouldShowPreviewImage_WhenPreviewUrlProvided', () => {
    // Arrange
    const ref = { current: null }
    const previewUrl = 'blob:http://localhost/abc'

    // Act
    render(
      <PhotoCapture
        previewUrl={previewUrl}
        identifying={false}
        fileInputRef={ref}
        onFileChange={vi.fn()}
        onRemovePhoto={vi.fn()}
        onImageZoom={vi.fn()}
      />
    )

    // Assert
    const img = screen.getByRole('img', { name: 'Food preview' })
    expect(img).toHaveAttribute('src', previewUrl)
  })

  it('render_ShouldCallOnRemovePhoto_WhenRemoveButtonClicked', async () => {
    // Arrange
    const ref = { current: null }
    const onRemovePhoto = vi.fn()

    // Act
    render(
      <PhotoCapture
        previewUrl="blob:http://localhost/abc"
        identifying={false}
        fileInputRef={ref}
        onFileChange={vi.fn()}
        onRemovePhoto={onRemovePhoto}
        onImageZoom={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))

    // Assert
    expect(onRemovePhoto).toHaveBeenCalledTimes(1)
  })

  it('render_ShouldCallOnImageZoom_WhenPreviewImageClicked', async () => {
    // Arrange
    const ref = { current: null }
    const onImageZoom = vi.fn()
    const previewUrl = 'blob:http://localhost/abc'

    // Act
    render(
      <PhotoCapture
        previewUrl={previewUrl}
        identifying={false}
        fileInputRef={ref}
        onFileChange={vi.fn()}
        onRemovePhoto={vi.fn()}
        onImageZoom={onImageZoom}
      />
    )
    await userEvent.click(screen.getByRole('img', { name: 'Food preview' }))

    // Assert
    expect(onImageZoom).toHaveBeenCalledTimes(1)
    expect(onImageZoom).toHaveBeenCalledWith(previewUrl)
  })

  it('render_ShouldShowIdentifyingIndicator_WhenIdentifyingIsTrue', () => {
    // Arrange
    const ref = { current: null }

    // Act
    render(
      <PhotoCapture
        previewUrl={null}
        identifying={true}
        fileInputRef={ref}
        onFileChange={vi.fn()}
        onRemovePhoto={vi.fn()}
        onImageZoom={vi.fn()}
      />
    )

    // Assert
    expect(screen.getByLabelText('Identifying food')).toBeInTheDocument()
  })

  it('render_ShouldNotShowIdentifyingIndicator_WhenIdentifyingIsFalse', () => {
    // Arrange
    const ref = { current: null }

    // Act
    render(
      <PhotoCapture
        previewUrl={null}
        identifying={false}
        fileInputRef={ref}
        onFileChange={vi.fn()}
        onRemovePhoto={vi.fn()}
        onImageZoom={vi.fn()}
      />
    )

    // Assert
    expect(screen.queryByLabelText('Identifying food')).not.toBeInTheDocument()
  })

  it('render_ShouldCallOnFileChange_WhenFileInputChanges', () => {
    // Arrange
    const ref = { current: null }
    const onFileChange = vi.fn()

    // Act
    render(
      <PhotoCapture
        previewUrl={null}
        identifying={false}
        fileInputRef={ref}
        onFileChange={onFileChange}
        onRemovePhoto={vi.fn()}
        onImageZoom={vi.fn()}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change', { bubbles: true }))

    // Assert
    expect(onFileChange).toHaveBeenCalledTimes(1)
  })
})
