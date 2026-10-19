import { test, expect } from '@playwright/test'

test('loads static social SDK scripts without injecting duplicates', async ({ page }) => {
  await page.goto('/')

  await expect.poll(() => page.evaluate(() => Boolean(window.google?.accounts?.id)), {
    timeout: 15_000,
    message: 'Google Identity Services did not become ready'
  }).toBeTruthy()

  expect(await page.locator('script#google-gsi-sdk').count()).toBe(1)
  expect(await page.locator('script#facebook-sdk').count()).toBe(1)
})

test('keeps the SDK scripts singleton after reload', async ({ page }) => {
  await page.goto('/')
  await page.reload()

  expect(await page.locator('script#google-gsi-sdk').count()).toBe(1)
  expect(await page.locator('script#facebook-sdk').count()).toBe(1)
})
