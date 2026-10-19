import { test, expect } from '@playwright/test'

test('opens and reloads a canonical store deep-link', async ({ page }) => {
  const storeId = process.env.E2E_APPROVED_STORE_ID
  test.skip(!storeId, 'Set E2E_APPROVED_STORE_ID to an approved staging store')

  await page.goto(`/quan/${storeId}/e2e-store`)
  await expect(page).toHaveURL(new RegExp(`/quan/${storeId}/`))
  await page.reload()
  await expect(page).toHaveURL(new RegExp(`/quan/${storeId}/`))
  await expect(page.locator('body')).not.toContainText(/không tìm thấy/i)
})
