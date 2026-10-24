import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'after-batch-3e')

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
}

const MOCK_OWNER_USER = {
  id: 'owner-test-id',
  username: 'chubale',
  email: 'bale@cangiuoc.vn',
  firstname: 'Ba',
  lastname: 'Trần Lẹ',
  roles: ['USER'],
  enabled: true,
  emailVerified: true,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
}

const MOCK_CATEGORIES = [
  { id: 1, name: 'Bánh Mì', icon: 'Sandwich' },
  { id: 2, name: 'Đặc Sản', icon: 'Sparkles' },
  { id: 3, name: 'Bún & Hủ Tiếu', icon: 'Soup' },
  { id: 4, name: 'Cà Phê & Nước', icon: 'Coffee' },
  { id: 5, name: 'Ăn Vặt', icon: 'Cookie' }
]

const MOCK_OWNED_STORES = [
  {
    id: 'store-approved-1',
    name: 'Bánh Mì Ba Lẹ Chợ Cần Giuộc Thơm Ngon Giòn Rụm',
    addressLine: 'Khu phố 1, Thị trấn Cần Giuộc, Long An',
    landmarkNote: 'Đối diện nhà lồng chợ Cần Giuộc cũ',
    status: 'APPROVED',
    ownerUsername: 'chubale',
    ownerEmail: 'bale@cangiuoc.vn',
    categoryId: 1,
    categoryName: 'Bánh Mì',
    openTime: '06:00',
    closeTime: '21:00',
    priceMin: 20000,
    priceMax: 35000,
    phoneNumber: '0901234567',
    bannerImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    latitude: 10.605,
    longitude: 106.672,
    mapUrl: 'https://maps.google.com/?q=10.605,106.672',
    satisfactionRate: 95,
    totalVotes: 48,
    savedCount: 14,
    description: 'Bánh mì thịt nướng gia truyền hơn 30 năm tại ngã ba Cần Giuộc.',
    foodItems: [
      {
        id: 'f-1',
        name: 'Bánh mì thịt nướng đặc biệt',
        price: 25000,
        description: 'Pate béo, thịt nướng than hoa thơm lừng với dưa chua ngò rí',
        imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400'
      },
      {
        id: 'f-2',
        name: 'Bánh mì xíu mại trứng muối',
        price: 28000,
        description: 'Xíu mại sốt cà chua trứng muối đậm đà béo ngậy',
        imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400'
      }
    ]
  },
  {
    id: 'store-pending-1',
    name: 'Bánh Xèo Bà Mười Giòn Rụm Chợ Trạm',
    addressLine: 'Ngã Ba Chợ Trạm, Xã Mỹ Lộc, Cần Giuộc, Long An',
    landmarkNote: 'Gần cầu Chợ Trạm, đối diện đại lý bia',
    status: 'PENDING',
    ownerUsername: 'chubale',
    ownerEmail: 'bale@cangiuoc.vn',
    categoryId: 2,
    categoryName: 'Đặc Sản',
    openTime: '14:00',
    closeTime: '21:30',
    priceMin: 30000,
    priceMax: 60000,
    phoneNumber: '0912345678',
    bannerImageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800',
    latitude: 10.598,
    longitude: 106.685,
    savedCount: 5,
    foodItems: []
  },
  {
    id: 'store-rejected-1',
    name: 'Quán Nước Vỉa Hè Chân Cầu Cần Giuộc',
    addressLine: 'Chân cầu Cần Giuộc, Khóm 2',
    landmarkNote: 'Dưới chân cầu hướng đi Tân Kim',
    status: 'REJECTED',
    rejectionReason: 'Địa chỉ chưa cụ thể số nhà và chưa đính kèm ảnh giấy chứng nhận an toàn thực phẩm theo quy định.',
    ownerUsername: 'chubale',
    ownerEmail: 'bale@cangiuoc.vn',
    categoryId: 4,
    categoryName: 'Cà Phê & Nước',
    openTime: '16:00',
    closeTime: '23:00',
    priceMin: 12000,
    priceMax: 25000,
    phoneNumber: '0933112233',
    bannerImageUrl: '',
    latitude: 10.601,
    longitude: 106.678,
    savedCount: 1,
    foodItems: []
  },
  {
    id: 'store-hidden-admin-1',
    name: 'Lò Bánh Tráng Nướng Út Tịch',
    addressLine: 'Đường Tránh Quốc Lộ 50, Xã Trường Bình',
    landmarkNote: 'Gần ngã tư Tân Kim',
    status: 'HIDDEN',
    hiddenByAdmin: true,
    hideReason: 'Cần xác minh lại giấy phép vệ sinh an toàn thực phẩm theo phản ánh của khách.',
    recoveryRequested: false,
    ownerUsername: 'chubale',
    ownerEmail: 'bale@cangiuoc.vn',
    categoryId: 5,
    categoryName: 'Ăn Vặt',
    openTime: '08:00',
    closeTime: '20:00',
    priceMin: 15000,
    priceMax: 40000,
    phoneNumber: '0977889900',
    bannerImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    latitude: 10.612,
    longitude: 106.669,
    savedCount: 8,
    foodItems: []
  }
]

async function setupOwnerRoutes(page) {
  await page.route(/\/v1\/stores\/events/, (route) => route.abort())

  await page.route('**/auth/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          accessToken: 'mock-owner-access-token-jwt',
          tokenType: 'Bearer'
        }
      })
    })
  })

  await page.route('**/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          accessToken: 'mock-owner-access-token-jwt',
          tokenType: 'Bearer'
        }
      })
    })
  })

  await page.route('**/*categories*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: MOCK_CATEGORIES
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
          result: MOCK_OWNER_USER
        })
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1000, result: [] })
    })
  })

  await page.route(/\/v1\/stores/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          content: MOCK_OWNED_STORES,
          totalPages: 1,
          totalElements: MOCK_OWNED_STORES.length,
          last: true,
          page: 0
        }
      })
    })
  })
}

async function loginAndOpenMyStores(page) {
  await setupOwnerRoutes(page)
  await page.goto('/explore')

  const avatarBtn = page.locator('header button:has(img[alt="avatar"])').first()
  const loginNavBtn = page.getByRole('button', { name: /Đăng Nhập/i }).first()

  await Promise.race([
    avatarBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {}),
    loginNavBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {})
  ])

  if (await loginNavBtn.isVisible()) {
    await loginNavBtn.click()
    const authDialog = page.getByRole('dialog', { name: /^Đăng Nhập$/i })
    await expect(authDialog).toBeVisible({ timeout: 5000 })
    await page.locator('#login-email').fill('bale@cangiuoc.vn')
    await page.locator('#login-password').fill('Bale@123456')
    await page.locator('form button[type="submit"]').click()
    await expect(authDialog).toBeHidden({ timeout: 5000 })
  }

  await expect(avatarBtn).toBeVisible({ timeout: 8000 })
  await page.addStyleTag({ content: '.fixed.bottom-0.right-4 { display: none !important; }' }).catch(() => {})
  await avatarBtn.dispatchEvent('click')

  const myStoresNavBtn = page.getByRole('button', { name: /Quán Ăn Của Tôi/i })
  await expect(myStoresNavBtn).toBeVisible({ timeout: 5000 })
  await myStoresNavBtn.dispatchEvent('click')

  await expect(page.getByRole('heading', { name: /Quán Ăn Của Tôi/i })).toBeVisible({ timeout: 10000 })
  await page.evaluate(() => {
    const dc = document.querySelector('.fixed.bottom-0.right-4')
    if (dc) dc.remove()
  }).catch(() => {})
}

test.describe('Capture After Redesign Screenshots for My Stores Batch 3E', () => {
  const viewports = [
    { name: 'desktop-1920x1080', width: 1920, height: 1080 },
    { name: 'desktop-1440x900', width: 1440, height: 900 },
    { name: 'desktop-1280x800', width: 1280, height: 800 },
    { name: 'tablet-768x1024', width: 768, height: 1024 },
    { name: 'mobile-390x844', width: 390, height: 844 },
    { name: 'mobile-320x568', width: 320, height: 568 }
  ]

  for (const vp of viewports) {
    test(`Capture My Stores Dashboard After (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await loginAndOpenMyStores(page)
      await page.waitForTimeout(500)

      const targetPath = path.join(SCREENSHOTS_DIR, `mystores-dashboard-${vp.name}.png`)
      await page.screenshot({ path: targetPath, fullPage: false })
      console.log(`Captured After Dashboard: ${targetPath}`)
    })
  }

  test('Capture Desktop Table View After (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenMyStores(page)

    // Switch to table view
    await page.getByTitle('Chế độ bảng dữ liệu').click()
    await expect(page.getByRole('table')).toBeVisible()
    await page.waitForTimeout(400)

    const targetPath = path.join(SCREENSHOTS_DIR, 'mystores-dashboard-table-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Table View: ${targetPath}`)
  })

  test('Capture Create Store Form After (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenMyStores(page)

    // Click "Thêm Quán Mới"
    await page.getByRole('button', { name: /Thêm Quán Mới/i }).click()
    await expect(page.getByRole('heading', { name: /Đăng Ký Địa Điểm Ẩm Thực/i })).toBeVisible()
    await page.waitForTimeout(400)

    const targetPath = path.join(SCREENSHOTS_DIR, 'mystores-create-store-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Create Store Master Form: ${targetPath}`)
  })

  test('Capture Edit Store Form After (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenMyStores(page)

    // Click "Sửa" on the first store card
    const editBtn = page.getByRole('button', { name: 'Sửa', exact: true }).first()
    await editBtn.click()

    await expect(page.getByRole('heading', { name: /Chỉnh Sửa Quán Ăn/i })).toBeVisible()
    await page.waitForTimeout(400)

    const targetPath = path.join(SCREENSHOTS_DIR, 'mystores-edit-store-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Edit Store Form: ${targetPath}`)
  })

  test('Capture Dish Management Panel After (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenMyStores(page)

    // Click "Quản Lý Món Ăn" on Bánh Mì Ba Lẹ
    const manageDishesBtn = page.getByRole('button', { name: /Quản Lý Món Ăn/i }).first()
    await manageDishesBtn.click()

    await expect(page.getByText('Thực Đơn Hiện Tại')).toBeVisible()
    await page.waitForTimeout(400)

    const targetPath = path.join(SCREENSHOTS_DIR, 'mystores-dish-management-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Dish Management Panel: ${targetPath}`)
  })

  test('Capture Submissions History Tab After (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenMyStores(page)

    // Click "Lịch Sử Đăng Quán"
    const subTabBtn = page.getByRole('button', { name: /Lịch Sử Đăng Quán/i })
    await subTabBtn.click()
    await page.waitForTimeout(400)

    const targetPath = path.join(SCREENSHOTS_DIR, 'mystores-submissions-tab-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Submissions History Tab: ${targetPath}`)
  })
})
