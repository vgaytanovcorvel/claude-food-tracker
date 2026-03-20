import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FoodNameInput } from './food-name-input'

describe('FoodNameInput', () => {
  it('render_ShouldShowAiBadge_WhenAiIdentifiedIsTrue', () => {
    // Arrange
    const props = { value: 'Chicken breast', aiIdentified: true, onChange: vi.fn() }

    // Act
    render(<FoodNameInput {...props} />)

    // Assert
    expect(screen.getByText('AI ✦')).toBeInTheDocument()
  })

  it('render_ShouldNotShowAiBadge_WhenAiIdentifiedIsFalse', () => {
    // Arrange
    const props = { value: 'Chicken breast', aiIdentified: false, onChange: vi.fn() }

    // Act
    render(<FoodNameInput {...props} />)

    // Assert
    expect(screen.queryByText('AI ✦')).not.toBeInTheDocument()
  })

  it('render_ShouldCallOnChange_WhenInputValueChanges', async () => {
    // Arrange
    const onChange = vi.fn()
    const props = { value: '', aiIdentified: false, onChange }

    // Act
    render(<FoodNameInput {...props} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Salmon' } })

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('Salmon')
  })

  it('render_ShouldDisplayValue_WhenValueProvided', () => {
    // Arrange
    const props = { value: 'Brown rice', aiIdentified: false, onChange: vi.fn() }

    // Act
    render(<FoodNameInput {...props} />)

    // Assert
    expect(screen.getByRole('textbox')).toHaveValue('Brown rice')
  })
})
