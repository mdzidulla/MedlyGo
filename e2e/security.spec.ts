import { test, expect } from '@playwright/test'

test.describe('Security Tests', () => {
  test('should not expose sensitive routes without authentication', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/dashboard/appointments',
      '/dashboard/booking',
      '/dashboard/profile',
      '/provider',
      '/provider/appointments',
      '/provider/patients',
      '/admin',
      '/admin/hospitals',
      '/admin/providers',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      // Should redirect to login or show unauthorized
      const url = page.url()
      const isProtected = url.includes('/login') || url.includes('/unauthorized') || url.includes('/403')
      expect(isProtected).toBe(true)
    }
  })

  test('should sanitize URL parameters', async ({ page }) => {
    // Try XSS in URL parameter
    await page.goto('/login?redirect=<script>alert(1)</script>')

    // Page should load without executing script
    await expect(page.locator('body')).toBeVisible()

    // Check that no alert was triggered by checking page context
    const alerts: string[] = []
    page.on('dialog', dialog => {
      alerts.push(dialog.message())
      dialog.dismiss()
    })

    await page.waitForTimeout(1000)
    expect(alerts).toHaveLength(0)
  })

  test('should not reflect XSS in error messages', async ({ page }) => {
    await page.goto('/login')

    // Try XSS in email field
    await page.getByLabel(/email/i).fill('<script>alert("xss")</script>@test.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    // Wait for any potential error message
    await page.waitForTimeout(1000)

    // Check page content doesn't contain unescaped script tag
    const bodyHtml = await page.locator('body').innerHTML()
    expect(bodyHtml).not.toContain('<script>alert')
  })

  test('should have HTTPS-ready cookies configuration', async ({ page }) => {
    await page.goto('/')

    // Get cookies
    const cookies = await page.context().cookies()

    // If there are any session cookies, they should have proper flags
    cookies.forEach(cookie => {
      if (cookie.name.includes('session') || cookie.name.includes('auth')) {
        // HttpOnly should be set for security cookies
        expect(cookie.httpOnly).toBe(true)
      }
    })
  })

  test('should not expose API keys in client-side code', async ({ page }) => {
    await page.goto('/')

    // Check page source for common API key patterns
    const pageContent = await page.content()

    // Should not contain exposed API keys (these patterns indicate leaked keys)
    expect(pageContent).not.toMatch(/sk_live_[a-zA-Z0-9]+/)
    expect(pageContent).not.toMatch(/pk_live_[a-zA-Z0-9]+/)
  })

  test('should have proper content security', async ({ page }) => {
    const response = await page.goto('/')

    // Page should load successfully
    expect(response?.status()).toBeLessThan(400)
  })

  test('should prevent open redirect attacks', async ({ page }) => {
    // Try to redirect to external site via redirect parameter
    await page.goto('/login?redirect=https://evil.com')

    // Fill form and try to submit
    await page.getByLabel(/email/i).fill('test@test.com')
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    // Wait for navigation
    await page.waitForTimeout(2000)

    // The URL should not have navigated to an external domain
    // It may still contain the redirect param but shouldn't be on evil.com domain
    const currentUrl = page.url()
    const isOnEvilDomain = currentUrl.startsWith('https://evil.com') || currentUrl.startsWith('http://evil.com')
    expect(isOnEvilDomain).toBe(false)
  })
})
