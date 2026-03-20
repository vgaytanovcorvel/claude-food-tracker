import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DietPicker } from './diet-picker'
import type { DietStyle } from '../../../../domain/models'

interface DietPickerOption {
  value: DietStyle
  label: string
  description?: string
}

const DEFAULT_OPTIONS: DietPickerOption[] = [
  { value: 'Keto', label: 'Keto', description: 'High fat, very low carb' },
  { value: 'LowFat', label: 'Low Fat', description: 'Reduced fat intake' },
  { value: 'Mediterranean', label: 'Mediterranean' },
]

describe('DietPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('render_ShouldRenderAllOptions_WhenOptionsProvided', () => {
    // Arrange
    const onChange = vi.fn()

    // Act
    render(<DietPicker value="Keto" onChange={onChange} options={DEFAULT_OPTIONS} />)

    // Assert
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(screen.getByLabelText('Keto', { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText('Low Fat', { exact: false })).toBeInTheDocument()
    expect(screen.getByLabelText('Mediterranean', { exact: false })).toBeInTheDocument()
  })

  it('render_ShouldMarkSelectedOptionAsChecked_WhenValueMatches', () => {
    // Arrange
    const onChange = vi.fn()

    // Act
    render(<DietPicker value="LowFat" onChange={onChange} options={DEFAULT_OPTIONS} />)

    // Assert
    const lowFatRadio = screen.getByDisplayValue('LowFat')
    expect(lowFatRadio).toBeChecked()

    const ketoRadio = screen.getByDisplayValue('Keto')
    expect(ketoRadio).not.toBeChecked()
  })

  it('render_ShouldCallOnChange_WhenOptionSelected', async () => {
    // Arrange
    const onChange = vi.fn()

    // Act
    render(<DietPicker value="Keto" onChange={onChange} options={DEFAULT_OPTIONS} />)
    await userEvent.click(screen.getByDisplayValue('Mediterranean'))

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('Mediterranean')
  })

  it('render_ShouldShowDescription_WhenDescriptionProvided', () => {
    // Arrange
    const onChange = vi.fn()

    // Act
    render(<DietPicker value="Keto" onChange={onChange} options={DEFAULT_OPTIONS} />)

    // Assert
    expect(screen.getByText('High fat, very low carb')).toBeInTheDocument()
    expect(screen.getByText('Reduced fat intake')).toBeInTheDocument()
  })

  it('render_ShouldNotShowDescription_WhenDescriptionNotProvided', () => {
    // Arrange
    const onChange = vi.fn()
    const optionsWithoutDescription: DietPickerOption[] = [
      { value: 'Mediterranean', label: 'Mediterranean' },
    ]

    // Act
    const { container } = render(
      <DietPicker value="Mediterranean" onChange={onChange} options={optionsWithoutDescription} />
    )

    // Assert — only the label span is rendered, no description span sibling
    const label = container.querySelector('label')!
    const spans = label.querySelectorAll('span')
    // Only the label-text span is present; no description span
    expect(spans).toHaveLength(1)
    expect(spans[0].textContent).toBe('Mediterranean')
  })
})
