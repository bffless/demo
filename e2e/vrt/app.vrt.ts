import { test, expect, mockFeatureFlags, waitForAppReady } from '../fixtures'

test.describe('Visual Regression Tests', () => {
  test('default state - flags loaded', async ({ page, mockFlags, mockCounter }) => {
    await page.goto('/')
    await waitForAppReady(page)

    // Verify flags are displayed
    await expect(page.locator('text=dark_mode')).toBeVisible()
    await expect(page.locator('text=new_checkout')).toBeVisible()
    await expect(page.locator('text=beta_features')).toBeVisible()

    await page.screenshot({
      path: 'screenshots/home-default.png',
      fullPage: true,
    })
  })

  test('loading state', async ({ page }) => {
    // Mock the counter API
    await page.route('**/api/count', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0 }),
      })
    })

    // Intercept and delay the flags response
    await page.route('**/flags/features.json', async (route) => {
      // Don't fulfill - leave the request pending to capture loading state
      await new Promise((resolve) => setTimeout(resolve, 100))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockFeatureFlags),
      })
    })

    await page.goto('/')

    // Capture while loading is visible
    await page.waitForSelector('text=Loading flags...', { state: 'visible', timeout: 5000 })

    await page.screenshot({
      path: 'screenshots/home-loading.png',
      fullPage: true,
    })
  })

  test('error state', async ({ page }) => {
    // Mock the counter API
    await page.route('**/api/count', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0 }),
      })
    })

    // Mock a failed flags response
    await page.route('**/flags/features.json', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    await page.goto('/')

    // Wait for error message to appear
    await page.waitForSelector('text=Error:', { state: 'visible', timeout: 5000 })

    await page.screenshot({
      path: 'screenshots/home-error.png',
      fullPage: true,
    })
  })

  test('counter interaction state', async ({ page, mockFlags, mockCounter }) => {
    await page.goto('/')
    await waitForAppReady(page)

    // Verify counter starts at 0
    const counterButton = page.locator('button:has-text("Count is")')
    await expect(counterButton).toHaveText('Count is 0')

    // Click the counter button multiple times
    await counterButton.click()
    await expect(counterButton).toHaveText('Count is 1')

    await counterButton.click()
    await expect(counterButton).toHaveText('Count is 2')

    await counterButton.click()
    await expect(counterButton).toHaveText('Count is 3')

    await page.screenshot({
      path: 'screenshots/home-counter.png',
      fullPage: true,
    })
  })
})
