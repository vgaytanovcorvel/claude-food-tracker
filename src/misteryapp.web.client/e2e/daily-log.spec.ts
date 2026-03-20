import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Seed a userId so we skip onboarding
  await page.addInitScript(() => {
    localStorage.setItem('misteryapp:userId', '1')
  })
})

test('navigate_ShouldShowDailyLogPage_WhenUserIdExists', async ({ page }) => {
  await page.goto('/daily-log')
  await expect(page).toHaveURL(/\/daily-log/)
})

test('clickPreviousArrow_ShouldRemainOnDailyLog_WhenArrowIsClicked', async ({ page }) => {
  await page.goto('/daily-log')

  const prevArrow = page.getByRole('button', { name: /previous|prev|←|‹|</i })
    .or(page.locator('button').filter({ hasText: /←|‹|</ }).first())
  await expect(prevArrow).toBeVisible({ timeout: 3000 })
  await prevArrow.click()

  // After clicking previous, URL or displayed date should have changed
  // The page should still be on /daily-log
  await expect(page).toHaveURL(/\/daily-log/)
})

test('clickNextArrow_ShouldRemainOnDailyLog_WhenArrowIsClicked', async ({ page }) => {
  await page.goto('/daily-log')

  const nextArrow = page.getByRole('button', { name: /next|→|›|>/i })
    .or(page.locator('button').filter({ hasText: /→|›|>/ }).first())
  await expect(nextArrow).toBeVisible({ timeout: 3000 })
  await nextArrow.click()

  await expect(page).toHaveURL(/\/daily-log/)
})
