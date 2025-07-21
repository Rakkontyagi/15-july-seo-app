import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should display the homepage', async ({ page }) => {
    await page.goto('/')
    
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/SEO Automation/)
    
    // Check for basic page structure
    await expect(page.locator('body')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('/')
    
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle navigation', async ({ page }) => {
    await page.goto('/')
    
    // Test basic navigation (this will be updated as we add actual navigation)
    const title = page.locator('h1, h2, .title')
    if (await title.count() > 0) {
      await expect(title.first()).toBeVisible()
    }
  })
})