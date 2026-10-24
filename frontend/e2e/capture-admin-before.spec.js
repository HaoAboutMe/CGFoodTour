import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'before-batch-3d')

const MOCK_ADMIN_USER = {
  id: 'admin-test-id',
  username: 'admin_cangiuoc',
  email: 'admin@cangiuocfoodtour.vn',
  firstname: 'Hạo',
  lastname: 'Nguyễn Lê',
  roles: ['ADMIN', 'USER'],
  enabled: true,
  emailVerified: true,
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
}

const MOCK_ADMIN_STORES = [
  {
    id: 'store-pending-1',
    name: 'Bánh Mì Ba Lẹ Chợ Cần Giuộc Thơm Ngon Giòn Rụm Đậm Đà',
    addressLine: 'Khu phố 1, Thị trấn Cần Giuộc, Long An',
    landmarkNote: 'Đối diện nhà lồng chợ Cần Giuộc cũ',
    status: 'PENDING',
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
    description: 'Bánh mì thịt nướng gia truyền hơn 30 năm tại ngã ba Cần Giuộc.',
    foodItems: [
      { id: 'f-1', name: 'Bánh mì thịt nướng đặc biệt', price: 25000, description: 'Pate béo, thịt nướng than hoa thơm lừng' },
      { id: 'f-2', name: 'Bánh mì xíu mại trứng muối', price: 28000, description: 'Xíu mại sốt cà chua trứng muối đậm đà' },
      { id: 'f-3', name: 'Bánh mì chả lụa pate', price: 20000, description: 'Chả lụa nóng giòn dưa chua sốt ớt' }
    ]
  },
  {
    id: 'store-recovery-1',
    name: 'Lạp Xưởng Tươi Cô Chín Cần Giuộc',
    addressLine: 'Ấp Long Phú, Xã Tân Kim, Cần Giuộc, Long An',
    landmarkNote: 'Cạnh ngã ba Tân Kim hướng về phà Mỹ Lợi',
    status: 'HIDDEN',
    recoveryRequested: true,
    recoveryRequestReason: 'Quán đã hoàn tất sửa chữa nâng cấp cơ sở vật chất và có đủ giấy chứng nhận VSATTP mới nhất.',
    ownerUsername: 'cochincg',
    ownerEmail: 'cochin@lapxuong.vn',
    categoryId: 2,
    categoryName: 'Đặc Sản',
    openTime: '07:00',
    closeTime: '19:00',
    priceMin: 180000,
    priceMax: 260000,
    phoneNumber: '0918765432',
    bannerImageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800',
    satisfactionRate: 98,
    totalVotes: 120
  },
  {
    id: 'store-approved-1',
    name: 'Hủ Tiếu Mực Ông Già Cần Giuộc',
    addressLine: 'Số 42 Quốc Lộ 50, Thị trấn Cần Giuộc, Long An',
    status: 'APPROVED',
    ownerUsername: 'onggia_hutieu',
    ownerEmail: 'onggia@hutieu.vn',
    categoryId: 3,
    categoryName: 'Hủ Tiếu & Bún',
    openTime: '06:00',
    closeTime: '22:00',
    priceMin: 45000,
    priceMax: 70000,
    phoneNumber: '02723876543',
    bannerImageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=800',
    satisfactionRate: 92,
    totalVotes: 85
  },
  {
    id: 'store-rejected-1',
    name: 'Quán Nước Giải Khát Vỉa Hè Chợ Chiều',
    addressLine: 'Chân cầu Cần Giuộc',
    status: 'REJECTED',
    ownerUsername: 'quannuoc_viahe',
    ownerEmail: 'quannuoc@gmail.com',
    categoryId: 4,
    categoryName: 'Cà Phê & Nước',
    openTime: '15:00',
    closeTime: '23:00',
    priceMin: 10000,
    priceMax: 25000,
    bannerImageUrl: ''
  }
]

const MOCK_ADMIN_USERS = [
  {
    id: 'u-1',
    username: 'admin_cangiuoc',
    email: 'admin@cangiuocfoodtour.vn',
    firstname: 'Hạo',
    lastname: 'Nguyễn Lê',
    roles: ['ADMIN', 'USER'],
    enabled: true,
    emailVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
  },
  {
    id: 'u-2',
    username: 'chubale',
    email: 'bale@cangiuoc.vn',
    firstname: 'Lẹ',
    lastname: 'Trần Ba',
    roles: ['USER'],
    enabled: true,
    emailVerified: true
  },
  {
    id: 'u-3',
    username: 'cochincg',
    email: 'cochin@lapxuong.vn',
    firstname: 'Chín',
    lastname: 'Võ Thị',
    roles: ['USER'],
    enabled: true,
    emailVerified: true
  },
  {
    id: 'u-4',
    username: 'onggia_hutieu',
    email: 'onggia@hutieu.vn',
    firstname: 'Hải',
    lastname: 'Nguyễn Văn',
    roles: ['USER'],
    enabled: false,
    emailVerified: true
  }
]

const MOCK_CATEGORIES = [
  { id: 1, name: 'Bánh Mì', icon: 'fa-bread-slice' },
  { id: 2, name: 'Đặc Sản', icon: 'fa-drumstick-bite' },
  { id: 3, name: 'Hủ Tiếu & Bún', icon: 'fa-bowl-food' },
  { id: 4, name: 'Cà Phê & Nước', icon: 'fa-mug-hot' }
]

async function setupAdminRoutes(page) {
  // SSE events abort to avoid hanging
  await page.route('**/v1/stores/events**', (route) => route.abort())

  // Auth routes
  await page.route('**/auth/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          accessToken: 'mock-admin-access-token-jwt',
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
          accessToken: 'mock-admin-access-token-jwt',
          tokenType: 'Bearer'
        }
      })
    })
  })

  // Categories route (both /categories and /v1/categories)
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

  // Users routes (handles both /users and /users/me)
  await page.route('**/users**', async (route) => {
    const url = route.request().url()
    if (url.includes('/users/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: MOCK_ADMIN_USER
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
          content: MOCK_ADMIN_USERS,
          totalPages: 1,
          totalElements: MOCK_ADMIN_USERS.length,
          last: true,
          page: 0
        }
      })
    })
  })

  // Stores routes (summary, admin, public, mine, saved)
  await page.route('**/v1/stores**', async (route) => {
    const url = route.request().url()
    if (url.includes('/summary')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: {
            pending: 1,
            recoveryRequested: 1,
            approved: 1,
            hidden: 1,
            rejected: 1
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
          content: MOCK_ADMIN_STORES,
          totalPages: 1,
          totalElements: MOCK_ADMIN_STORES.length,
          last: true,
          page: 0
        }
      })
    })
  })
}

async function loginAndOpenAdmin(page) {
  await setupAdminRoutes(page)
  await page.goto('/explore')

  const avatarBtn = page.locator('header button:has(img[alt="avatar"])').first()
  const loginNavBtn = page.getByRole('button', { name: /Đăng Nhập/i }).first()

  // Wait for either avatar button or login button
  await Promise.race([
    avatarBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {}),
    loginNavBtn.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {})
  ])

  if (await loginNavBtn.isVisible()) {
    await loginNavBtn.click()
    const authDialog = page.getByRole('dialog', { name: /^Đăng Nhập$/i })
    await expect(authDialog).toBeVisible({ timeout: 5000 })
    await page.locator('#login-email').fill('admin@cangiuocfoodtour.vn')
    await page.locator('#login-password').fill('Admin@123456')
    await page.locator('form button[type="submit"]').click()
    await expect(authDialog).toBeHidden({ timeout: 5000 })
  }

  // Open User Dropdown Menu from Header
  await expect(avatarBtn).toBeVisible({ timeout: 8000 })
  // Hide DevConsole so it never intercepts pointer events
  await page.addStyleTag({ content: '.fixed.bottom-0.right-4 { display: none !important; }' }).catch(() => {})
  await avatarBtn.dispatchEvent('click')

  // Click "Bảng Quản Trị Hệ Thống" in dropdown
  const adminNavBtn = page.getByRole('button', { name: /Bảng Quản Trị Hệ Thống/i })
  await expect(adminNavBtn).toBeVisible({ timeout: 5000 })
  await adminNavBtn.dispatchEvent('click')

  // Verify Admin Dashboard is visible
  await expect(page.getByRole('heading', { name: /Bảng Tổng Quan Quản Trị/i })).toBeVisible({ timeout: 10000 })
  await page.addStyleTag({ content: '.fixed.bottom-0.right-4 { display: none !important; }' }).catch(() => {})
}

test.describe('Capture Before Baseline Screenshots for Admin Batch 3D', () => {
  const viewports = [
    { name: 'desktop-1920x1080', width: 1920, height: 1080 },
    { name: 'desktop-1440x900', width: 1440, height: 900 },
    { name: 'desktop-1280x800', width: 1280, height: 800 },
    { name: 'tablet-768x1024', width: 768, height: 1024 },
    { name: 'mobile-390x844', width: 390, height: 844 }
  ]

  for (const vp of viewports) {
    test(`Capture Admin Dashboard Before (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await loginAndOpenAdmin(page)
      await page.waitForTimeout(500)

      const targetPath = path.join(SCREENSHOTS_DIR, `admin-dashboard-${vp.name}.png`)
      await page.screenshot({ path: targetPath, fullPage: false })
      console.log(`Captured Before Dashboard: ${targetPath}`)
    })
  }

  test('Capture Admin Stores Tab Before (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenAdmin(page)

    // Click Quán Ăn nav
    const storesNavBtn = page.getByRole('button', { name: /Quán Ăn/i })
    await storesNavBtn.click({ force: true })

    await expect(page.getByRole('heading', { name: /Quản Lý Tất Cả Quán Ăn/i })).toBeVisible()
    await page.waitForTimeout(500)

    const targetPath = path.join(SCREENSHOTS_DIR, 'admin-stores-desktop-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Before Stores Tab: ${targetPath}`)
  })

  test('Capture Admin Users Tab Before (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenAdmin(page)

    // Click Người Dùng nav
    const usersNavBtn = page.getByRole('button', { name: /Người Dùng/i })
    await usersNavBtn.click({ force: true })

    await expect(page.getByRole('heading', { name: /Quản Lý Tài Khoản Người Dùng/i })).toBeVisible()
    await page.waitForTimeout(500)

    const targetPath = path.join(SCREENSHOTS_DIR, 'admin-users-desktop-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Before Users Tab: ${targetPath}`)
  })

  test('Capture Admin Categories Tab Before (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenAdmin(page)

    // Click Danh Mục nav
    const categoriesNavBtn = page.getByRole('button', { name: /Danh Mục/i })
    await categoriesNavBtn.click({ force: true })

    await expect(page.getByRole('heading', { name: /Danh Sách Danh Mục Ẩm Thực/i })).toBeVisible()
    await page.waitForTimeout(500)

    const targetPath = path.join(SCREENSHOTS_DIR, 'admin-categories-desktop-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Before Categories Tab: ${targetPath}`)
  })

  test('Capture Admin Viewing Store Modal Before (1440x900)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await loginAndOpenAdmin(page)

    // Click Chi Tiết on the first pending store
    const detailBtn = page.getByRole('button', { name: /Chi Tiết/i }).first()
    await detailBtn.click({ force: true })

    // Store Detail modal opens
    await expect(page.getByRole('heading', { name: /Bánh Mì Ba Lẹ/i })).toBeVisible()
    await page.waitForTimeout(500)

    const targetPath = path.join(SCREENSHOTS_DIR, 'admin-view-store-desktop-1440.png')
    await page.screenshot({ path: targetPath, fullPage: false })
    console.log(`Captured Before Store Detail: ${targetPath}`)
  })
})
