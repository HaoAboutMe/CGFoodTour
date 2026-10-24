import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'before-batch-3e')

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
    savedCount: 0,
    foodItems: []
  },
  {
    id: 'store-hidden-recovery-1',
    name: 'Lạp Xưởng Tươi Cô Chín Cần Giuộc',
    addressLine: 'Ấp Long Phú, Xã Tân Kim, Cần Giuộc, Long An',
    landmarkNote: 'Cạnh ngã ba Tân Kim',
    status: 'HIDDEN',
    hiddenByAdmin: true,
    hideReason: 'Quán tạm đóng cửa sửa chữa mặt bằng.',
    recoveryRequested: true,
    recoveryRequestReason: 'Quán đã hoàn tất sửa chữa cơ sở vật chất và có đủ giấy chứng nhận VSATTP mới nhất.',
    ownerUsername: 'chubale',
    ownerEmail: 'bale@cangiuoc.vn',
    categoryId: 2,
    categoryName: 'Đặc Sản',
    openTime: '07:00',
    closeTime: '19:00',
    priceMin: 180000,
    priceMax: 260000,
    phoneNumber: '0918765432',
    bannerImageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800',
    savedCount: 32,
    foodItems: []
  }
]

const MOCK_CATEGORIES = [
  { id: 1, name: 'Bánh Mì', icon: 'fa-bread-slice' },
  { id: 2, name: 'Đặc Sản', icon: 'fa-drumstick-bite' },
  { id: 3, name: 'Hủ Tiếu & Bún', icon: 'fa-bowl-food' },
  { id: 4, name: 'Cà Phê & Nước', icon: 'fa-mug-hot' }
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
    const url = route.request().url()
    if (url.includes('/mine')) {
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
      return
    }
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

test.describe('Capture Before Redesign Screenshots for My Stores Batch 3E', () => {
  const viewports = [
    { name: 'desktop-1920x1080', width: 1920, height: 1080 },
    { name: 'desktop-1440x900', width: 1440, height: 900 },
    { name: 'desktop-1280x800', width: 1280, height: 800 },
    { name: 'tablet-768x1024', width: 768, height: 1024 },
    { name: 'mobile-390x844', width: 390, height: 844 },
    { name: 'mobile-320x568', width: 320, height: 568 }
  ]

  for (const vp of viewports) {
    test(`Capture My Stores Dashboard Before (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await loginAndOpenMyStores(page)
      await page.waitForTimeout(500)

      const targetPath = path.join(SCREENSHOTS_DIR, `mystores-dashboard-${vp.name}.png`)
      await page.screenshot({ path: targetPath, fullPage: false })
      console.log(`Captured Before Dashboard: ${targetPath}`)
    })
  }

  test('Capture Create Store Step 1 Before (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenMyStores(page)

    // Click "Thêm Quán Mới"
    const addStoreBtn = page.getByRole('button', { name: /Thêm Quán Mới/i })
    await addStoreBtn.click()

    await expect(page.getByText(/Bước 1: Thông Tin Cơ Bản Quán Ăn/i)).toBeVisible()
    await page.waitForTimeout(400)

    const targetPath = path.join(SCREENSHOTS_DIR, 'mystores-create-store-step1-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Create Store Step 1: ${targetPath}`)
  })

  test('Capture Create Store Step 2 Before (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenMyStores(page)

    // Click "Thêm Quán Mới"
    await page.getByRole('button', { name: /Thêm Quán Mới/i }).click()
    await expect(page.getByText(/Bước 1: Thông Tin Cơ Bản Quán Ăn/i)).toBeVisible()

    // Fill minimum required in step 1 to proceed
    const main = page.locator('main')
    await main.locator('input[placeholder*="Ví dụ: Bánh Xèo"]').fill('Quán Thử Nghiệm')
    await page.getByRole('button', { name: /Chọn ngay|Đổi danh mục/i }).click()
    await expect(page.getByText('Chọn Danh Mục Ẩm Thực')).toBeVisible()
    await page.locator('button:has-text("Bánh Mì")').last().click()
    await main.locator('textarea[placeholder*="Gần Chợ Trạm"]').fill('Mô tả thử nghiệm quán')

    // Click Next
    await page.getByRole('button', { name: /Tiếp Tục: Địa Chỉ & GPS/i }).click()
    await expect(page.getByText(/Bước 2: Địa Chỉ & Bản Đồ Google Maps/i)).toBeVisible()
    await page.waitForTimeout(400)

    const targetPath = path.join(SCREENSHOTS_DIR, 'mystores-create-store-step2-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Create Store Step 2: ${targetPath}`)
  })

  test('Capture Edit Store Form Before (1440x900)', async ({ page }) => {
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

  test('Capture Dish Management Panel Before (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenMyStores(page)

    // Click "Quản Lý Món Ăn" on Bánh Mì Ba Lẹ
    const manageDishesBtn = page.getByRole('button', { name: /Quản Lý Món Ăn/i }).first()
    await manageDishesBtn.click()

    await expect(page.getByRole('heading', { name: /Thực Đơn Hiện Tại/i })).toBeVisible()
    await page.waitForTimeout(400)

    const targetPath = path.join(SCREENSHOTS_DIR, 'mystores-dish-management-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Dish Management Panel: ${targetPath}`)
  })

  test('Capture Submissions History Tab Before (1440x900)', async ({ page }) => {
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
