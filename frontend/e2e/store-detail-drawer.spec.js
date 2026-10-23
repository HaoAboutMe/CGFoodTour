import { test, expect } from '@playwright/test'

const MOCK_STORE = {
  id: 'store-accessibility-test-1',
  name: 'Bánh Mì Ba Lẹ Cần Giuộc',
  categoryName: 'Ăn Sáng',
  addressLine: '123 Quốc Lộ 50, Thị trấn Cần Giuộc',
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
  foodItems: [
    {
      id: 'food-1',
      name: 'Bánh Mì Thịt Nướng Đặc Biệt',
      price: 25000,
      description: 'Pate béo ngậy, thịt nướng thơm lừng',
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300'
    },
    {
      id: 'food-2',
      name: 'Xôi Mặn Thập Cẩm',
      price: 20000,
      description: 'Lạp xưởng Cần Giuộc, chà bông, mỡ hành',
      imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=300'
    }
  ]
}

/**
 * Setup route interception for explore and store detail
 */
async function setupStoreDetailRoutes(page, initialSaved = false) {
  let isSaved = initialSaved
  let savedCount = initialSaved ? 43 : 42

  await page.route('**/v1/stores**', async (route) => {
    const url = route.request().url()

    // 1. Save toggle action
    if (url.includes('/save') && route.request().method() === 'POST') {
      isSaved = !isSaved
      savedCount += isSaved ? 1 : -1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { isSaved, savedCount }
        })
      })
      return
    }

    // 2. Specific store detail by ID
    if (url.includes('/store-accessibility-test-1')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { ...MOCK_STORE, isSaved, savedCount }
        })
      })
      return
    }

    // 3. Store listing
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          content: [{ ...MOCK_STORE, isSaved, savedCount }],
          totalPages: 1,
          totalElements: 1,
          last: true
        }
      })
    })
  })
}

test.describe('Batch 2D-2C: StoreDetailDrawer Accessibility & Interactive Contracts', () => {
  test('1. WAI-ARIA role, modal semantics, title and address associations', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await expect(storeCard).toBeVisible()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán Bánh Mì Ba Lẹ Cần Giuộc/i })
    await expect(drawer).toBeVisible()

    // Check WAI-ARIA contracts
    await expect(drawer).toHaveAttribute('aria-modal', 'true')
    await expect(drawer).toHaveAttribute('aria-labelledby', 'store-detail-title')
    await expect(drawer).toHaveAttribute('aria-describedby', 'store-detail-address')

    // Check title element
    const titleHeading = drawer.locator('#store-detail-title')
    await expect(titleHeading).toBeVisible()
    await expect(titleHeading).toContainText('Bánh Mì Ba Lẹ Cần Giuộc')
  })

  test('2. Interactive touch targets meet minimum 44x44px geometry', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Check Close Button geometry
    const closeBtn = drawer.getByRole('button', { name: 'Đóng cửa sổ chi tiết' })
    await expect(closeBtn).toBeVisible()
    const closeBox = await closeBtn.boundingBox()
    expect(closeBox).not.toBeNull()
    expect(closeBox.width).toBeGreaterThanOrEqual(44)
    expect(closeBox.height).toBeGreaterThanOrEqual(44)

    // Check Share Button geometry
    const shareBtn = drawer.getByRole('button', { name: /Chia sẻ Bánh Mì Ba Lẹ/i })
    await expect(shareBtn).toBeVisible()
    const shareBox = await shareBtn.boundingBox()
    expect(shareBox).not.toBeNull()
    expect(shareBox.width).toBeGreaterThanOrEqual(44)
    expect(shareBox.height).toBeGreaterThanOrEqual(44)

    // Check Rating Buttons minimum height
    const ngonBtn = drawer.getByRole('button', { name: /Đánh giá Ngon/i })
    await expect(ngonBtn).toBeVisible()
    const ngonBox = await ngonBtn.boundingBox()
    expect(ngonBox.height).toBeGreaterThanOrEqual(44)

    // Check Closed Report Button minimum height
    const reportBtn = drawer.getByRole('button', { name: /Báo quán Bánh Mì Ba Lẹ Cần Giuộc nghỉ hôm nay/i })
    await expect(reportBtn).toBeVisible()
    const reportBox = await reportBtn.boundingBox()
    expect(reportBox.height).toBeGreaterThanOrEqual(44)

    // Check Floating Bookmark Button minimum height
    const bookmarkBtn = drawer.getByRole('button', { name: /Lưu quán Bánh Mì Ba Lẹ/i })
    await expect(bookmarkBtn).toBeVisible()
    const bookmarkBox = await bookmarkBtn.boundingBox()
    expect(bookmarkBox.height).toBeGreaterThanOrEqual(44)
  })

  test('3. Semantic buttons for banner and food menu cards with keyboard support', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Banner image button
    const bannerButton = drawer.getByRole('button', { name: /Xem ảnh phóng to của quán Bánh Mì Ba Lẹ Cần Giuộc/i })
    await expect(bannerButton).toBeVisible()

    // Food item buttons
    const food1Button = drawer.getByRole('button', { name: /Xem ảnh phóng to món Bánh Mì Thịt Nướng/i })
    await expect(food1Button).toBeVisible()

    const food2Button = drawer.getByRole('button', { name: /Xem ảnh phóng to món Xôi Mặn Thập Cẩm/i })
    await expect(food2Button).toBeVisible()
  })

  test('4. Keyboard focus trap cycling and inclusion of floating bookmark action', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Initial focus lands inside the drawer (close button)
    const closeBtn = drawer.getByRole('button', { name: 'Đóng cửa sổ chi tiết' })
    await expect(closeBtn).toBeFocused()

    // Floating Bookmark button must be inside the dialog
    const bookmarkBtn = drawer.getByRole('button', { name: /Lưu quán Bánh Mì Ba Lẹ/i })
    await expect(bookmarkBtn).toBeVisible()

    // Shift+Tab from first element (Share or Close) wraps around to last element
    await page.keyboard.press('Shift+Tab')
    const activeTagName = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'A']).toContain(activeTagName)

    // The focus remains trapped inside the drawer
    const isInsideDrawer = await page.evaluate(() => {
      const drawerEl = document.querySelector('[role="dialog"]')
      return drawerEl ? drawerEl.contains(document.activeElement) : false
    })
    expect(isInsideDrawer).toBe(true)
  })

  test('5. Escape dismiss closes drawer and restores focus to opener button', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.focus()
    await storeCard.press('Enter')

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Press Escape to dismiss
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    // Focus restored to opener store card
    await expect(storeCard).toBeFocused()
  })

  test('6. Nested overlay safety: ImageViewerModal handles first Escape, Drawer handles second Escape', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Click food item to open full-screen ImageViewerModal lightbox
    const foodItemBtn = drawer.getByRole('button', { name: /Xem ảnh phóng to món Bánh Mì Thịt Nướng/i })
    await foodItemBtn.click()

    // Lightbox should be open
    const lightbox = page.getByRole('dialog', { name: /Xem Ảnh Phóng To|Bánh Mì Thịt Nướng/i })
    await expect(lightbox).toBeVisible()

    // First Escape closes ONLY the lightbox
    await page.keyboard.press('Escape')
    await expect(lightbox).toBeHidden()

    // Drawer remains open and visible!
    await expect(drawer).toBeVisible()

    // Second Escape closes the drawer
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    // Focus returned to triggering store card
    await expect(storeCard).toBeFocused()
  })

  test('7. Unauthenticated save opens AuthModal overlay without dismissing drawer', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Click "Lưu Quán" while not logged in
    const bookmarkBtn = drawer.getByRole('button', { name: /Lưu quán Bánh Mì Ba Lẹ/i })
    await bookmarkBtn.click()

    // AuthModal opens on top of drawer
    const authDialog = page.getByRole('dialog', { name: /Đăng Nhập/i })
    await expect(authDialog).toBeVisible()

    // Close AuthModal with Escape
    await page.keyboard.press('Escape')
    await expect(authDialog).toBeHidden()

    // Drawer remains open and intact
    await expect(drawer).toBeVisible()
  })

  test('8. Background isolation: inert and scroll lock on root, cleaned up on close', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Check background isolation
    const rootInert = await page.locator('#root').getAttribute('inert')
    expect(rootInert).not.toBeNull()

    const rootAriaHidden = await page.locator('#root').getAttribute('aria-hidden')
    expect(rootAriaHidden).toBe('true')

    const bodyOverflow = await page.evaluate(() => document.body.style.overflow)
    expect(bodyOverflow).toBe('hidden')

    // Close drawer
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    // Verify cleanup
    const rootInertAfter = await page.locator('#root').getAttribute('inert')
    expect(rootInertAfter).toBeNull()

    const rootAriaHiddenAfter = await page.locator('#root').getAttribute('aria-hidden')
    expect(rootAriaHiddenAfter).toBeNull()

    const bodyOverflowAfter = await page.evaluate(() => document.body.style.overflow)
    expect(bodyOverflowAfter).toBe('')
  })

  for (const vp of [
    { name: '320px', width: 320, height: 568 },
    { name: '390px', width: 390, height: 844 },
    { name: '768px', width: 768, height: 1024 },
    { name: '1440px', width: 1440, height: 900 }
  ]) {
    test(`9. Responsive viewport ${vp.name} without horizontal clipping or overflow`, async ({ page }) => {
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

      // Verify close button remains accessible
      const closeBtn = drawer.getByRole('button', { name: 'Đóng cửa sổ chi tiết' })
      await expect(closeBtn).toBeVisible()
    })
  }
})
