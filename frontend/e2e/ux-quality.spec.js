import { test, expect } from '@playwright/test'

for (const width of [320, 360, 375, 768]) {
  test(`explore has no horizontal page overflow at ${width}px`, async ({ page }) => {
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.setViewportSize({ width, height: 800 })
    await page.goto('/explore')
    await page.waitForTimeout(500)
    expect(pageErrors, `uncaught browser errors: ${pageErrors.join(' | ')}`).toEqual([])
    await expect(page.getByRole('heading', { name: /Bản Đồ Ẩm Thực Cần Giuộc/i })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test('reduced-motion preference disables long UI animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/explore')
  const duration = await page.locator('body').evaluate(() => {
    const probe = document.createElement('div')
    probe.className = 'animate-fade-in-up'
    document.body.appendChild(probe)
    const value = getComputedStyle(probe).animationDuration
    probe.remove()
    return value
  })
  expect(Number.parseFloat(duration)).toBeLessThanOrEqual(0.01)
})

test('auth modal closes with Escape and restores keyboard focus', async ({ page }) => {
  await page.goto('/explore')
  const loginButton = page.getByRole('button', { name: /Đăng Nhập/i }).first()
  await loginButton.focus()
  await loginButton.press('Enter')

  const dialog = page.getByRole('dialog', { name: /^Đăng Nhập$/i })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(loginButton).toBeFocused()
})

test('store card and detail drawer support keyboard navigation', async ({ page }) => {
  await page.route('**/v1/stores**', async (route) => {
    const url = route.request().url()
    const mockStore = {
      id: 'test-store-1',
      name: 'Quán Thử Nghiệm',
      address: 'Thị trấn Cần Giuộc',
      status: 'APPROVED',
      latitude: 10.6,
      longitude: 106.67
    }
    if (url.includes('/test-store-1')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: mockStore })
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          content: [mockStore],
          totalPages: 1,
          totalElements: 1,
          last: true
        }
      })
    })
  })
  await page.goto('/explore')
  const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
  await expect(storeCard).toBeVisible()
  await storeCard.focus()
  await storeCard.press('Enter')

  const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
  await expect(drawer).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
  await expect(storeCard).toBeFocused()
})

test('admin delete modal validates input, closes with Escape and restores focus', async ({ page }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL
  const adminPassword = process.env.E2E_ADMIN_PASSWORD
  test.skip(!adminEmail || !adminPassword, 'Set isolated rehearsal admin credentials')

  const login = await page.request.post('/api/auth/token', { data: { email: adminEmail, password: adminPassword } })
  expect(login.ok()).toBeTruthy()
  await page.goto('/explore')
  const accountButton = page.locator('header button').filter({ has: page.locator('img[alt="avatar"]') }).first()
  await expect(accountButton).toBeVisible()
  await accountButton.click()
  await page.getByRole('button', { name: /Bảng Quản Trị Hệ Thống/i }).click()
  await page.getByRole('button', { name: /Người Dùng/i }).click()

  const deleteButton = page.locator('button:not([disabled])', { hasText: 'Xóa User' }).first()
  await expect(deleteButton).toBeEnabled()
  await deleteButton.focus()
  await deleteButton.click()

  const dialog = page.getByRole('alertdialog', { name: /Xóa tài khoản người dùng/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('input')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(deleteButton).toBeFocused()
})

test('production DOM contains no manual OAuth tokens or simulated GPS controls', async ({ page }) => {
  await page.goto('/explore')

  // Check Auth modal DOM
  const loginButton = page.getByRole('button', { name: /Đăng Nhập/i }).first()
  await loginButton.click()
  const authDialog = page.getByRole('dialog', { name: /^Đăng Nhập$/i })
  await expect(authDialog).toBeVisible()

  // Verify technical English badge replaced and manual token details absent
  await expect(page.locator('text=Security Gateway')).toHaveCount(0)
  await expect(page.locator('text=Đăng Nhập An Toàn')).toBeVisible()
  await expect(page.locator('text=OAuth Tokens thủ công')).toHaveCount(0)
  await expect(page.locator('textarea[placeholder*="eyJhbGci"]')).toHaveCount(0)
  await expect(page.locator('text=Token Kích Hoạt (UUID)')).toHaveCount(0)

  // Close Auth modal
  await page.keyboard.press('Escape')
  await expect(authDialog).toBeHidden()

  // Check Store Detail Drawer DOM
  const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
  if (await storeCard.isVisible()) {
    await storeCard.click()
    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Verify simulated GPS controls are absent
    await expect(page.locator('text=Vĩ Độ Của Bạn')).toHaveCount(0)
    await expect(page.locator('text=Kinh Độ Của Bạn')).toHaveCount(0)
  }
})
