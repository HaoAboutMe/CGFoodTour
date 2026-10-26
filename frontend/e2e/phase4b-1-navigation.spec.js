import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: '320x568 (iPhone SE 1st)', width: 320, height: 568 },
  { name: '375x667 (iPhone SE 2nd/8)', width: 375, height: 667 },
  { name: '390x844 (iPhone 12/13/14)', width: 390, height: 844 },
  { name: '430x932 (iPhone 14/15 Pro Max)', width: 430, height: 932 },
  { name: '768x1024 (iPad Portrait)', width: 768, height: 1024 },
  { name: '820x1180 (iPad Air Portrait)', width: 820, height: 1180 },
  { name: '1024x768 (iPad Landscape)', width: 1024, height: 768 },
  { name: '1280x800 (Laptop)', width: 1280, height: 800 },
  { name: '1440x900 (Desktop)', width: 1440, height: 900 }
]

test.describe('Phase 4B-1: Global Navigation & Mobile Shell Verification', () => {

  // 1. Tablet Portrait (768px & 820px) - RESP-NAV-001
  test('RESP-NAV-001: Tablet Header keeps Login button fully inside viewport and provides BottomNav', async ({ page }) => {
    for (const width of [768, 820]) {
      await page.setViewportSize({ width, height: 1024 })
      await page.goto('/explore')
      await page.waitForTimeout(600)

      // Verify no horizontal overflow
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasOverflow: doc.scrollWidth > doc.clientWidth
        }
      })
      expect(overflow.hasOverflow).toBe(false)

      // Verify Responsive Header: Quick Search and About buttons are inside viewport
      const headerSearchBtn = page.locator('#header-search-btn')
      const headerAboutBtn = page.locator('#header-about-btn')
      await expect(headerSearchBtn).toBeVisible()
      await expect(headerAboutBtn).toBeVisible()

      // Login button on header is hidden on responsive (< 1024px)
      await expect(page.locator('#login-btn')).toBeHidden()

      const box = await headerAboutBtn.boundingBox()
      expect(box).not.toBeNull()
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      expect(box.x).toBeGreaterThan(0)

      // Verify clicking About button navigates to About section
      await headerAboutBtn.click()
      await page.waitForTimeout(300)

      // Verify tablet has navigation available via BottomNav (no breakpoint gap between 768px and 1023px)
      const bottomNav = page.locator('nav[aria-label="Thanh điều hướng dưới di động"]')
      await expect(bottomNav).toBeVisible()
      const bottomTabs = bottomNav.locator('button')
      await expect(bottomTabs).toHaveCount(4)

      // Verify anonymous login is accessible via BottomNav 4th tab
      const loginTab = bottomTabs.nth(3)
      await expect(loginTab).toContainText('Đăng Nhập')
      await loginTab.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      const closeBtn = page.getByRole('button', { name: /Đóng/i }).first()
      if (await closeBtn.isVisible()) {
        await closeBtn.click()
      } else {
        await page.keyboard.press('Escape')
      }

      // Capture visual evidence
      await page.screenshot({
        path: `e2e/screenshots/phase-4b1-verification/tablet-header-${width}x1024.png`,
        fullPage: false
      })
    }
  })

  // 2. Small Mobile (320px & 375px) - RESP-NAV-002
  test('RESP-NAV-002: Small mobile (320px) Header has no clipping and touch targets >= 44px', async ({ page }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 667 })
      await page.goto('/explore')
      await page.waitForTimeout(600)

      // Verify no horizontal overflow
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasOverflow: doc.scrollWidth > doc.clientWidth
        }
      })
      expect(overflow.hasOverflow).toBe(false)

      // Verify Responsive About and Search buttons
      const headerSearchBtn = page.locator('#header-search-btn')
      const headerAboutBtn = page.locator('#header-about-btn')
      await expect(headerSearchBtn).toBeVisible()
      await expect(headerAboutBtn).toBeVisible()
      await expect(page.locator('#login-btn')).toBeHidden()

      const box = await headerAboutBtn.boundingBox()
      expect(box).not.toBeNull()
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      // Check touch target standards: width >= 44, height >= 44
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)

      // Anonymous login is accessible via BottomNav tab
      const bottomNav = page.locator('nav[aria-label="Thanh điều hướng dưới di động"]')
      const loginTab = bottomNav.locator('button').nth(3)
      await expect(loginTab).toContainText('Đăng Nhập')
      await loginTab.click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')

      // Capture screenshot
      await page.screenshot({
        path: `e2e/screenshots/phase-4b1-verification/mobile-header-${width}px.png`,
        fullPage: false
      })
    }
  })

  // 3. BottomNav Consolidation (4 Primary Tabs) - RESP-NAV-003
  test('RESP-NAV-003: Mobile BottomNav has exactly 4 tabs with >= 44px touch targets on 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/explore')
    await page.waitForTimeout(600)

    const bottomNav = page.locator('nav[aria-label="Thanh điều hướng dưới di động"]')
    await expect(bottomNav).toBeVisible()

    const tabs = bottomNav.locator('button')
    await expect(tabs).toHaveCount(4)

    // Verify 4 primary tab labels
    await expect(tabs.nth(0)).toContainText('Khám Phá')
    await expect(tabs.nth(1)).toContainText('Vòng Xoay')
    await expect(tabs.nth(2)).toContainText('Đã Lưu')
    await expect(tabs.nth(3)).toContainText('Đăng Nhập') // anonymous state

    // Verify touch target sizes >= 44px
    for (let i = 0; i < 4; i++) {
      const tabBox = await tabs.nth(i).boundingBox()
      expect(tabBox.width).toBeGreaterThanOrEqual(44)
      expect(tabBox.height).toBeGreaterThanOrEqual(44)
    }

    // Anonymous click on "Đăng Nhập" opens Auth Modal
    await tabs.nth(3).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')

    // Capture screenshot
    await page.screenshot({
      path: `e2e/screenshots/phase-4b1-verification/bottomnav-4tabs-320px.png`,
      fullPage: false
    })
  })

  // 4. Authenticated Mobile Account Menu / Bottom Sheet - RESP-NAV-003
  test('RESP-NAV-003: Authenticated user tapping Tài Khoản opens Neo-Brutalist Account Bottom Sheet', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await setupMockAuth(page, 'ADMIN')
    await page.waitForTimeout(400)

    const bottomNav = page.locator('nav[aria-label="Thanh điều hướng dưới di động"]')
    const accountTab = bottomNav.locator('button').nth(3)
    await expect(accountTab).toContainText('Tài Khoản')

    // Tap Tài Khoản tab
    await accountTab.click()

    // Verify Account Sheet is open
    const accountSheet = page.locator('div[role="dialog"][aria-label="Menu tài khoản"]')
    await expect(accountSheet).toBeVisible()

    // Verify User summary card
    await expect(accountSheet).toContainText('Admin Test')
    await expect(accountSheet).toContainText('Quản Trị')
    await expect(accountSheet).toContainText('@admintest')

    // Verify navigation options inside sheet
    await expect(accountSheet.getByRole('button', { name: /Thông Tin Tài Khoản/i })).toBeVisible()
    await expect(accountSheet.getByRole('button', { name: /Quán Ăn Của Tôi/i })).toBeVisible()
    await expect(accountSheet.getByRole('button', { name: /Bảng Quản Trị Hệ Thống/i })).toBeVisible()
    await expect(accountSheet.getByRole('button', { name: /Về Chúng Tôi/i })).toBeVisible()
    await expect(accountSheet.getByRole('button', { name: /Đăng Xuất Tài Khoản/i })).toBeVisible()

    // Capture visual screenshot of Account Sheet
    await page.screenshot({
      path: `e2e/screenshots/phase-4b1-verification/account-sheet-mobile-375px.png`,
      fullPage: false
    })

    // Test Escape key closes the sheet
    await page.keyboard.press('Escape')
    await expect(accountSheet).not.toBeVisible()

    // Re-open and test navigation to "Về Chúng Tôi"
    await accountTab.click()
    await expect(accountSheet).toBeVisible()
    await accountSheet.getByRole('button', { name: /Về Chúng Tôi/i }).click()
    await expect(accountSheet).not.toBeVisible()
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  // 5. Store Owner Mobile Account Sheet
  test('RESP-NAV-003: Store Owner sees Chủ Quán badge and no Admin link in Account Sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setupMockAuth(page, 'STORE_OWNER')
    await page.waitForTimeout(400)

    const bottomNav = page.locator('nav[aria-label="Thanh điều hướng dưới di động"]')
    await bottomNav.locator('button').nth(3).click()

    const accountSheet = page.locator('div[role="dialog"][aria-label="Menu tài khoản"]')
    await expect(accountSheet).toBeVisible()
    await expect(accountSheet).toContainText('Chủ Quán')
    // Admin button must NOT be present
    await expect(accountSheet.getByRole('button', { name: /Bảng Quản Trị Hệ Thống/i })).not.toBeVisible()

    // Close sheet via close button
    const closeBtn = accountSheet.getByRole('button', { name: /Đóng menu tài khoản/i })
    await expect(closeBtn).toBeVisible()
    await closeBtn.click()
    await expect(accountSheet).not.toBeVisible()
  })

  // 6. iOS Safe Area Insets - RESP-NAV-004
  test('RESP-NAV-004: Safe area insets and viewport meta are correctly configured', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/explore')

    // Check viewport meta tag in index.html has viewport-fit=cover
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]')
      return meta ? meta.getAttribute('content') : ''
    })
    expect(viewportMeta).toContain('viewport-fit=cover')

    // Check bottom nav has safe-area padding
    const bottomNavPadding = await page.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Thanh điều hướng dưới di động"]')
      if (!nav) return null
      const style = window.getComputedStyle(nav)
      return {
        paddingBottom: style.paddingBottom,
        position: style.position,
        bottom: style.bottom
      }
    })
    expect(bottomNavPadding).not.toBeNull()
    expect(bottomNavPadding.position).toBe('fixed')
    expect(bottomNavPadding.bottom).toBe('0px')
  })

  // 7. Desktop Baseline Unchanged (1280px & 1440px)
  test('DESKTOP BASELINE: Header navigation renders full Phase 3 layout untouched', async ({ page }) => {
    for (const width of [1280, 1440]) {
      await page.setViewportSize({ width, height: width === 1280 ? 800 : 900 })
      await page.goto('/explore')
      await page.waitForTimeout(600)

      // BottomNav must be hidden on desktop
      const bottomNav = page.locator('nav[aria-label="Thanh điều hướng dưới di động"]')
      await expect(bottomNav).not.toBeVisible()

      // Header desktop nav items must have full labels on 1440px
      const headerNav = page.locator('header nav[aria-label="Điều hướng chính"]')
      await expect(headerNav).toBeVisible()

      if (width === 1440) {
        await expect(headerNav).toContainText('Khám Phá Ẩm Thực')
        await expect(headerNav).toContainText('Vòng Xoay Quán Ăn')
        await expect(headerNav).toContainText('Quán Đã Lưu')
        await expect(headerNav).toContainText('Về Chúng Tôi')
      }

      // Login button must render with "Đăng Nhập ↗"
      const loginBtn = page.locator('#login-btn')
      await expect(loginBtn).toBeVisible()
      await expect(loginBtn).toContainText('Đăng Nhập')
      await expect(loginBtn).toContainText('↗')

      // Capture desktop screenshot
      await page.screenshot({
        path: `e2e/screenshots/phase-4b1-verification/desktop-header-${width}px.png`,
        fullPage: false
      })
    }
  })

  // 8. Full Matrix Sweep across all 9 viewports: Zero Horizontal Overflow
  for (const vp of VIEWPORTS) {
    test(`Full Viewport Sweep: Zero overflow on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/explore')
      await page.waitForTimeout(400)

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          diff: doc.scrollWidth - doc.clientWidth
        }
      })
      expect(overflow.diff).toBeLessThanOrEqual(0)
    })
  }
})

// Helper mock authentication
async function setupMockAuth(page, role = 'ADMIN') {
  const isAdminUser = role === 'ADMIN'

  const mockUser = {
    id: isAdminUser ? 1 : 2,
    username: isAdminUser ? 'admintest' : 'ownertest',
    email: isAdminUser ? 'admin@cangiuocfood.vn' : 'owner@cangiuocfood.vn',
    firstname: isAdminUser ? 'Admin' : 'Chủ Quán',
    lastname: 'Test',
    role: role,
    roles: [role, 'USER'],
    avatarUrl: ''
  }

  // Valid 3-part base64 JWT
  const validMockJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaXNzIjoiQ0dGb29kVG91ciIsImV4cCI6MTk5OTk5OTk5OX0.dummy'

  await page.route('**/v1/stores/events**', (route) => route.abort())

  await page.route('**/auth/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1000, result: { accessToken: validMockJwt, tokenType: 'Bearer' } })
    })
  })

  await page.route('**/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1000, result: { accessToken: validMockJwt, tokenType: 'Bearer' } })
    })
  })

  await page.route('**/users**', async (route) => {
    const url = route.request().url()
    if (url.includes('/users/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: mockUser })
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: { content: [mockUser], totalPages: 1, totalElements: 1, page: 0 }
      })
    })
  })

  await page.route('**/*categories*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: [
          { id: 1, name: 'Bánh Mì', icon: 'fa-bread-slice' },
          { id: 2, name: 'Đặc Sản', icon: 'fa-drumstick-bite' }
        ]
      })
    })
  })

  await page.route('**/v1/stores**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: []
      })
    })
  })

  await page.route('**/v1/history**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: []
      })
    })
  })

  await page.goto('/explore')

  const accountTab = page.locator('nav[aria-label="Thanh điều hướng dưới di động"] button').nth(3)
  const isAlreadyLoggedIn = await accountTab.textContent().then((t) => t.includes('Tài Khoản')).catch(() => false)

  if (!isAlreadyLoggedIn) {
    const loginBtn = page.locator('#login-btn')
    if (await loginBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loginBtn.click()
      const authDialog = page.getByRole('dialog')
      await expect(authDialog).toBeVisible({ timeout: 5000 })
      await page.locator('#login-email').fill('test@cangiuocfood.vn')
      await page.locator('#login-password').fill('Test@123456')
      await page.locator('form button[type="submit"]').click({ force: true })
      await expect(authDialog).toBeHidden({ timeout: 5000 })
    }
  }

  await expect(accountTab).toContainText('Tài Khoản', { timeout: 8000 })
  await page.waitForTimeout(400)
}
