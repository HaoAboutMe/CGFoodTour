import { test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.resolve(process.cwd(), 'e2e/screenshots/before-batch-3c')
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

async function setupStoreDetailRoutes(page) {
  await page.route('**/v1/stores**', async (route) => {
    const url = route.request().url()
    if (url.includes('/store-accessibility-test-1')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: MOCK_STORE })
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          content: [MOCK_STORE],
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

test.describe('Capture Baseline Screenshots for StoreDetailDrawer Before Batch 3C', () => {
  for (const vp of VIEWPORTS) {
    test(`Capture Drawer ${vp.name}`, async ({ page }) => {
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
      console.log(`Captured: ${screenshotPath}`)
    })
  }
})
