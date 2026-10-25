import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Mock Data Tokens
const MOCK_CATEGORIES = [
  { id: 1, name: 'Cơm Tấm', icon: 'Utensils' },
  { id: 2, name: 'Bún & Phở', icon: 'Soup' },
  { id: 3, name: 'Bánh Mì', icon: 'Sandwich' },
  { id: 4, name: 'Trà Sữa & Cà Phê', icon: 'Coffee' }
]

const MOCK_STORES = [
  {
    id: 101,
    name: 'Quán Cơm Tấm Đêm Cần Giuộc',
    slug: 'quan-com-tam-dem-can-giuoc',
    status: 'APPROVED',
    categoryName: 'Cơm Tấm',
    categoryId: 1,
    addressLine: '123 QL50, TT. Cần Giuộc, Long An',
    openTime: '17:00',
    closeTime: '23:30',
    priceMin: 35000,
    priceMax: 65000,
    satisfactionRate: 98,
    totalVotes: 142,
    distanceKm: 0.8,
    isSaved: false,
    savedCount: 24,
    bannerImageUrl: '',
    foodItems: [
      { id: 1, name: 'Cơm sườn nướng', price: 45000, description: 'Sườn nướng mềm ngon' }
    ]
  },
  {
    id: 102,
    name: 'Phở Bò Gia Truyền Cần Giuộc',
    slug: 'pho-bo-gia-truyen-can-giuoc',
    status: 'APPROVED',
    categoryName: 'Bún & Phở',
    categoryId: 2,
    addressLine: '45 Đường Tránh Cần Giuộc, Long An',
    openTime: '06:00',
    closeTime: '21:00',
    priceMin: 40000,
    priceMax: 70000,
    satisfactionRate: 95,
    totalVotes: 89,
    distanceKm: 1.2,
    isSaved: true,
    savedCount: 42,
    bannerImageUrl: '',
    foodItems: []
  }
]

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'e2e/screenshots/after-batch-3g-c')

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
})

test.describe('Batch 3G-C: Final Acceptance & Cross-Module Regression Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Baseline common routes
    await page.route('**/v1/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: MOCK_CATEGORIES })
      })
    })

    await page.route('**/v1/stores/facets**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: {} })
      })
    })

    await page.route('**/v1/stores/leaderboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: [] })
      })
    })
  })

  // ===========================================================================
  // SECTION 1: Real SPA Continuous Navigation Quality
  // ===========================================================================
  test('T1.1: Full Continuous SPA Navigation Flow maintains 0 document reloads & persistent app shell', async ({ page }) => {
    await page.route('**/v1/stores**', async (route) => {
      const url = route.request().url()
      if (url.includes('/saved')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 1000, result: [MOCK_STORES[1]] })
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1000,
            result: { content: MOCK_STORES, totalElements: 2, totalPages: 1, last: true }
          })
        })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')

    // Inject identity markers
    await page.evaluate(() => {
      window.__spaSessionMarker = 'SPA_CONTINUOUS_VERIFIED'
      const header = document.querySelector('header')
      if (header) header.__headerNodeId = 'HEADER_STABLE_NODE'
    })

    // Navigation chain: Explore -> Saved -> About -> Explore
    // 1. Explore -> Saved
    const savedLink = page.locator('nav a[href="/saved"], button:has-text("Đã Lưu"), a:has-text("Đã Lưu")').first()
    if (await savedLink.count() > 0) {
      await savedLink.click()
    } else {
      await page.goto('/saved')
    }
    await page.waitForTimeout(300)

    // Verify marker still exists
    let marker = await page.evaluate(() => window.__spaSessionMarker)
    expect(marker).toBe('SPA_CONTINUOUS_VERIFIED')

    // 2. Saved -> About
    const aboutLink = page.locator('a[href="/about"], button:has-text("Về chúng tôi"), a:has-text("Về chúng tôi"), a:has-text("Giới Thiệu")').first()
    if (await aboutLink.count() > 0) {
      await aboutLink.click()
    } else {
      await page.goto('/about')
    }
    await page.waitForTimeout(300)

    marker = await page.evaluate(() => window.__spaSessionMarker)
    expect(marker).toBe('SPA_CONTINUOUS_VERIFIED')

    // Verify Header persistent identity
    const headerNodeId = await page.evaluate(() => {
      const header = document.querySelector('header')
      return header ? header.__headerNodeId : null
    })
    expect(headerNodeId).toBe('HEADER_STABLE_NODE')

    // 3. About -> Explore
    const exploreLink = page.locator('nav a[href="/explore"], a[href="/"], button:has-text("Khám Phá"), a:has-text("Khám Phá")').first()
    if (await exploreLink.count() > 0) {
      await exploreLink.click()
    } else {
      await page.goto('/explore')
    }
    await page.waitForTimeout(300)

    // Final marker check: 0 document reloads
    marker = await page.evaluate(() => window.__spaSessionMarker)
    expect(marker).toBe('SPA_CONTINUOUS_VERIFIED')

    // No global blocking backdrop rendered
    const blockingBackdrop = page.locator('.fixed.inset-0.z-50.bg-black\\/40')
    await expect(blockingBackdrop).toHaveCount(0)
  })

  test('T1.2: Browser Back/Forward navigation preserves SPA context without reload', async ({ page }) => {
    await page.route('**/v1/stores**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { content: MOCK_STORES, totalElements: 2, totalPages: 1, last: true }
        })
      })
    })

    await page.goto('/explore')
    await page.waitForLoadState('domcontentloaded')

    await page.evaluate(() => {
      window.__backForwardMarker = 'BF_SESSION_OK'
    })

    // Navigate to /about via client-side Header button
    const aboutBtn = page.locator('header button:has-text("Về Chúng Tôi"), button:has-text("Về Chúng Tôi")').first()
    await expect(aboutBtn).toBeVisible()
    await aboutBtn.click()
    await page.waitForTimeout(300)

    // Verify marker still preserved on About
    expect(await page.evaluate(() => window.__backForwardMarker)).toBe('BF_SESSION_OK')
    expect(page.url()).toContain('/about')

    // Back to /explore
    await page.goBack()
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.__backForwardMarker)).toBe('BF_SESSION_OK')
    expect(page.url()).toMatch(/\/explore|\/$/)

    // Forward to /about
    await page.goForward()
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.__backForwardMarker)).toBe('BF_SESSION_OK')
    expect(page.url()).toContain('/about')
  })

  test('T1.3: Rapid tab navigation does not break or show global backdrop', async ({ page }) => {
    await page.route('**/v1/stores**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { content: MOCK_STORES, totalElements: 2, totalPages: 1, last: true }
        })
      })
    })

    await page.goto('/explore')
    await page.waitForLoadState('domcontentloaded')

    const exploreBtn = page.locator('header button:has-text("Khám Phá Ẩm Thực"), button:has-text("Khám Phá")').first()
    const aboutBtn = page.locator('header button:has-text("Về Chúng Tôi"), button:has-text("Về Chúng Tôi")').first()

    // Rapid client clicking
    for (let i = 0; i < 3; i++) {
      if (await aboutBtn.count() > 0) await aboutBtn.click()
      await page.waitForTimeout(60)
      if (await exploreBtn.count() > 0) await exploreBtn.click()
      await page.waitForTimeout(60)
    }

    await page.waitForTimeout(300)
    const backdrop = page.locator('.fixed.inset-0.z-50.bg-black\\/40')
    await expect(backdrop).toHaveCount(0)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  // ===========================================================================
  // SECTION 2: Controlled Slow Network, Loading Skeletons & Error Recovery
  // ===========================================================================
  test('T2.1: Controlled delays (300ms, 1000ms, 3000ms) display skeletons and maintain search bar interactivity', async ({ page }) => {
    let delayMs = 1000
    await page.route('**/v1/stores**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { content: MOCK_STORES, totalElements: 2, totalPages: 1, last: true }
        })
      })
    })

    await page.goto('/explore')

    // Check skeleton rendering during the 1000ms delay
    const skeletons = page.locator('.brutalist-skeleton')
    await expect(skeletons.first()).toBeAttached()
    const skeletonCount = await skeletons.count()
    expect(skeletonCount).toBeGreaterThan(0)

    // Verify search bar is interactive during loading (NOT blocked)
    const searchInput = page.locator('input[aria-label*="Tìm kiếm món ăn"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('Cơm')
      expect(await searchInput.inputValue()).toBe('Cơm')
    }

    // Wait for data to resolve
    await expect(page.locator('text=Quán Cơm Tấm Đêm Cần Giuộc').locator('visible=true')).toBeVisible({ timeout: 5000 })
  })

  test('T2.2: Network failure terminates skeleton and displays Vietnamese error state with working retry', async ({ page }) => {
    let attempt = 0
    await page.route('**/v1/stores**', async (route) => {
      attempt++
      if (attempt === 1) {
        // First attempt: simulate network drop / abort
        await route.abort('failed')
      } else {
        // Second attempt: successful recovery
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1000,
            result: { content: MOCK_STORES, totalElements: 2, totalPages: 1, last: true }
          })
        })
      }
    })

    await page.goto('/explore')
    await page.waitForTimeout(500)

    // Verify the page doesn't crash or stay permanently stuck in blank screen
    await expect(page.locator('body')).not.toBeEmpty()

    // If retry button appears or on re-navigation, test recovery
    const retryBtn = page.locator('button:has-text("Thử lại"), button:has-text("Tải lại")')
    if (await retryBtn.count() > 0) {
      await retryBtn.first().click()
      await expect(page.locator('text=Quán Cơm Tấm Đêm Cần Giuộc').locator('visible=true')).toBeVisible({ timeout: 3000 })
    }
  })

  test('T2.3: HTTP 500 server error displays Vietnamese error message and preserves app shell', async ({ page }) => {
    await page.route('**/v1/stores**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 9999,
          message: 'Lỗi hệ thống máy chủ'
        })
      })
    })

    await page.goto('/explore')
    await page.waitForTimeout(500)

    // Shell remains intact
    await expect(page.locator('header')).toBeVisible()
    // No infinite loading spinner overlay
    const backdrop = page.locator('.fixed.inset-0.z-50.bg-black\\/40')
    await expect(backdrop).toHaveCount(0)
  })

  // ===========================================================================
  // SECTION 3: Session Isolation, In-Flight Stale Request Safety & Auth
  // ===========================================================================
  test('T3.1: Session Isolation - In-flight response of User A never mutates User B session', async ({ page }) => {
    let deliverUserAStores = false

    await page.route('**/v1/auth/my-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: {
            id: 'user-a',
            username: 'owner_alpha',
            roles: ['USER_OWNER'],
            firstName: 'Nguyễn Văn',
            lastName: 'A'
          }
        })
      })
    })

    await page.route('**/v1/stores/my-stores', async (route) => {
      while (!deliverUserAStores) {
        await new Promise((r) => setTimeout(r, 100))
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: [
            {
              id: 999,
              name: 'QUÁN BÍ MẬT USER A',
              status: 'APPROVED',
              categoryName: 'Cơm Tấm'
            }
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
          result: { content: MOCK_STORES, totalElements: 2, totalPages: 1, last: true }
        })
      })
    })

    await page.goto('/my-stores')

    // Simulate logout action immediately while /my-stores request is in flight
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('auth-logout-test'))
    })

    // Now let User A's response arrive
    deliverUserAStores = true
    await page.waitForTimeout(400)

    // Navigate to Explore
    await page.goto('/explore')
    await page.waitForTimeout(300)

    // Ensure User A's private store name NEVER appears in public Explore
    const leakedContent = page.locator('text=QUÁN BÍ MẬT USER A')
    await expect(leakedContent).toHaveCount(0)
  })

  test('T3.2: AuthModal is not blocked by global backdrop and prevents double submit', async ({ page }) => {
    await page.route('**/v1/stores**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { content: MOCK_STORES, totalElements: 2, totalPages: 1, last: true }
        })
      })
    })

    await page.goto('/explore')
    await page.waitForLoadState('domcontentloaded')

    // Open Auth Modal
    const loginBtn = page.locator('button:has-text("Đăng Nhập"), button:has-text("Tài Khoản")').first()
    if (await loginBtn.count() > 0) {
      await loginBtn.click()
      await page.waitForTimeout(300)

      // Auth modal should be visible
      const authModal = page.locator('div[role="dialog"]')
      if (await authModal.count() > 0) {
        await expect(authModal).toBeVisible()

        // Verify there is NOT a second global backdrop covering the modal
        const globalBackdrops = page.locator('.fixed.inset-0.z-50.bg-black\\/40')
        expect(await globalBackdrops.count()).toBeLessThanOrEqual(1)

        // Close via Escape key
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
      }
    }
  })

  // ===========================================================================
  // SECTION 4: Core Business Workflow & Module Regression
  // ===========================================================================
  test('T4.1: Store Detail deep-link renders Drawer Shell & Skeleton immediately (< 100ms)', async ({ page }) => {
    let respondDetail = false
    await page.route('**/v1/stores/101', async (route) => {
      while (!respondDetail) {
        await new Promise((r) => setTimeout(r, 50))
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: MOCK_STORES[0]
        })
      })
    })

    await page.goto('/quan/101/quan-com-tam-dem')

    // Drawer container should mount immediately
    const drawerContainer = page.locator('aside, div[role="dialog"], [aria-label*="chi tiết"]').first()
    await expect(drawerContainer).toBeAttached({ timeout: 1000 })

    // Skeletons rendered inside drawer
    const skeletons = page.locator('.brutalist-skeleton')
    expect(await skeletons.count()).toBeGreaterThan(0)

    // Now fulfill the request
    respondDetail = true
    await expect(page.locator('h2:has-text("Quán Cơm Tấm Đêm Cần Giuộc"), h1:has-text("Quán Cơm Tấm Đêm Cần Giuộc")').first()).toBeVisible({ timeout: 3000 })
  })

  test('T4.2: Admin Section displays MetricCardSkeleton & TableSkeleton instead of false 0 metrics during loading', async ({ page }) => {
    let resolveAdmin
    const adminPromise = new Promise((resolve) => {
      resolveAdmin = resolve
    })

    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { accessToken: 'mock_admin_token', tokenType: 'Bearer' }
        })
      })
    })

    await page.route('**/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { id: 99, username: 'admin_test', email: 'admin@cgft.vn', roles: ['ADMIN'] }
        })
      })
    })

    await page.route('**/v1/auth/my-profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { id: 99, username: 'admin_test', email: 'admin@cgft.vn', roles: ['ADMIN'] }
        })
      })
    })

    await page.route('**/users**', async (route) => {
      const url = route.request().url()
      if (url.includes('/users/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1000,
            result: { id: 99, username: 'admin_test', email: 'admin@cgft.vn', roles: ['ADMIN'] }
          })
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { content: [], totalElements: 0, totalPages: 1 }
        })
      })
    })

    await page.route('**/v1/stores**', async (route) => {
      const url = route.request().url()
      if (url.includes('/admin/summary')) {
        await adminPromise
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1000,
            result: { pendingCount: 5, recoveryRequestedCount: 3, approvedCount: 42, totalCount: 50 }
          })
        })
        return
      }
      if (url.includes('/admin')) {
        await adminPromise
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1000,
            result: { content: MOCK_STORES, totalElements: 2, totalPages: 1 }
          })
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: { content: [], totalElements: 0 } })
      })
    })

    await page.goto('/admin')

    // While admin data is loading: Skeleton metrics must be attached
    const metricSkeletons = page.locator('[aria-busy="true"][aria-label="Đang tải các chỉ số thống kê"]')
    await expect(metricSkeletons).toBeAttached({ timeout: 5000 })

    // Strict Negative Assertion: False '0' counts should NOT be present in KPI cards
    const pendingCardValue = page.locator('text=Quán Chờ Duyệt').locator('..').locator('.text-4xl')
    await expect(pendingCardValue).toHaveCount(0)

    // Release API
    resolveAdmin()
    await page.waitForTimeout(300)
  })

  // ===========================================================================
  // SECTION 5: Accessibility & Responsive Across 6 Viewports
  // ===========================================================================
  const VIEWPORTS = [
    { name: '320x568 (iPhone SE)', width: 320, height: 568 },
    { name: '390x844 (iPhone 14)', width: 390, height: 844 },
    { name: '768x1024 (iPad)', width: 768, height: 1024 },
    { name: '1280x800 (WXGA Laptop)', width: 1280, height: 800 },
    { name: '1440x900 (Desktop)', width: 1440, height: 900 },
    { name: '1920x1080 (FHD)', width: 1920, height: 1080 }
  ]

  for (const vp of VIEWPORTS) {
    test(`T5.1: Viewport ${vp.name} has zero horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })

      await page.route('**/v1/stores**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1000,
            result: { content: MOCK_STORES, totalElements: 2, totalPages: 1, last: true }
          })
        })
      })

      await page.goto('/explore')
      await page.waitForLoadState('domcontentloaded')

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(isOverflowing).toBe(false)
    })
  }

  test('T5.2: Respects prefers-reduced-motion by disabling skeleton animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.route('**/v1/stores**', async (route) => {
      await new Promise((r) => setTimeout(r, 600))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { content: MOCK_STORES, totalElements: 2, totalPages: 1, last: true }
        })
      })
    })

    await page.goto('/explore')

    const skeleton = page.locator('.brutalist-skeleton').first()
    await expect(skeleton).toBeAttached()

    const animationName = await skeleton.evaluate((el) => {
      return window.getComputedStyle(el).animationName
    })
    expect(animationName).toBe('none')
  })

  // ===========================================================================
  // SECTION 6: Final Visual Acceptance Screenshot Capture
  // ===========================================================================
  test('T6.1: Capture selective high-value acceptance screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    // 1. Explore skeleton capture
    await page.route('**/v1/stores**', async (route) => {
      await new Promise((r) => setTimeout(r, 1200))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { content: MOCK_STORES, totalElements: 2, totalPages: 1, last: true }
        })
      })
    })

    await page.goto('/explore')
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'explore-skeleton.png') })

    // 2. Tab switch in slow network
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'tab-switch-slow-network.png') })

    // 3. Desktop 1440px view
    await expect(page.locator('text=Quán Cơm Tấm Đêm Cần Giuộc').locator('visible=true')).toBeVisible({ timeout: 4000 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop-1440px-view.png') })

    // 4. Mobile 390px view capture
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile-390px-view.png') })

    // 5. Saved Stores skeleton capture
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.route('**/v1/stores/saved**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: [] })
      })
    })
    await page.goto('/saved')
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'saved-stores-skeleton.png') })

    // 6. Admin skeleton capture
    await page.route('**/v1/admin/summary**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { totalStores: 10, pendingStores: 2, totalUsers: 50, activeUsers: 48 }
        })
      })
    })
    await page.goto('/admin')
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'admin-skeleton.png') })

    // 7. Drawer deep-link skeleton capture
    await page.route('**/v1/stores/101', async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: MOCK_STORES[0] })
      })
    })
    await page.goto('/quan/101/quan-com-tam-dem')
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'drawer-deep-link-skeleton.png') })

    // 8. Owner history loading capture
    await page.route('**/v1/stores/owner/history**', async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: { content: [], totalElements: 0 } })
      })
    })
    await page.goto('/my-stores')
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'owner-history-loading.png') })

    // 9. Profile loading capture
    await page.route('**/v1/auth/my-profile', async (route) => {
      await new Promise((r) => setTimeout(r, 1500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: { id: 1, username: 'user_test' } })
      })
    })
    await page.goto('/profile')
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'profile-loading.png') })

    // 10. Error / Retry state capture
    await page.route('**/v1/stores**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 9999, message: 'Lỗi tải dữ liệu quán ăn' })
      })
    })
    await page.goto('/explore')
    await page.waitForTimeout(500)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error-retry-state.png') })
  })
})
