import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Clear localStorage so there is no existing userId
  await page.addInitScript(() => {
    localStorage.removeItem('misteryapp:userId')
  })
})

test('navigate_ShouldRedirectToOnboarding_WhenNoUserIdIsStored', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/onboarding/)
})

test('onboarding_ShouldRedirectToHome_WhenFormIsCompleted', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/onboarding/)

  // Fill in the name field
  await page.getByRole('textbox', { name: /name/i }).fill('Test User')

  // Select a diet style (click one of the available options)
  const dietOption = page.getByText('Mediterranean').first()
  await dietOption.click()

  // Submit the form
  await page.getByRole('button', { name: /get started|save|continue/i }).click()

  // Should redirect to /home
  await expect(page).toHaveURL(/\/home/, { timeout: 5000 })
})
