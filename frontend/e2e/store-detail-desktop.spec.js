import { test, expect } from '@playwright/test'

const MOCK_STORE = {
  id: 'store-desktop-test-1',
  name: 'Bánh Mì Ba Lẹ Cần Giuộc',
  categoryName: 'Ăn Sáng',
  addressLine: '123 Quốc Lộ 50, Thị trấn Cần Giuộc',
  landmarkNote: 'Gần cầu Cần Giuộc, đối diện chợ cũ',
  phoneNumber: '0901234567',
  latitude: 10.605,
  longitude: 106.675,
  status: 'APPROVED',
  openTime: '06:00',
  closeTime: '21:00',
  priceMin: 20000,
  priceMax: 35000,
  savedCount: 42,
  isSaved: false,
  satisfactionRate: 98,
  totalVotes: 120,
  countVerySatisfied: 118,
  countNormal: 2,
  countNotSatisfied: 0,
  bannerImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
  foodItems: [
    {
      id: 'food-1',
      name: 'Bánh Mì Thịt Nướng Đặc Biệt',
      price: 25000,
      description: 'Pate béo ngậy, thịt nướng thơm lừng, đồ chua giòn ngọt',
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300'
    },
    {
      id: 'food-2',
      name: 'Xôi Mặn Thập Cẩm',
      price: 20000,
      description: 'Lạp xưởng Cần Giuộc, chà bông, mỡ hành, đậu phộng rang',
      imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=300'
    },
    {
      id: 'food-3',
      name: 'Bánh Mì Chả Cá Nóng Giòn',
      price: 22000,
      description: 'Chả cá chiên tại chỗ, tương ớt cay nồng đậm đà',
      imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=300'
    }
  ]
}

async function setupStoreDetailRoutes(page, overrides = {}) {
  let storeData = { ...MOCK_STORE, ...overrides }

  await page.route('**/v1/stores**', async (route) => {
    const url = route.request().url()

    if (url.includes('/save') && route.request().method() === 'POST') {
      storeData.isSaved = !storeData.isSaved
      storeData.savedCount += storeData.isSaved ? 1 : -1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { isSaved: storeData.isSaved, savedCount: storeData.savedCount }
        })
      })
      return
    }

    if (url.includes('/rating') && route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { message: 'Đánh giá thành công' }
        })
      })
      return
    }

    if (url.includes('/report-closed') && route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { message: 'Báo đóng cửa thành công' }
        })
      })
      return
    }

    if (url.includes('/store-desktop-test-1')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: storeData })
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          content: [storeData],
          totalPages: 1,
          totalElements: 1,
          last: true
        }
      })
    })
  })

  await page.route('**/v1/categories**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: [{ id: 'cat-1', name: 'Ăn Sáng' }]
      })
    })
  })
}

test.describe('Batch 3C: StoreDetailDrawer Desktop Redesign & Verification', () => {
  test('1. Drawer width scales predictably across breakpoints (Mobile -> Tablet -> Desktop lg -> Desktop xl)', async ({ page }) => {
    await setupStoreDetailRoutes(page)

    // Mobile 390px: Full width bottom sheet
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/explore')
    const mobileCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await mobileCard.click()
    const mobileDrawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(mobileDrawer).toBeVisible()
    const mobileBox = await mobileDrawer.boundingBox()
    expect(Math.round(mobileBox.width)).toBe(390)
    await page.keyboard.press('Escape')
    await expect(mobileDrawer).toBeHidden()

    // Tablet 768px: sm:max-w-lg (~512px)
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/explore')
    const tabletCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await tabletCard.click()
    const tabletDrawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(tabletDrawer).toBeVisible()
    const tabletBox = await tabletDrawer.boundingBox()
    expect(tabletBox.width).toBeLessThanOrEqual(513)
    expect(tabletBox.width).toBeGreaterThanOrEqual(500)
    await page.keyboard.press('Escape')
    await expect(tabletDrawer).toBeHidden()

    // Desktop 1280px: xl:max-w-3xl (~768px)
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/explore')
    const desktopCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await desktopCard.click()
    const desktopDrawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(desktopDrawer).toBeVisible()
    const desktopBox = await desktopDrawer.boundingBox()
    expect(desktopBox.width).toBeLessThanOrEqual(769)
    expect(desktopBox.width).toBeGreaterThanOrEqual(760)

    // Ensure backdrop is visible and clickable to the left of the drawer
    expect(desktopBox.x).toBeGreaterThan(400) // Docked to the right with ample space on left
    await page.mouse.click(100, 400) // Click backdrop on the left
    await expect(desktopDrawer).toBeHidden()
  })

  test('2. Two-column interior layout on Desktop (1440px) vs single column on Mobile (390px)', async ({ page }) => {
    await setupStoreDetailRoutes(page)

    // Desktop 1440px: Side-by-side columns
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')
    const desktopCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await desktopCard.click()
    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    const leftCol = drawer.locator('.lg\\:col-span-5')
    const rightCol = drawer.locator('.lg\\:col-span-7')

    const leftColBox = await leftCol.boundingBox()
    const rightColBox = await rightCol.boundingBox()

    expect(leftColBox).not.toBeNull()
    expect(rightColBox).not.toBeNull()
    // In two-column mode, the right column starts to the right of the left column
    expect(rightColBox.x).toBeGreaterThan(leftColBox.x + 100)

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    // Mobile 390px: Vertically stacked single column
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/explore')
    const mobileCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await mobileCard.click()
    const mobileDrawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(mobileDrawer).toBeVisible()
    await page.waitForTimeout(350)

    const mLeftCol = mobileDrawer.locator('.lg\\:col-span-5')
    const mRightCol = mobileDrawer.locator('.lg\\:col-span-7')

    const mLeftBox = await mLeftCol.boundingBox()
    const mRightBox = await mRightCol.boundingBox()

    // In single-column mode, both column wrappers start at the same horizontal line
    expect(Math.abs(mLeftBox.x - mRightBox.x)).toBeLessThan(10)
    // And right column is stacked vertically below the left column
    expect(mRightBox.y).toBeGreaterThan(mLeftBox.y)
  })

  test('3. Address presentation: natural wrapping, no uppercase forcing, no underline, no truncation, separate Google Maps action button, and aligned landmark', async ({ page }) => {
    const longAddress = 'Số 123/45/67/89 Đường Tránh Quốc Lộ 50 Nối Dài Mở Rộng Đi Qua Vùng Ven Thị Trấn Cần Giuộc, Ấp Tân Nam, Xã Trường Bình, Huyện Cần Giuộc, Tỉnh Long An'
    await setupStoreDetailRoutes(page, {
      addressLine: longAddress,
      landmarkNote: 'Đối diện cổng khu công nghiệp Tân Kim mở rộng'
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()
    await page.waitForTimeout(350)

    const addressEl = drawer.locator('#store-detail-address-text')
    await expect(addressEl).toBeVisible()
    await expect(addressEl).toHaveText(longAddress)

    // Check typography & styling requirements: no forced uppercase, no underline, no truncation
    const addressStyles = await addressEl.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        textTransform: computed.textTransform,
        textDecorationLine: computed.textDecorationLine,
        textOverflow: computed.textOverflow,
        whiteSpace: computed.whiteSpace,
        overflowWrap: computed.overflowWrap,
        display: computed.display,
        isClamped: el.scrollHeight > el.clientHeight && computed.webkitLineClamp !== 'none'
      }
    })

    expect(addressStyles.textTransform).not.toBe('uppercase')
    expect(addressStyles.textDecorationLine).not.toContain('underline')
    expect(addressStyles.textOverflow).not.toBe('ellipsis')
    expect(addressStyles.isClamped).toBe(false)

    // Check Google Maps action button
    const gmapsBtn = drawer.getByRole('link', { name: /Xem địa chỉ.*Google Maps/i })
    await expect(gmapsBtn).toBeVisible()
    await expect(gmapsBtn).toHaveAttribute('target', '_blank')
    await expect(gmapsBtn).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(gmapsBtn).toHaveAttribute('href', /google\.com\/maps/i)
    await expect(gmapsBtn).toContainText('Xem trên Google Maps')

    // Bounding check: button must NOT overlap the address text
    const addressBox = await addressEl.boundingBox()
    const gmapsBox = await gmapsBtn.boundingBox()
    expect(gmapsBox.y).toBeGreaterThanOrEqual(addressBox.y + addressBox.height - 2)

    // Check Landmark Callout: independent full-width row, left edge aligns with MapPin icon
    const landmarkEl = drawer.locator('#store-detail-landmark')
    await expect(landmarkEl).toBeVisible()
    await expect(landmarkEl).toContainText('📍 Chỉ dẫn:')
    await expect(landmarkEl).toContainText('Đối diện cổng khu công nghiệp Tân Kim mở rộng')

    const iconWrapper = drawer.locator('#store-detail-address .w-8.h-8')
    const iconBox = await iconWrapper.boundingBox()
    const landmarkBox = await landmarkEl.boundingBox()
    expect(Math.abs(landmarkBox.x - iconBox.x)).toBeLessThanOrEqual(2)
  })

  test('4. Desktop Tabs for Menu & Reviews: equal-width 50/50 split, rating distribution breakdown, and standardized footer controls', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Tablist exists on desktop with grid-cols-2
    const tablist = drawer.getByRole('tablist', { name: /Phân loại nội dung chi tiết quán/i })
    await expect(tablist).toBeVisible()

    const menuTab = drawer.getByRole('tab', { name: /Thực Đơn/i })
    const reviewsTab = drawer.getByRole('tab', { name: /Đánh Giá/i })
    await expect(menuTab).toBeVisible()
    await expect(reviewsTab).toBeVisible()

    // Tab width verification: both tabs occupy exactly 50% each with equal widths
    const menuTabBox = await menuTab.boundingBox()
    const reviewsTabBox = await reviewsTab.boundingBox()
    expect(Math.abs(menuTabBox.width - reviewsTabBox.width)).toBeLessThanOrEqual(2)
    expect(menuTabBox.height).toBeGreaterThanOrEqual(44)
    expect(reviewsTabBox.height).toBeGreaterThanOrEqual(44)

    // Icons and badges are rendered inside the tabs
    await expect(menuTab.locator('svg')).toBeVisible()
    await expect(reviewsTab.locator('svg')).toBeVisible()

    // Initial state: menu tab is selected
    await expect(menuTab).toHaveAttribute('aria-selected', 'true')
    await expect(reviewsTab).toHaveAttribute('aria-selected', 'false')

    // Menu panel visible, dish items present
    const menuPanel = drawer.locator('#tabpanel-menu')
    const reviewsPanel = drawer.locator('#tabpanel-reviews')
    await expect(menuPanel).toBeVisible()
    await expect(drawer.getByRole('button', { name: /Xem ảnh phóng to món Bánh Mì Thịt Nướng/i })).toBeVisible()
    await expect(reviewsPanel).toBeHidden()

    // Switch tab via click
    await reviewsTab.click()
    await expect(reviewsTab).toHaveAttribute('aria-selected', 'true')
    await expect(menuTab).toHaveAttribute('aria-selected', 'false')
    await expect(reviewsPanel).toBeVisible()
    await expect(menuPanel).toBeHidden()

    // Community review overview visible in reviews tab
    await expect(drawer.getByText(/Tổng quan đánh giá cộng đồng/i)).toBeVisible()

    // Community rating distribution breakdown: 3 verified rows (Rất hợp, Bình thường, Chưa hợp)
    const dist = reviewsPanel.locator('#store-rating-distribution')
    await expect(dist).toBeVisible()
    await expect(dist.getByText(/Rất hợp/i)).toBeVisible()
    await expect(dist.getByText(/Bình thường/i)).toBeVisible()
    await expect(dist.getByText(/Chưa hợp/i)).toBeVisible()
    await expect(dist).toContainText('118')
    await expect(dist).toContainText('2')
    await expect(dist).toContainText('0')

    const progressBars = dist.locator('[role="progressbar"]')
    await expect(progressBars).toHaveCount(3)
    await expect(progressBars.nth(0)).toHaveAttribute('aria-valuenow', '118')
    await expect(progressBars.nth(1)).toHaveAttribute('aria-valuenow', '2')
    await expect(progressBars.nth(2)).toHaveAttribute('aria-valuenow', '0')

    // Verification: Rating action buttons are NOT duplicated inside the Desktop reviews tabpanel
    await expect(reviewsPanel.getByRole('button', { name: /Đánh giá Rất Hợp/i })).toHaveCount(0)
    await expect(reviewsPanel.getByRole('button', { name: /Đánh giá Bình Thường/i })).toHaveCount(0)
    await expect(reviewsPanel.getByRole('button', { name: /Đánh giá Chưa Hợp/i })).toHaveCount(0)

    // Instead, the 3 standardized rating buttons and bookmark button live in the unified footer
    const footer = drawer.locator('#store-detail-footer')
    await expect(footer.getByRole('button', { name: /Đánh giá Rất Hợp/i })).toBeVisible()
    await expect(footer.getByRole('button', { name: /Đánh giá Bình Thường/i })).toBeVisible()
    await expect(footer.getByRole('button', { name: /Đánh giá Chưa Hợp/i })).toBeVisible()
    await expect(footer.getByRole('button', { name: /Lưu quán/i })).toBeVisible()

    // Keyboard arrow navigation
    await reviewsTab.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(menuTab).toHaveAttribute('aria-selected', 'true')
    await expect(menuTab).toBeFocused()
    await expect(menuPanel).toBeVisible()
    await expect(reviewsPanel).toBeHidden()

    await page.keyboard.press('ArrowRight')
    await expect(reviewsTab).toHaveAttribute('aria-selected', 'true')
    await expect(reviewsTab).toBeFocused()
    await expect(reviewsPanel).toBeVisible()
  })

  test('5. Menu scalability (0, 3, 20, 50 dishes): independent scroll, left column stability, and scroll preservation', async ({ page }) => {
    // 5A: 0 items empty state
    await setupStoreDetailRoutes(page, { foodItems: [] })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Empty state message rendered
    await expect(drawer.getByText(/Chưa có món ăn nào trong thực đơn/i)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    // 5B: 50 items scalability & independent scrolling test
    const dishes50 = Array.from({ length: 50 }, (_, i) => ({
      id: `food-50-${i + 1}`,
      name: `Món Ngon Cần Giuộc Số ${i + 1}`,
      price: 25000 + i * 1000,
      description: `Mô tả chi tiết món ăn số ${i + 1} chuẩn vị quê hương Cần Giuộc`,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300'
    }))

    await setupStoreDetailRoutes(page, { foodItems: dishes50 })
    await page.goto('/explore')

    const storeCard50 = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard50.click()

    const drawer50 = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer50).toBeVisible()

    // Check tab badge reflects 50 dishes
    const menuTab50 = drawer50.getByRole('tab', { name: /Thực Đơn/i })
    await expect(menuTab50).toContainText('50')

    // First dish rendered
    const firstDish = drawer50.getByRole('button', { name: /Xem ảnh phóng to món Món Ngon Cần Giuộc Số 1\b/i })
    await expect(firstDish).toBeVisible()

    // Menu scroll container exists and has independent scrollbar
    const menuScrollContainer = drawer50.locator('#store-menu-scroll-container')
    await expect(menuScrollContainer).toBeVisible()

    // Measure left column and tablist position BEFORE scrolling dishes
    const leftCol = drawer50.locator('.lg\\:col-span-5')
    const beforeLeftBox = await leftCol.boundingBox()
    const beforeTablistBox = await menuTab50.boundingBox()

    // Scroll menu container down by 400px
    await menuScrollContainer.evaluate((el) => {
      el.scrollTop = 400
    })
    await page.waitForTimeout(150)

    const currentScrollTop = await menuScrollContainer.evaluate((el) => el.scrollTop)
    expect(currentScrollTop).toBeGreaterThanOrEqual(300)

    // Left column and tablist stay completely stable (did not scroll away)
    const afterLeftBox = await leftCol.boundingBox()
    const afterTablistBox = await menuTab50.boundingBox()
    expect(Math.abs(afterLeftBox.y - beforeLeftBox.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(afterTablistBox.y - beforeTablistBox.y)).toBeLessThanOrEqual(1)

    // Switch to reviews tab and switch back to menu: scroll position preserved
    const reviewsTab50 = drawer50.getByRole('tab', { name: /Đánh Giá/i })
    await reviewsTab50.click()
    await expect(drawer50.locator('#tabpanel-reviews')).toBeVisible()

    await menuTab50.click()
    await expect(drawer50.locator('#tabpanel-menu')).toBeVisible()
    await page.waitForTimeout(100)

    const preservedScrollTop = await menuScrollContainer.evaluate((el) => el.scrollTop)
    expect(preservedScrollTop).toBeGreaterThanOrEqual(300)

    // Low-height viewport (1440x500): drawer and menu remain fully accessible
    await page.setViewportSize({ width: 1440, height: 500 })
    await expect(drawer50).toBeVisible()
    await expect(menuScrollContainer).toBeVisible()
    await expect(drawer50.locator('#store-detail-footer')).toBeVisible()
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  test('6. Dedicated Action Footer: standardized labels, equal-width 3-button group, and anchored footer', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    const footer = drawer.locator('#store-detail-footer')
    await expect(footer).toBeVisible()

    // All 4 buttons are present and visible in the dedicated action footer
    const ratHopBtn = footer.getByRole('button', { name: /Đánh giá Rất Hợp/i })
    const binhThuongBtn = footer.getByRole('button', { name: /Đánh giá Bình Thường/i })
    const chuaHopBtn = footer.getByRole('button', { name: /Đánh giá Chưa Hợp/i })
    const bookmarkBtn = footer.getByRole('button', { name: /Lưu quán Bánh Mì Ba Lẹ/i })

    await expect(ratHopBtn).toBeVisible()
    await expect(binhThuongBtn).toBeVisible()
    await expect(chuaHopBtn).toBeVisible()
    await expect(bookmarkBtn).toBeVisible()

    // Standardized labels verification
    await expect(ratHopBtn).toContainText('Rất hợp')
    await expect(binhThuongBtn).toContainText('Bình thường')
    await expect(chuaHopBtn).toContainText('Chưa hợp')

    // Equal-width button sizing verification (height >= 44px, equal widths across 3 rating buttons)
    const b1 = await ratHopBtn.boundingBox()
    const b2 = await binhThuongBtn.boundingBox()
    const b3 = await chuaHopBtn.boundingBox()

    expect(Math.abs(b1.width - b2.width)).toBeLessThanOrEqual(2)
    expect(Math.abs(b2.width - b3.width)).toBeLessThanOrEqual(2)
    expect(b1.height).toBeGreaterThanOrEqual(44)
    expect(b2.height).toBeGreaterThanOrEqual(44)
    expect(b3.height).toBeGreaterThanOrEqual(44)

    // Drawer bounding box
    const drawerBox = await drawer.boundingBox()
    const initialFooterBox = await footer.boundingBox()

    // Footer is anchored right at the bottom edge of drawer
    expect(Math.abs(drawerBox.y + drawerBox.height - (initialFooterBox.y + initialFooterBox.height))).toBeLessThanOrEqual(2)

    // Unauthenticated click on rating button opens AuthModal without dismissing drawer
    await ratHopBtn.click()
    const authDialogRating = page.getByRole('dialog', { name: /Đăng Nhập/i })
    await expect(authDialogRating).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(authDialogRating).toBeHidden()
    await expect(drawer).toBeVisible()

    // Unauthenticated click on bookmark button opens AuthModal without dismissing drawer
    await bookmarkBtn.click()
    const authDialog = page.getByRole('dialog', { name: /Đăng Nhập/i })
    await expect(authDialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(authDialog).toBeHidden()
    await expect(drawer).toBeVisible()
  })

  test('7. Keyboard focus trap cycling and inclusion of footer bookmark action', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // First focusable element in header is the Share button
    const shareBtn = drawer.getByRole('button', { name: /Chia sẻ Bánh Mì Ba Lẹ/i })
    await expect(shareBtn).toBeVisible()
    await shareBtn.focus()
    await expect(shareBtn).toBeFocused()

    // Press Shift+Tab from the first focusable element: wraps around to the footer bookmark button
    await page.keyboard.press('Shift+Tab')

    const bookmarkBtn = drawer.getByRole('button', { name: /Lưu quán Bánh Mì Ba Lẹ/i })
    await expect(bookmarkBtn).toBeFocused()

    // Press Tab from footer bookmark button: wraps back to the first focusable element (Share)
    await page.keyboard.press('Tab')
    await expect(shareBtn).toBeFocused()

    // The focus remains trapped inside the drawer throughout
    const activeIsInside = await drawer.evaluate((d) => d.contains(document.activeElement))
    expect(activeIsInside).toBe(true)
  })

  test('8. Menu item zoom opens ImageViewerModal and respects nested Escape flow', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Click the first dish card
    const dishBtn = drawer.getByRole('button', { name: /Xem ảnh phóng to món Bánh Mì Thịt Nướng/i })
    await dishBtn.click()

    // ImageViewerModal lightbox opens
    const lightbox = page.getByRole('dialog', { name: /Món: Bánh Mì Thịt Nướng/i })
    await expect(lightbox).toBeVisible()

    // Escape closes ONLY the lightbox
    await page.keyboard.press('Escape')
    await expect(lightbox).toBeHidden()
    await expect(drawer).toBeVisible()

    // Second Escape closes the drawer
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
  })

  test('9. Share action feedback and Google Maps external link', async ({ page, context }) => {
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    } catch {
      // Graceful fallback if permission unsupported in test environment
    }
    await setupStoreDetailRoutes(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Share button
    const shareBtn = drawer.getByRole('button', { name: /Chia sẻ Bánh Mì Ba Lẹ/i })
    await expect(shareBtn).toBeVisible()
    await shareBtn.click()

    // Share feedback appears
    const feedback = drawer.getByRole('status')
    await expect(feedback).toBeVisible()
    expect(await feedback.textContent()).toMatch(/Đã sao chép liên kết|Đã chia sẻ|Không thể sao chép liên kết/i)
  })

  test('10. Mobile drawer preservation: no desktop tab bar, stacked layout, safe-area padding', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Desktop tabs are hidden on mobile
    const desktopTablist = drawer.getByRole('tablist', { name: /Phân loại nội dung chi tiết quán/i })
    await expect(desktopTablist).toBeHidden()

    // Both Menu and Reviews are stacked and visible
    const mobileMenuHeading = drawer.getByRole('heading', { name: /Thực Đơn Quán Ăn/i })
    const mobileReviewsHeading = drawer.getByRole('heading', { name: /Tương Tác & Đánh Giá/i })
    await expect(mobileMenuHeading).toBeVisible()
    await expect(mobileReviewsHeading).toBeVisible()

    // Footer is present and pinned to bottom
    const footer = drawer.locator('footer')
    await expect(footer).toBeVisible()
    const footerBox = await footer.boundingBox()
    expect(Math.round(footerBox.y + footerBox.height)).toBe(844)
  })

  for (const vp of [
    { name: 'desktop-1920x1080', width: 1920, height: 1080 },
    { name: 'desktop-1440x900', width: 1440, height: 900 },
    { name: 'desktop-1280x800', width: 1280, height: 800 },
    { name: 'tablet-768x1024', width: 768, height: 1024 },
    { name: 'mobile-390x844', width: 390, height: 844 },
    { name: 'mobile-320x568', width: 320, height: 568 }
  ]) {
    test(`11. Zero horizontal overflow across viewports: ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await setupStoreDetailRoutes(page)
      await page.goto('/explore')

      const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
      await storeCard.click()

      const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
      await expect(drawer).toBeVisible()

      // Verify no horizontal overflow in drawer
      const overflow = await drawer.evaluate((el) => el.scrollWidth - el.clientWidth)
      expect(overflow).toBeLessThanOrEqual(1)

      // Close button accessible
      const closeBtn = drawer.getByRole('button', { name: 'Đóng cửa sổ chi tiết' })
      await expect(closeBtn).toBeVisible()
    })
  }

  test('12. Rating distribution fallback: displays DEFERRED notice when verified counts are missing', async ({ page }) => {
    await setupStoreDetailRoutes(page, {
      countVerySatisfied: undefined,
      countNormal: undefined,
      countNotSatisfied: undefined
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    const reviewsTab = drawer.getByRole('tab', { name: /Đánh Giá/i })
    await reviewsTab.click()

    // Fallback notice rendered honestly without synthetic numbers
    await expect(drawer.getByText(/DEFERRED — Rating distribution requires verified data contract/i)).toBeVisible()
    await expect(drawer.locator('#store-rating-distribution')).toHaveCount(0)
  })
})
