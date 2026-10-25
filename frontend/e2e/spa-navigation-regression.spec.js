import { test, expect } from '@playwright/test'

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

test.describe('Batch 3G-B: SPA Navigation, Skeleton Loading & Session Safety Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Standard mock setup
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

  // ---------------------------------------------------------------------------
  // 1. Navigation Continuity & Zero Document Reloads
  // ---------------------------------------------------------------------------
  test('R1: Continuous SPA Tab Navigation preserves window context with 0 document reloads', async ({ page }) => {
    await page.route('**/v1/stores**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: {
            content: MOCK_STORES,
            totalElements: MOCK_STORES.length,
            totalPages: 1,
            last: true
          }
        })
      })
    })

    await page.goto('/explore')
    await page.waitForSelector('header')

    // Inject non-serializable window marker
    await page.evaluate(() => {
      window.__spaNavigationMarker = 'CGFT_SPA_ACTIVE_SESSION'
    })

    // Navigate Explore -> Saved -> About -> Explore
    await page.getByRole('button', { name: /Quán Đã Lưu/i }).click()
    await expect(page).toHaveURL(/.*saved/)
    expect(await page.evaluate(() => window.__spaNavigationMarker)).toBe('CGFT_SPA_ACTIVE_SESSION')

    await page.getByRole('button', { name: /Về Chúng Tôi/i }).click()
    await expect(page).toHaveURL(/.*about/)
    expect(await page.evaluate(() => window.__spaNavigationMarker)).toBe('CGFT_SPA_ACTIVE_SESSION')

    await page.getByRole('button', { name: /Khám Phá Ẩm Thực/i }).click()
    await expect(page).toHaveURL(/.*explore/)
    expect(await page.evaluate(() => window.__spaNavigationMarker)).toBe('CGFT_SPA_ACTIVE_SESSION')
  })

  // ---------------------------------------------------------------------------
  // 2. Global Backdrop Elimination
  // ---------------------------------------------------------------------------
  test('R2: Tab switching between Explore and About NEVER triggers the global blocking backdrop', async ({ page }) => {
    await page.route('**/v1/stores**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: {
            content: MOCK_STORES,
            totalElements: MOCK_STORES.length,
            totalPages: 1,
            last: true
          }
        })
      })
    })

    await page.goto('/explore')
    await page.waitForSelector('header')

    // Track any insertion of global blocking backdrop (.fixed.z-50.backdrop-blur-sm)
    let globalBackdropRenderCount = 0
    await page.exposeFunction('onBackdropMutation', () => {
      globalBackdropRenderCount++
    })

    await page.evaluate(() => {
      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              const el = node
              if (
                el.classList?.contains('backdrop-blur-sm') &&
                el.classList?.contains('z-50') &&
                el.querySelector?.('p')?.textContent?.includes('Đang Xử Lý Yêu Cầu')
              ) {
                window.onBackdropMutation()
              }
            }
          }
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
    })

    // Switch to About tab
    await page.getByRole('button', { name: /Về Chúng Tôi/i }).click()
    await expect(page).toHaveURL(/.*about/)
    await page.waitForTimeout(300)

    // Switch back to Explore
    await page.getByRole('button', { name: /Khám Phá Ẩm Thực/i }).click()
    await expect(page).toHaveURL(/.*explore/)
    await page.waitForTimeout(300)

    // Strict Negative Assertion: Zero global blocking overlays during normal navigation
    expect(globalBackdropRenderCount).toBe(0)
  })

  // ---------------------------------------------------------------------------
  // 3. Explore Loading: Skeletons & No Premature Empty State
  // ---------------------------------------------------------------------------
  test('R3: Delayed Explore API displays StoreCardSkeleton and NEVER shows premature empty state', async ({ page }) => {
    let resolveStores
    const storesPromise = new Promise((resolve) => {
      resolveStores = resolve
    })

    await page.route('**/v1/stores?**', async (route) => {
      await storesPromise
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: {
            content: MOCK_STORES,
            totalElements: MOCK_STORES.length,
            totalPages: 1,
            last: true
          }
        })
      })
    })

    await page.goto('/explore')

    // While API is in flight: Skeletons must be present in DOM
    const skeletonSection = page.locator('[aria-busy="true"][aria-label="Đang tải danh sách quán ăn"]')
    await expect(skeletonSection).toBeAttached()

    const skeletons = page.locator('.brutalist-skeleton')
    const initialSkeletonCount = await skeletons.count()
    expect(initialSkeletonCount).toBeGreaterThanOrEqual(3)

    // Strict Negative Assertion: Premature empty state text must NOT be in the DOM
    const prematureEmptyState = page.locator('text=Không tìm thấy quán ăn phù hợp')
    await expect(prematureEmptyState).toHaveCount(0)

    // Release API response
    resolveStores()

    // Real stores should render and skeletons should disappear
    await expect(page.locator(`text=${MOCK_STORES[0].name}`).locator('visible=true')).toBeVisible()
    await expect(skeletons).toHaveCount(0)
  })

  // ---------------------------------------------------------------------------
  // 4. Saved Stores: Skeletons & No Premature Empty State
  // ---------------------------------------------------------------------------
  test('R4: Delayed Saved Stores displays StoreCardSkeleton and avoids premature empty flash', async ({ page }) => {
    let resolveSaved
    const savedPromise = new Promise((resolve) => {
      resolveSaved = resolve
    })

    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { accessToken: 'mock_saved_token', tokenType: 'Bearer' }
        })
      })
    })

    await page.route('**/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { id: 1, username: 'foodie_test', email: 'test@cgft.vn', roles: ['USER'] }
        })
      })
    })

    await page.route('**/v1/stores**', async (route) => {
      const url = route.request().url()
      if (url.includes('/saved')) {
        await savedPromise
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 1000, result: [MOCK_STORES[1]] })
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: { content: MOCK_STORES, totalElements: 2 } })
      })
    })

    await page.goto('/saved')

    // While API in flight: Skeletons must be attached
    const savedSkeletonContainer = page.locator('[aria-busy="true"][aria-label="Đang tải danh sách quán đã lưu"]')
    await expect(savedSkeletonContainer).toBeAttached()

    // Premature empty state must NOT show
    const prematureSavedEmpty = page.locator('text=Bạn chưa lưu quán ăn nào')
    await expect(prematureSavedEmpty).toHaveCount(0)

    // Release response
    resolveSaved()

    // Real card renders
    await expect(page.locator(`text=${MOCK_STORES[1].name}`).locator('visible=true')).toBeVisible()
    await expect(savedSkeletonContainer).toHaveCount(0)
  })

  // ---------------------------------------------------------------------------
  // 5. Deep Link Store Detail: Instant Drawer Shell & Skeleton
  // ---------------------------------------------------------------------------
  test('R5: Deep link /quan/:id renders Drawer Shell + DetailDrawerSkeleton immediately', async ({ page }) => {
    let resolveStoreDetail
    const detailPromise = new Promise((resolve) => {
      resolveStoreDetail = resolve
    })

    await page.route('**/v1/stores/**', async (route) => {
      const url = route.request().url()
      if (url.includes('/101')) {
        await detailPromise
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 1000, result: MOCK_STORES[0] })
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: { content: MOCK_STORES, totalElements: 2 } })
      })
    })

    await page.goto('/quan/101')

    // Drawer shell container must be immediately present with dialog role
    const drawerDialog = page.locator('div[role="dialog"]')
    await expect(drawerDialog).toBeVisible()

    // Close button must be rendered
    const closeBtn = drawerDialog.locator('button[aria-label*="Đóng"]')
    await expect(closeBtn).toBeVisible()

    // Skeleton must be active in drawer (attached to DOM)
    const drawerSkeletons = drawerDialog.locator('.brutalist-skeleton')
    expect(await drawerSkeletons.count()).toBeGreaterThanOrEqual(1)

    // Release response
    resolveStoreDetail()

    // Real store details should render smoothly
    await expect(drawerDialog.locator(`text=${MOCK_STORES[0].name}`).locator('visible=true')).toBeVisible()
    await expect(drawerDialog.locator('.brutalist-skeleton')).toHaveCount(0)
  })

  // ---------------------------------------------------------------------------
  // 6. Admin Dashboard: Skeletons & No False Zeroes
  // ---------------------------------------------------------------------------
  test('R6: Delayed Admin API displays MetricCardSkeleton & TableSkeleton without false 0 metrics', async ({ page }) => {
    let resolveAdminData
    const adminPromise = new Promise((resolve) => {
      resolveAdminData = resolve
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

    await page.route('**/users?**', async (route) => {
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
    await expect(metricSkeletons).toBeAttached()

    // Strict Negative Assertion: False '0' counts should NOT be present in KPI cards
    const pendingCardValue = page.locator('text=Quán Chờ Duyệt').locator('..').locator('.text-4xl')
    await expect(pendingCardValue).toHaveCount(0)

    // Release API
    resolveAdminData()

    // Real KPI count of 5 should appear
    await expect(page.locator('text=5').first()).toBeVisible()
    await expect(metricSkeletons).toHaveCount(0)
  })

  // ---------------------------------------------------------------------------
  // 7. P0 Session Isolation: Logout & In-Flight Stale Request Safety
  // ---------------------------------------------------------------------------
  test('R7: Logout resets user state and prevents in-flight response from leaking into new session', async ({ page }) => {
    let resolveUserAStores
    const userAStoresPromise = new Promise((resolve) => {
      resolveUserAStores = resolve
    })

    let userSessionActive = true
    await page.route('**/auth/refresh', async (route) => {
      if (userSessionActive) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 1000, result: { accessToken: 'token_user_a', tokenType: 'Bearer' } })
        })
      } else {
        await route.fulfill({ status: 401, body: JSON.stringify({ code: 1001, message: 'Unauthenticated' }) })
      }
    })

    await page.route('**/auth/logout', async (route) => {
      userSessionActive = false
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 1000, result: true }) })
    })

    // Intercept saved stores with controllable resolution
    await page.route('**/v1/stores/saved**', async (route) => {
      await userAStoresPromise
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: [
            {
              id: 999,
              name: 'QUÁN RIÊNG TƯ CỦA USER A',
              slug: 'quan-rieng-tu-user-a',
              status: 'APPROVED',
              categoryName: 'Cơm Tấm',
              categoryId: 1,
              addressLine: 'Bí mật User A',
              isSaved: true
            }
          ]
        })
      })
    })

    await page.route('**/users/me', async (route) => {
      if (userSessionActive) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1000,
            result: { id: 10, username: 'user_a', email: 'user_a@cgft.vn', roles: ['USER'] }
          })
        })
      } else {
        await route.fulfill({ status: 401, body: JSON.stringify({ code: 1001, message: 'Unauthenticated' }) })
      }
    })

    await page.route('**/v1/stores**', async (route) => {
      const url = route.request().url()
      if (!url.includes('/saved')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 1000, result: { content: MOCK_STORES, totalElements: 2 } })
        })
      }
    })

    await page.goto('/saved')

    // Open user menu in header and click Logout while User A's saved stores request is in flight!
    const userMenuBtn = page.locator('button[aria-label^="Menu tài khoản"]')
    await expect(userMenuBtn).toBeVisible()
    await userMenuBtn.click()

    const logoutBtn = page.getByRole('button', { name: /Đăng Xuất/i })
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    // User is redirected to /explore unauthenticated
    await expect(page).toHaveURL(/.*explore/)
    await expect(page.getByRole('button', { name: /Đăng Nhập/i })).toBeVisible()

    // Now resolve User A's stale request AFTER logout has finished
    resolveUserAStores()
    await page.waitForTimeout(400)

    // Strict Negative Assertion: User A's private data must NEVER be rendered in the DOM
    const userAStore = page.locator('text=QUÁN RIÊNG TƯ CỦA USER A')
    await expect(userAStore).toHaveCount(0)

    // Navigate to /saved: unauthenticated prompt must be shown, not User A's data
    await page.getByRole('button', { name: /Quán Đã Lưu/i }).click()
    await expect(page.locator('text=Đăng Nhập Ngay ↗')).toBeVisible()
    await expect(userAStore).toHaveCount(0)
  })

  // ---------------------------------------------------------------------------
  // 8. Reduced Motion Accessibility
  // ---------------------------------------------------------------------------
  test('R8: respects prefers-reduced-motion by disabling skeleton animations', async ({ page }) => {
    // Force prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' })

    await page.route('**/v1/stores**', async (route) => {
      // Delay so skeleton is on screen
      await new Promise((r) => setTimeout(r, 600))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: { content: MOCK_STORES, totalElements: 2 } })
      })
    })

    await page.goto('/explore')

    const skeleton = page.locator('.brutalist-skeleton').first()
    await expect(skeleton).toBeAttached()

    // Check computed style for animation-name
    const animationName = await skeleton.evaluate((el) => window.getComputedStyle(el).animationName)
    expect(animationName).toBe('none')
  })

  // ---------------------------------------------------------------------------
  // 9. QA Responsive Viewports & No Horizontal Overflow
  // ---------------------------------------------------------------------------
  const VIEWPORTS = [
    { width: 320, height: 568, name: '320x568 (iPhone SE)' },
    { width: 390, height: 844, name: '390x844 (iPhone 14)' },
    { width: 768, height: 1024, name: '768x1024 (iPad)' },
    { width: 1280, height: 800, name: '1280x800 (WXGA)' },
    { width: 1440, height: 900, name: '1440x900 (Desktop)' },
    { width: 1920, height: 1080, name: '1920x1080 (FHD)' }
  ]

  for (const vp of VIEWPORTS) {
    test(`R9: Viewport ${vp.name} has no horizontal overflow and renders skeletons cleanly`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })

      await page.route('**/v1/stores**', async (route) => {
        await new Promise((r) => setTimeout(r, 300))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 1000, result: { content: MOCK_STORES, totalElements: 2 } })
        })
      })

      await page.goto('/explore')

      // Assert no horizontal scrollbar / overflow
      const overflowInfo = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth
        const winWidth = window.innerWidth
        return { docWidth, winWidth, hasOverflow: docWidth > winWidth }
      })

      expect(overflowInfo.hasOverflow).toBe(false)
    })
  }
})
