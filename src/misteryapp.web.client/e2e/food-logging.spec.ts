import { test, expect } from '@playwright/test'
import path from 'path'

test.beforeEach(async ({ page }) => {
  // Seed a userId so we skip onboarding
  await page.addInitScript(() => {
    localStorage.setItem('misteryapp:userId', '1')
  })
})

test('navigate_ShouldShowLogPage_WhenUserIdExists', async ({ page }) => {
  await page.goto('/log')
  // Page should load without redirect to onboarding
  await expect(page).toHaveURL(/\/log/)
})

test('render_ShouldShowFoodNameInput_WhenLogPageIsLoaded', async ({ page }) => {
  await page.goto('/log')
  const foodNameInput = page.getByRole('textbox', { name: /food name/i })
    .or(page.getByPlaceholder(/food name/i))
    .or(page.locator('input[type="text"]').first())
  await expect(foodNameInput).toBeVisible({ timeout: 3000 })
})

test('fillFoodName_ShouldUpdateInputValue_WhenTextIsTyped', async ({ page }) => {
  await page.goto('/log')
  const input = page.locator('input[type="text"]').first()
  await input.fill('Grilled Chicken')
  await expect(input).toHaveValue('Grilled Chicken')
})
