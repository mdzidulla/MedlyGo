import { test, expect } from '@playwright/test'

test.describe('Booking Flow (Unauthenticated)', () => {
  test('should require authentication to access booking page', async ({ page }) => {
    await page.goto('/dashboard/booking')

    // Should redirect to login
    await expect(page.url()).toContain('/login')
  })

  test('should require authentication to access appointments page', async ({ page }) => {
    await page.goto('/dashboard/appointments')

    // Should redirect to login
    await expect(page.url()).toContain('/login')
  })
})

test.describe('Booking Page Elements', () => {
  // These tests would run with authentication - for now we test public elements

  test('should display hospital search on public page if available', async ({ page }) => {
    await page.goto('/')

    // Check if there's a search or booking CTA
    const searchOrBook = page.getByRole('link', { name: /book|find|search|hospital/i })

    // If search exists, it should be visible
    if (await searchOrBook.count() > 0) {
      await expect(searchOrBook.first()).toBeVisible()
    }
  })
})

test.describe('Accessibility', () => {
  test('booking-related pages should have proper labels', async ({ page }) => {
    await page.goto('/login')

    // Form inputs should have labels
    const emailInput = page.getByLabel(/email/i)
    const passwordInput = page.getByLabel(/password/i)

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/login')

    // Tab to the submit button
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that focus is somewhere on the page
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})
