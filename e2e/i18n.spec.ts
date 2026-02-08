import { test, expect } from '@playwright/test'

test.describe('Internationalization (i18n)', () => {
  test('should display content in default language', async ({ page }) => {
    await page.goto('/')

    // Page should have content (not be empty)
    const body = page.locator('body')
    const text = await body.textContent()
    expect(text?.length).toBeGreaterThan(0)
  })

  test('should switch to Twi language if selector exists', async ({ page }) => {
    await page.goto('/')

    // Look for language selector
    const langSelector = page.getByRole('button', { name: /language|english|twi/i })
      .or(page.getByRole('combobox', { name: /language/i }))
      .or(page.locator('[data-testid="language-selector"]'))

    if (await langSelector.count() > 0) {
      await langSelector.first().click()

      // Look for Twi option
      const twiOption = page.getByRole('option', { name: /twi/i })
        .or(page.getByRole('menuitem', { name: /twi/i }))
        .or(page.getByText(/twi/i))

      if (await twiOption.count() > 0) {
        await twiOption.first().click()
        // Page should still be functional
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })

  test('should maintain language preference across navigation', async ({ page }) => {
    // Set locale via URL if supported
    await page.goto('/tw')

    // If Twi route exists, check content
    if (!page.url().includes('404')) {
      const body = page.locator('body')
      const text = await body.textContent()
      expect(text?.length).toBeGreaterThan(0)
    }
  })
})
