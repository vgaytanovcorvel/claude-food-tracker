import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CaloriePill } from './calorie-pill'

function makeDefaultProps() {
  return {
    calories: 0,
    calorieUserEdited: false,
    expanded: false,
    editValue: '',
    onPillClick: vi.fn(),
    onEditChange: vi.fn(),
    onConfirm: vi.fn(),
  }
}

describe('CaloriePill', () => {
  it('render_ShouldShowTapToSetCalories_WhenCaloriesIsZeroAndNotExpanded', () => {
    // Arrange
    const props = { ...makeDefaultProps(), calories: 0, expanded: false }

    // Act
    render(<CaloriePill {...props} />)

    // Assert
    expect(screen.getByText('Tap to set calories')).toBeInTheDocument()
  })

  it('render_ShouldShowCaloriesWithTildePrefix_WhenCaloriesSetAndNotUserEdited', () => {
    // Arrange
    const props = { ...makeDefaultProps(), calories: 350, calorieUserEdited: false, expanded: false }

    // Act
    render(<CaloriePill {...props} />)

    // Assert
    expect(screen.getByText('~350 kcal')).toBeInTheDocument()
  })

  it('render_ShouldShowCaloriesWithoutTildePrefix_WhenCaloriesSetAndUserEdited', () => {
    // Arrange
    const props = { ...makeDefaultProps(), calories: 350, calorieUserEdited: true, expanded: false }

    // Act
    render(<CaloriePill {...props} />)

    // Assert
    expect(screen.getByText('350 kcal')).toBeInTheDocument()
    expect(screen.queryByText('~350 kcal')).not.toBeInTheDocument()
  })

  it('render_ShouldShowNumberInput_WhenExpanded', () => {
    // Arrange
    const props = { ...makeDefaultProps(), expanded: true, editValue: '300' }

    // Act
    render(<CaloriePill {...props} />)

    // Assert
    const input = screen.getByRole('spinbutton')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue(300)
  })

  it('render_ShouldCallOnPillClick_WhenButtonClicked', async () => {
    // Arrange
    const onPillClick = vi.fn()
    const props = { ...makeDefaultProps(), calories: 0, expanded: false, onPillClick }

    // Act
    render(<CaloriePill {...props} />)
    await userEvent.click(screen.getByRole('button'))

    // Assert
    expect(onPillClick).toHaveBeenCalledTimes(1)
  })

  it('render_ShouldCallOnConfirm_WhenEnterKeyPressed', async () => {
    // Arrange
    const onConfirm = vi.fn()
    const props = { ...makeDefaultProps(), expanded: true, editValue: '400', onConfirm }

    // Act
    render(<CaloriePill {...props} />)
    await userEvent.type(screen.getByRole('spinbutton'), '{Enter}')

    // Assert
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('render_ShouldCallOnConfirm_WhenInputLosesFocus', async () => {
    // Arrange
    const onConfirm = vi.fn()
    const props = { ...makeDefaultProps(), expanded: true, editValue: '400', onConfirm }

    // Act
    render(<CaloriePill {...props} />)
    await userEvent.click(screen.getByRole('spinbutton'))
    await userEvent.tab()

    // Assert
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('render_ShouldCallOnEditChange_WhenInputValueChangedInExpandedState', () => {
    // Arrange
    const onEditChange = vi.fn()
    const props = { ...makeDefaultProps(), expanded: true, editValue: '', onEditChange }

    // Act
    render(<CaloriePill {...props} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '250' } })

    // Assert
    expect(onEditChange).toHaveBeenCalledWith('250')
  })
})
