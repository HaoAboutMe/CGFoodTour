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

async function setupMockAuth(page, role = 'USER') {
  const isAdminUser = role === 'ADMIN'

  const mockUser = {
    id: isAdminUser ? 1 : 2,
    username: isAdminUser ? 'admintest' : 'foodietest',
    email: isAdminUser ? 'admin@cangiuocfood.vn' : 'foodie@cangiuocfood.vn',
    firstname: isAdminUser ? 'Admin' : 'Ngọc Trâm',
    lastname: 'Test',
    role: role,
    roles: [role],
    avatarUrl: ''
  }

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
          { id: 1, name: 'Bún & Phở', icon: 'Soup' },
          { id: 2, name: 'Cơm Tấm', icon: 'Utensils' },
          { id: 3, name: 'Hải Sản', icon: 'Fish' }
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
        result: {
          content: [
            { id: '1', name: 'Quán Ăn Cần Giuộc 1', status: 'APPROVED', rating: 4.8, totalReviews: 12 },
            { id: '2', name: 'Quán Ăn Cần Giuộc 2', status: 'APPROVED', rating: 4.5, totalReviews: 8 }
          ],
          totalPages: 1,
          totalElements: 2,
          page: 0,
          last: true
        }
      })
    })
  })

  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('cgft_access_token', token)
    localStorage.setItem('cgft_user', JSON.stringify(user))
  }, { token: validMockJwt, user: mockUser })

  await page.goto('/explore')
  await page.waitForTimeout(600)
}

test.describe('Phase 4B-1 UX Refinement: Header Search & Dedicated Explore Filters', () => {

  // Test 1: Header Quick Search visible and clickable on Mobile & Tablet (< 1024px)
  test('UX-A: Header Quick Search visible, clickable and accessible on mobile & tablet', async ({ page }) => {
    for (const width of [320, 375, 768, 820]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/explore')
      await page.waitForTimeout(500)

      const headerSearchBtn = page.locator('#header-search-btn')
      await expect(headerSearchBtn).toBeVisible()
      await expect(headerSearchBtn).toHaveAttribute('aria-label', 'Tìm kiếm quán ăn')

      const box = await headerSearchBtn.boundingBox()
      expect(box).not.toBeNull()
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)

      // Clicking opens the dedicated Search & Filter modal
      await headerSearchBtn.click()
      const searchModal = page.locator('#search-filter-dialog')
      await expect(searchModal).toBeVisible()

      if (width === 390 || width === 375) {
        await page.screenshot({
          path: `e2e/screenshots/phase-4b1-refinement/search-modal-${width}px.png`,
          fullPage: false
        })
      }

      // Close modal
      const closeBtn = page.locator('#search-filter-close-btn')
      await closeBtn.click()
      await expect(searchModal).not.toBeVisible()
    }
  })

  // Test 2: No duplicate Profile Dropdown on mobile/tablet when authenticated
  test('UX-A: Authenticated user on mobile/tablet does not have duplicate avatar dropdown in Header', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    await setupMockAuth(page, 'USER')

    // Header Quick Search must be visible
    const headerSearchBtn = page.locator('#header-search-btn')
    await expect(headerSearchBtn).toBeVisible()

    // Header avatar dropdown button MUST be hidden on mobile (< 1024px)
    const headerAvatarBtn = page.locator('button[aria-label*="Menu tài khoản của"]')
    await expect(headerAvatarBtn).toBeHidden()

    // When authenticated on responsive, About and Login buttons are hidden (Header ONLY has Search!)
    await expect(page.locator('#header-about-btn')).toBeHidden()
    await expect(page.locator('#login-btn')).toBeHidden()

    // BottomNav Account Tab remains the single, primary account entry point
    const bottomNav = page.locator('nav[aria-label="Thanh điều hướng dưới di động"]')
    await expect(bottomNav).toBeVisible()
    const accountTab = bottomNav.locator('button').nth(3)
    await expect(accountTab).toContainText('Tài Khoản')

    // Tapping Account Tab opens the mobile Account Sheet
    await accountTab.click()
    const accountSheet = page.locator('#mobile-account-sheet')
    await expect(accountSheet).toBeVisible()
    await expect(accountSheet).toContainText('Ngọc Trâm')

    await page.screenshot({
      path: `e2e/screenshots/phase-4b1-refinement/authenticated-header-search-mobile.png`,
      fullPage: false
    })

    // Close account sheet
    await page.locator('#mobile-account-sheet-close-btn').click()
    await expect(accountSheet).not.toBeVisible()
    await context.close()
  })

  // Test 3: Anonymous visitors see Header Search and About; Login is accessed via BottomNav
  test('UX-A: Anonymous visitors see Header Search and About; Login is accessed through BottomNav', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/explore')
    await page.waitForTimeout(500)

    // Header has Search and About buttons (>= 44x44px), login-btn is hidden on mobile
    await expect(page.locator('#header-search-btn')).toBeVisible()
    const headerAboutBtn = page.locator('#header-about-btn')
    await expect(headerAboutBtn).toBeVisible()
    await expect(page.locator('#login-btn')).toBeHidden()

    const aboutBox = await headerAboutBtn.boundingBox()
    expect(aboutBox.width).toBeGreaterThanOrEqual(44)
    expect(aboutBox.height).toBeGreaterThanOrEqual(44)

    await page.screenshot({
      path: `e2e/screenshots/phase-4b1-refinement/anonymous-header-about-mobile.png`,
      fullPage: false
    })

    // Clicking About navigates to About tab
    await headerAboutBtn.click()
    await page.waitForTimeout(300)
    await expect(page.locator('#header-about-btn')).toHaveClass(/bg-\[#c92a2a\]/)

    // Return to explore
    await page.goto('/explore')
    await page.waitForTimeout(300)

    // BottomNav provides login for anonymous visitors
    const bottomNav = page.locator('nav[aria-label="Thanh điều hướng dưới di động"]')
    const loginTab = bottomNav.locator('button').nth(3)
    await expect(loginTab).toContainText('Đăng Nhập')

    await loginTab.click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  // Test 4: Simplified Explore on mobile/tablet keeps stalls visible early with NO redundant search button
  test('UX-B: Simplified Explore removes redundant search button while keeping quick filters and stalls visible early', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/explore')
    await page.waitForTimeout(500)

    // Hero Banner is present
    await expect(page.locator('h1')).toContainText('Bản Đồ Ẩm Thực Cần Giuộc')

    // Quick filters Gần Tôi and Đang Mở Cửa are visible in fast deck
    await expect(page.locator('#filter-near-me-btn')).toBeVisible()
    await expect(page.locator('#filter-open-now-btn')).toBeVisible()

    // Redundant Explore Search/Filter button MUST be completely removed
    await expect(page.locator('#explore-open-search-filter-btn')).toHaveCount(0)

    // Header Search button remains the primary access point to SearchFilterModal
    await expect(page.locator('#header-search-btn')).toBeVisible()

    // Long desktop search bar input is hidden on mobile (< 1024px)
    const desktopSearchInput = page.locator('input[aria-label="Tìm kiếm quán ăn, địa chỉ tại Cần Giuộc"]')
    await expect(desktopSearchInput).toBeHidden()

    // Desktop categories row is hidden on mobile (< 1024px)
    const desktopCategoriesTitle = page.locator('text=Danh Mục Món Ăn')
    await expect(desktopCategoriesTitle).toBeHidden()

    // Live stalls section header is immediately accessible
    const stallsHeading = page.locator('text=LIVE STALLS')
    await expect(stallsHeading).toBeVisible()

    await page.screenshot({
      path: `e2e/screenshots/phase-4b1-refinement/simplified-mobile-explore-390px.png`,
      fullPage: false
    })
  })

  // Test 5: Redesigned Category Selection - Single row in Main View + Dedicated Category Picker Subview
  test('UX-C: Category selector uses dedicated picker subview supporting 150+ categories with instant search & multi-select', async ({ page }) => {
    // Generate synthetic 150 categories
    const syntheticCategories = Array.from({ length: 150 }, (_, i) => ({
      id: 1000 + i,
      name: `Món Ngon Loại ${i + 1} (${i % 2 === 0 ? 'Phở' : 'Bún'} Cần Giuộc)`,
      icon: 'Utensils'
    }))

    await page.route('**/v1/categories', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: syntheticCategories
        })
      })
    })

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/explore')
    await page.waitForTimeout(500)

    // Open Search & Filter screen via Header Search
    await page.locator('#header-search-btn').click()
    const dialog = page.locator('#search-filter-dialog')
    await expect(dialog).toBeVisible()

    // Main view MUST NOT render full category checkbox list or scrollable checkbox container
    await expect(dialog.locator('button[data-category-item="true"]')).toHaveCount(0)

    // Main view displays a clean, single-row entry point with chevron
    const openCategoryBtn = dialog.locator('#open-category-picker-btn')
    await expect(openCategoryBtn).toBeVisible()
    await expect(openCategoryBtn).toContainText('Tất cả danh mục')

    await page.screenshot({
      path: `e2e/screenshots/phase-4b1-refinement/main-search-filter-view-390px.png`,
      fullPage: false
    })

    // Tap category row to open Dedicated Category Picker Subview
    await openCategoryBtn.click()

    // Category Picker subview header is visible with Back and Done buttons
    const backBtn = dialog.locator('#category-picker-back-btn')
    const doneBtn = dialog.locator('#category-picker-done-btn')
    await expect(backBtn).toBeVisible()
    await expect(doneBtn).toBeVisible()

    // Instant Category Name Filter input is present
    const categoryFilterInput = dialog.locator('#category-search-filter-input')
    await expect(categoryFilterInput).toBeVisible()

    // Accent-insensitive Vietnamese search: typing 'pho' matches 'Phở'
    await categoryFilterInput.fill('pho')
    await page.waitForTimeout(300)

    // Only categories matching "Phở" should be visible
    const filteredButtons = dialog.locator('button[data-category-item="true"]')
    const count = await filteredButtons.count()
    expect(count).toBeGreaterThan(0)
    expect(count).toBeLessThan(150)

    // Select 2 categories (Multi-select)
    await filteredButtons.nth(0).click()
    await filteredButtons.nth(1).click()

    // Selected count badge should show 2
    const selectedBadge = dialog.locator('#category-selected-count-badge')
    await expect(selectedBadge).toContainText('2 đã chọn')

    await page.screenshot({
      path: `e2e/screenshots/phase-4b1-refinement/scalable-category-picker-subview.png`,
      fullPage: false
    })

    // Click "Xong" to return to Main SearchFilter view
    await doneBtn.click()

    // Back on Main SearchFilter View: Category row now reflects the 2 selected categories in Draft
    await expect(openCategoryBtn).toContainText('2 danh mục đã chọn')
    // No checkbox list on main view
    await expect(dialog.locator('button[data-category-item="true"]')).toHaveCount(0)

    // Reopen picker to verify draft persistence and Clear Selection action
    await openCategoryBtn.click()
    await expect(selectedBadge).toContainText('2 đã chọn')

    const clearCatBtn = dialog.locator('#category-clear-selection-btn')
    await expect(clearCatBtn).toBeVisible()
    await clearCatBtn.click()
    await expect(selectedBadge).toBeHidden()

    // Done and return to Main View
    await doneBtn.click()
    await expect(openCategoryBtn).toContainText('Tất cả danh mục')
  })

  // Test 6: Draft / Apply Model - changing draft does not refetch until Apply; Cancel discards draft
  test('UX-C: Draft/Apply Model - changing draft does not refetch until Apply; Cancel preserves applied filters', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()

    let storeFetchCount = 0
    await page.route('**/v1/stores/events**', (route) => route.abort())
    await page.route('**/*categories*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: [
            { id: 1, name: 'Bún & Phở', icon: 'Soup' },
            { id: 2, name: 'Cơm Tấm', icon: 'Utensils' }
          ]
        })
      })
    })

    await page.route('**/v1/stores**', async (route) => {
      storeFetchCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: {
            content: [
              {
                id: 's-test-1',
                name: 'Quán Cháo Lòng Cần Giuộc',
                status: 'APPROVED',
                addressLine: '123 Quốc lộ 50',
                rating: 4.8,
                totalReviews: 12
              }
            ],
            page: 0,
            totalPages: 1,
            totalElements: 1,
            last: true
          }
        })
      })
    })

    await page.goto('/explore')
    await page.waitForTimeout(600)
    const initialFetchCount = storeFetchCount

    // Open Search & Filter screen
    await page.locator('#header-search-btn').click()
    const dialog = page.locator('#search-filter-dialog')
    await expect(dialog).toBeVisible()

    // Type into draft search input
    const searchInput = page.locator('#search-filter-query-input')
    await searchInput.fill('Bún bò')

    // Toggle draft Open Now
    const draftOpenNow = page.locator('#modal-filter-open-now-btn')
    await draftOpenNow.click()

    // Wait 500ms: store fetch count must NOT have increased while editing draft
    await page.waitForTimeout(500)
    expect(storeFetchCount).toBe(initialFetchCount)

    // Close with Cancel / Close button
    await page.locator('#search-filter-close-btn').click()
    await expect(dialog).not.toBeVisible()

    // Explore should NOT show the draft search query
    await expect(page.locator('#applied-query-badge')).toBeHidden()
    expect(storeFetchCount).toBe(initialFetchCount)

    // Reopen modal: draft must have reset to original applied values (empty)
    await page.locator('#header-search-btn').click()
    await expect(dialog).toBeVisible()
    await expect(searchInput).toHaveValue('')

    // Now type a new query and click Apply
    await searchInput.fill('Cháo lòng')
    const applyBtn = page.locator('#search-filter-apply-btn')
    await applyBtn.click()

    // Modal closes
    await expect(dialog).not.toBeVisible()

    // Applied query chip appears in Explore fast deck
    const appliedBadge = page.locator('#applied-query-badge')
    await expect(appliedBadge).toBeVisible()
    await expect(appliedBadge).toContainText('Cháo lòng')

    // Server was queried with the new committed filter
    await page.waitForTimeout(500)
    expect(storeFetchCount).toBeGreaterThan(initialFetchCount)

    await context.close()
  })

  // Test 7: Applied filters persist across SPA navigation (Explore <-> CS2 Spinner <-> Saved <-> Explore)
  test('UX-C: Applied filters persist across SPA navigation without leaking or resetting prematurely', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    await page.route('**/v1/stores/events**', (route) => route.abort())

    await page.goto('/explore')
    await page.waitForTimeout(500)

    // Apply a search filter
    await page.locator('#header-search-btn').click()
    await page.locator('#search-filter-query-input').fill('Hủ tiếu')
    await page.locator('#search-filter-apply-btn').click()

    // Confirm filter badge in Explore
    const filterBadge = page.locator('#applied-query-badge')
    await expect(filterBadge).toBeVisible()
    await expect(filterBadge).toContainText('Hủ tiếu')

    // Navigate to CS2 Spinner tab via BottomNav
    const bottomNav = page.locator('nav[aria-label="Thanh điều hướng dưới di động"]')
    await bottomNav.locator('button').nth(1).click() // Vòng Xoay
    await page.waitForTimeout(400)
    expect(page.url()).toContain('/cs2-spinner')

    // Navigate back to Explore tab
    await bottomNav.locator('button').nth(0).click() // Khám Phá
    await page.waitForTimeout(400)
    expect(page.url()).toContain('/explore')

    // Filter badge "Hủ tiếu" must still be present!
    await expect(page.locator('#applied-query-badge')).toBeVisible()
    await expect(page.locator('#applied-query-badge')).toContainText('Hủ tiếu')

    // Clicking ✕ on the applied query chip clears it cleanly
    const clearQueryBtn = page.locator('#applied-query-badge button')
    await clearQueryBtn.click()
    await expect(page.locator('#applied-query-badge')).toBeHidden()

    await context.close()
  })

  // Test 8: Desktop Phase 3 UX Baseline remains 100% untouched
  test('UX-DESKTOP: Desktop (>= 1024px) retains full Phase 3 Header and Explore controls', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')
    await page.waitForTimeout(600)

    // Mobile Header Search button MUST be hidden on desktop
    const headerSearchBtn = page.locator('#header-search-btn')
    await expect(headerSearchBtn).toBeHidden()

    // Desktop Header Navigation Links must be visible
    const desktopNav = page.locator('nav[aria-label="Điều hướng chính"]')
    await expect(desktopNav).toBeVisible()

    // Desktop Explore long search bar must be visible
    const desktopSearch = page.locator('input[aria-label="Tìm kiếm quán ăn, địa chỉ tại Cần Giuộc"]')
    await expect(desktopSearch).toBeVisible()

    // Desktop NativeSelect for categories must be visible
    const desktopSelect = page.locator('#explore-category-select')
    await expect(desktopSelect).toBeVisible()

    // Desktop category pills grid must be visible
    const desktopCategoryPills = page.locator('text=Danh Mục Món Ăn')
    await expect(desktopCategoryPills).toBeVisible()

    // BottomNav must be hidden on desktop
    const bottomNav = page.locator('nav[aria-label="Thanh điều hướng dưới di động"]')
    await expect(bottomNav).toBeHidden()

    await page.screenshot({
      path: `e2e/screenshots/phase-4b1-refinement/desktop-baseline-1440px.png`,
      fullPage: false
    })
  })

  // Test 9: Complete 9-Viewport Zero-Overflow Sweep with Search/Filter Screen
  for (const vp of VIEWPORTS) {
    test(`Zero Horizontal Overflow: ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/explore')
      await page.waitForTimeout(400)

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasOverflow: doc.scrollWidth > doc.clientWidth
        }
      })
      expect(overflow.hasOverflow).toBe(false)

      // Open Search modal on mobile/tablet viewports and verify modal has zero overflow
      if (vp.width < 1024) {
        await page.locator('#header-search-btn').click()
        const dialog = page.locator('#search-filter-dialog')
        await expect(dialog).toBeVisible()

        const modalOverflow = await page.evaluate(() => {
          const doc = document.documentElement
          return {
            scrollWidth: doc.scrollWidth,
            clientWidth: doc.clientWidth,
            hasOverflow: doc.scrollWidth > doc.clientWidth
          }
        })
        expect(modalOverflow.hasOverflow).toBe(false)

        await page.keyboard.press('Escape')
        await expect(dialog).not.toBeVisible()
      }
    })
  }
})
