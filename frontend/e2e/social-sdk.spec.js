import { test, expect } from '@playwright/test'

const requireProviderReady = process.env.E2E_REQUIRE_SOCIAL_SDK_READY === 'true'

test('loads static social SDK scripts without injecting duplicates', async ({ page }) => {
  await page.goto('/')

  const googleScript = page.locator('script#google-gsi-sdk')
  const facebookScript = page.locator('script#facebook-sdk')
  await expect(googleScript).toHaveCount(1)
  await expect(facebookScript).toHaveCount(1)
  await expect(googleScript).toHaveAttribute('src', 'https://accounts.google.com/gsi/client')
  await expect(facebookScript).toHaveAttribute('src', 'https://connect.facebook.net/en_US/sdk.js')

  if (requireProviderReady) {
    await expect.poll(() => page.evaluate(() => Boolean(window.google?.accounts?.id)), {
      timeout: 15_000,
      message: 'Google Identity Services did not become ready'
    }).toBeTruthy()
  }
})

test('keeps the SDK scripts singleton after reload', async ({ page }) => {
  await page.goto('/')
  await page.reload()

  expect(await page.locator('script#google-gsi-sdk').count()).toBe(1)
  expect(await page.locator('script#facebook-sdk').count()).toBe(1)
})
