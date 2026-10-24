import { test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.resolve(process.cwd(), 'e2e/screenshots/after-batch-3c')
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

const MOCK_STORE = {
  id: 'store-accessibility-test-1',
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
  const storeData = { ...MOCK_STORE, ...overrides }
  await page.route('**/v1/stores**', async (route) => {
    const url = route.request().url()
    if (url.includes('/store-accessibility-test-1')) {
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

const VIEWPORTS = [
  { name: 'desktop-1920x1080', width: 1920, height: 1080 },
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'desktop-1280x800', width: 1280, height: 800 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'mobile-320x568', width: 320, height: 568 }
]

test.describe('Capture After Screenshots for StoreDetailDrawer Batch 3C', () => {
  // 1. Standard 6 viewports
  for (const vp of VIEWPORTS) {
    test(`Capture Drawer After ${vp.name}`, async ({ page }) => {
      await setupStoreDetailRoutes(page)
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/explore')

      const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
      await storeCard.waitFor({ state: 'visible', timeout: 15000 })
      await storeCard.click()

      const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
      await drawer.waitFor({ state: 'visible', timeout: 10000 })
      await page.waitForTimeout(600)

      const screenshotPath = path.join(OUT_DIR, `drawer-${vp.name}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })
      console.log(`Captured After: ${screenshotPath}`)
    })
  }

  // 2. Long Address scenario
  test('Capture Drawer Long Address', async ({ page }) => {
    const longAddress = 'Số 123/45/67/89 Đường Tránh Quốc Lộ 50 Nối Dài Mở Rộng Đi Qua Vùng Ven Thị Trấn Cần Giuộc, Ấp Tân Nam, Xã Trường Bình, Huyện Cần Giuộc, Tỉnh Long An'
    await setupStoreDetailRoutes(page, {
      addressLine: longAddress,
      landmarkNote: 'Đối diện cổng khu công nghiệp Tân Kim mở rộng, gần ngã tư'
    })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.waitFor({ state: 'visible' })
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await drawer.waitFor({ state: 'visible' })
    await page.waitForTimeout(600)

    const screenshotPath = path.join(OUT_DIR, 'drawer-long-address.png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`Captured Long Address: ${screenshotPath}`)
  })

  // 3. 20 Items Menu scenario
  test('Capture Drawer Menu 20 Items', async ({ page }) => {
    const dishes20 = Array.from({ length: 20 }, (_, i) => ({
      id: `food-20-${i + 1}`,
      name: `Món Ngon Đặc Sản Cần Giuộc #${i + 1}`,
      price: 25000 + i * 2000,
      description: `Món ăn truyền thống số ${i + 1} được chế biến từ nguyên liệu tươi ngon tại Cần Giuộc`,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300'
    }))
    await setupStoreDetailRoutes(page, { foodItems: dishes20 })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.waitFor({ state: 'visible' })
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await drawer.waitFor({ state: 'visible' })
    await page.waitForTimeout(600)

    const screenshotPath = path.join(OUT_DIR, 'drawer-menu-20-items.png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`Captured Menu 20 Items: ${screenshotPath}`)
  })

  // 4. 50 Items Menu scenario
  test('Capture Drawer Menu 50 Items', async ({ page }) => {
    const dishes50 = Array.from({ length: 50 }, (_, i) => ({
      id: `food-50-${i + 1}`,
      name: `Món Ăn Số ${i + 1}`,
      price: 20000 + (i % 10) * 3000,
      description: `Đặc sản địa phương hấp dẫn phong phú số ${i + 1}`,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300'
    }))
    await setupStoreDetailRoutes(page, { foodItems: dishes50 })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.waitFor({ state: 'visible' })
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await drawer.waitFor({ state: 'visible' })
    await page.waitForTimeout(600)

    const screenshotPath = path.join(OUT_DIR, 'drawer-menu-50-items.png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`Captured Menu 50 Items: ${screenshotPath}`)
  })

  // 5. Active Reviews Tab scenario
  test('Capture Drawer Active Reviews Tab', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.waitFor({ state: 'visible' })
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await drawer.waitFor({ state: 'visible' })

    const reviewsTab = drawer.getByRole('tab', { name: /Đánh Giá/i })
    await reviewsTab.click()
    await page.waitForTimeout(400)

    const screenshotPath = path.join(OUT_DIR, 'drawer-active-tab-reviews.png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`Captured Active Tab Reviews: ${screenshotPath}`)
  })

  // 6. Footer Bookmark when Mid Scroll
  test('Capture Drawer Footer Mid Scroll', async ({ page }) => {
    const dishes20 = Array.from({ length: 20 }, (_, i) => ({
      id: `food-mid-${i + 1}`,
      name: `Món Ngon #${i + 1}`,
      price: 30000,
      description: `Mô tả món ăn #${i + 1}`,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300'
    }))
    await setupStoreDetailRoutes(page, { foodItems: dishes20 })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.waitFor({ state: 'visible' })
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await drawer.waitFor({ state: 'visible' })

    const scrollContainer = drawer.locator('.overflow-y-auto')
    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight / 2
    })
    await page.waitForTimeout(400)

    const screenshotPath = path.join(OUT_DIR, 'drawer-footer-scroll-mid.png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`Captured Footer Mid Scroll: ${screenshotPath}`)
  })

  // 7. Footer Bookmark when Bottom Scroll
  test('Capture Drawer Footer Bottom Scroll', async ({ page }) => {
    const dishes20 = Array.from({ length: 20 }, (_, i) => ({
      id: `food-bot-${i + 1}`,
      name: `Món Ngon #${i + 1}`,
      price: 30000,
      description: `Mô tả món ăn #${i + 1}`,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300'
    }))
    await setupStoreDetailRoutes(page, { foodItems: dishes20 })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.waitFor({ state: 'visible' })
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await drawer.waitFor({ state: 'visible' })

    const scrollContainer = drawer.locator('.overflow-y-auto')
    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await page.waitForTimeout(400)

    const screenshotPath = path.join(OUT_DIR, 'drawer-footer-scroll-bottom.png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`Captured Footer Bottom Scroll: ${screenshotPath}`)
  })

  // 8. Low height window scenario
  test('Capture Drawer Low Height Window', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.setViewportSize({ width: 1440, height: 500 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.waitFor({ state: 'visible' })
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await drawer.waitFor({ state: 'visible' })
    await page.waitForTimeout(600)

    const screenshotPath = path.join(OUT_DIR, 'drawer-low-height-window.png')
    await page.screenshot({ path: screenshotPath, fullPage: false })
    console.log(`Captured Low Height Window: ${screenshotPath}`)
  })

  // 9. Round 3 Deliverables: Dedicated Evidence Captures
  test('Capture Round 3 Evidence: Tab Thực Đơn & Tab Đánh Giá & Footer Desktop', async ({ page }) => {
    await setupStoreDetailRoutes(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.waitFor({ state: 'visible' })
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await drawer.waitFor({ state: 'visible' })
    await page.waitForTimeout(600)

    // Evidence 1: Tab Thực Đơn (Desktop 1440)
    await page.screenshot({ path: path.join(OUT_DIR, 'drawer-tab-menu.png') })

    // Evidence 3: Footer Desktop Close-Up
    const footer = drawer.locator('#store-detail-footer')
    await footer.screenshot({ path: path.join(OUT_DIR, 'drawer-footer-desktop.png') })

    // Evidence 2: Tab Đánh Giá (Desktop 1440 with 3-tier distribution breakdown)
    const reviewsTab = drawer.getByRole('tab', { name: /Đánh Giá/i })
    await reviewsTab.click()
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(OUT_DIR, 'drawer-tab-reviews.png') })
  })

  test('Capture Round 3 Evidence: Menu 50 món đang cuộn độc lập', async ({ page }) => {
    const dishes50 = Array.from({ length: 50 }, (_, i) => ({
      id: `food-evidence-50-${i + 1}`,
      name: `Món Ngon Cần Giuộc Số ${i + 1}`,
      price: 25000 + i * 1000,
      description: `Mô tả chi tiết món ăn số ${i + 1} chuẩn vị quê hương Cần Giuộc`,
      imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=300'
    }))
    await setupStoreDetailRoutes(page, { foodItems: dishes50 })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await storeCard.waitFor({ state: 'visible' })
    await storeCard.click()

    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await drawer.waitFor({ state: 'visible' })
    await page.waitForTimeout(600)

    const menuScroll = drawer.locator('#store-menu-scroll-container')
    await menuScroll.evaluate((el) => {
      el.scrollTop = 500
    })
    await page.waitForTimeout(300)

    // Evidence 4: Menu 50 món đang cuộn (vùng cuộn độc lập, cột trái và tablist giữ nguyên)
    await page.screenshot({ path: path.join(OUT_DIR, 'drawer-menu-50-items-scrolling.png') })
  })

  test('Capture Round 3 Evidence: Mobile 390px, Mobile 320px & Low Height 1440x500', async ({ page }) => {
    await setupStoreDetailRoutes(page)

    // Evidence 5: Mobile 390px
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/explore')
    const mobileCard = page.getByRole('button', { name: /Xem chi tiết quán/i }).first()
    await mobileCard.waitFor({ state: 'visible' })
    await mobileCard.click()
    const mobileDrawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await mobileDrawer.waitFor({ state: 'visible' })
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(OUT_DIR, 'drawer-mobile-390px.png') })

    // Evidence 6: Mobile 320px
    await page.setViewportSize({ width: 320, height: 568 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(OUT_DIR, 'drawer-mobile-320px.png') })

    // Evidence 7: Low Height 1440x500
    await page.setViewportSize({ width: 1440, height: 500 })
    await page.waitForTimeout(400)
    await page.screenshot({ path: path.join(OUT_DIR, 'drawer-low-height-1440x500.png') })
  })
})
