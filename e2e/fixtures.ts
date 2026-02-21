import { test as base, Page } from '@playwright/test'

export const mockFeatureFlags = {
  flags: {
    dark_mode: {
      enabled: true,
      description: 'Enable dark mode theme',
      rollout_percentage: 100,
    },
    new_checkout: {
      enabled: false,
      description: 'New checkout flow with improved UX',
      rollout_percentage: 0,
    },
    beta_features: {
      enabled: true,
      description: 'Access to beta features',
      rollout_percentage: 50,
    },
  },
  version: '1.0.0',
  last_updated: '2024-01-15T10:00:00Z',
}

export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for the loading state to disappear
  await page.waitForSelector('text=Loading flags...', { state: 'hidden', timeout: 10000 }).catch(() => {
    // Loading might have already finished
  })

  // Wait for the table to be visible (indicates flags loaded)
  await page.waitForSelector('table', { state: 'visible', timeout: 10000 })

  // Wait for network to be idle
  await page.waitForLoadState('networkidle')
}

export const test = base.extend<{
  mockFlags: typeof mockFeatureFlags
}>({
  mockFlags: async ({ page }, use) => {
    // Intercept the feature flags endpoint
    await page.route('**/flags/features.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockFeatureFlags),
      })
    })

    await use(mockFeatureFlags)
  },
})

export { expect } from '@playwright/test'
