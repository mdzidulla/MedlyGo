import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display homepage', async ({ page }) => {
    await page.goto('/')

    // Check for main heading or hero section
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/')

    // Check for navigation
    const nav = page.locator('nav, header')
    await expect(nav.first()).toBeVisible()
  })

  test('should have login/register links or buttons for unauthenticated users', async ({ page }) => {
    await page.goto('/')

    // Check for auth links or buttons
    const loginLink = page.getByRole('link', { name: /log in|sign in/i })
    const loginButton = page.getByRole('button', { name: /log in|sign in/i })
    const registerLink = page.getByRole('link', { name: /register|sign up|get started/i })
    const registerButton = page.getByRole('button', { name: /register|sign up|get started/i })

    // At least one should be visible
    const hasLoginLink = await loginLink.count() > 0
    const hasLoginButton = await loginButton.count() > 0
    const hasRegisterLink = await registerLink.count() > 0
    const hasRegisterButton = await registerButton.count() > 0

    expect(hasLoginLink || hasLoginButton || hasRegisterLink || hasRegisterButton).toBe(true)
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should still render properly
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/')

    // Check for title
    const title = await page.title()
    expect(title.length).toBeGreaterThan(0)
  })

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // No critical JavaScript errors
    expect(errors.filter(e => !e.includes('Warning'))).toHaveLength(0)
  })
})
