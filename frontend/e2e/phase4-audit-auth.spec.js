import { test, expect } from '@playwright/test'

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

const MOCK_STORES = [
  {
    id: 'store-pending-1',
    name: 'Bánh Mì Ba Lẹ Chợ Cần Giuộc Thơm Ngon',
    addressLine: 'Khu phố 1, Thị trấn Cần Giuộc, Long An',
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
    satisfactionRate: 95,
    totalVotes: 48,
    foodItems: [
      { id: 'f-1', name: 'Bánh mì thịt nướng đặc biệt', price: 25000, description: 'Pate béo thơm' }
    ]
  },
  {
    id: 'store-approved-1',
    name: 'Hủ Tíu Mỹ Tho Cần Giuộc Quán Cũ',
    addressLine: 'Số 12 QL50, Thị trấn Cần Giuộc, Long An',
    status: 'APPROVED',
    ownerId: 'admin-test-id',
    ownerUsername: 'admin_cangiuoc',
    ownerEmail: 'admin@cangiuocfoodtour.vn',
    categoryId: 3,
    categoryName: 'Hủ Tiếu & Bún',
    openTime: '06:30',
    closeTime: '22:00',
    priceMin: 35000,
    priceMax: 50000,
    phoneNumber: '0907654321',
    satisfactionRate: 98,
    totalVotes: 120,
    foodItems: [
      { id: 'f-3', name: 'Hủ tíu sườn giò', price: 45000, description: 'Sườn heo ninh mềm' }
    ]
  }
]

const MOCK_CATEGORIES = [
  { id: 1, name: 'Bánh Mì', icon: 'fa-bread-slice' },
  { id: 2, name: 'Đặc Sản', icon: 'fa-drumstick-bite' },
  { id: 3, name: 'Hủ Tiếu & Bún', icon: 'fa-bowl-food' },
  { id: 4, name: 'Cà Phê & Nước', icon: 'fa-mug-hot' }
]

const MOCK_USERS = [
  {
    id: 'admin-test-id',
    username: 'admin_cangiuoc',
    email: 'admin@cangiuocfoodtour.vn',
    firstname: 'Hạo',
    lastname: 'Nguyễn Lê',
    roles: ['ADMIN', 'USER'],
    enabled: true,
    emailVerified: true
  },
  {
    id: 'u-2',
    username: 'chubale',
    email: 'bale@cangiuoc.vn',
    firstname: 'Lẹ',
    lastname: 'Trần Văn',
    roles: ['USER'],
    enabled: true,
    emailVerified: true
  }
]

async function setupMocks(page) {
  await page.route('**/v1/stores/events**', (route) => route.abort())
  await page.route('**/auth/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1000, result: { accessToken: 'mock-jwt', tokenType: 'Bearer' } })
    })
  })
  await page.route('**/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1000, result: { accessToken: 'mock-jwt', tokenType: 'Bearer' } })
    })
  })
  await page.route('**/*categories*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1000, result: MOCK_CATEGORIES })
    })
  })
  await page.route('**/users/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1000, result: MOCK_ADMIN_USER })
    })
  })
  await page.route('**/users**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: { content: MOCK_USERS, totalPages: 1, totalElements: 2, page: 0 }
      })
    })
  })
  await page.route('**/v1/stores**', async (route) => {
    const url = route.request().url()
    if (url.includes('/my-stores')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: [MOCK_STORES[1]] })
      })
      return
    }
    if (url.includes('/admin/pending')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { content: [MOCK_STORES[0]], totalPages: 1, totalElements: 1, page: 0 }
        })
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1000, result: MOCK_STORES })
    })
  })
  await page.route('**/v1/history/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: [
          {
            id: 101,
            storeId: 'store-approved-1',
            storeName: 'Hủ Tíu Mỹ Tho Cần Giuộc Quán Cũ',
            actionType: 'APPROVE',
            createdAt: '2026-10-24T10:00:00Z',
            actorRole: 'ADMIN',
            reason: 'Đầy đủ giấy phép và thông tin thực đơn đạt chuẩn.',
            statusBefore: 'PENDING',
            statusAfter: 'APPROVED'
          }
        ]
      })
    })
  })
}

async function loginAsAdmin(page) {
  await setupMocks(page)
  await page.goto('/explore')

  const loginNavBtn = page.getByRole('button', { name: /Đăng Nhập/i }).first()
  if (await loginNavBtn.isVisible()) {
    await loginNavBtn.click({ force: true })
    const authDialog = page.getByRole('dialog')
    await expect(authDialog).toBeVisible({ timeout: 5000 })
    await page.locator('#login-email').fill('admin@cangiuocfoodtour.vn')
    await page.locator('#login-password').fill('Admin@123456')
    await page.locator('form button[type="submit"]').click({ force: true })
    await expect(authDialog).toBeHidden({ timeout: 5000 })
    await page.waitForTimeout(600)
  }
}

async function navigateToAdmin(page, width) {
  if (width < 768) {
    const adminNavBtn = page.locator('nav.fixed.bottom-0 button:has-text("Admin")')
    if (await adminNavBtn.isVisible()) {
      await adminNavBtn.click({ force: true })
    }
  } else {
    const avatarBtn = page.locator('header button:has(img[alt="avatar"])').first()
    if (await avatarBtn.isVisible()) {
      await avatarBtn.dispatchEvent('click')
      const adminNavBtn = page.getByRole('button', { name: /Bảng Quản Trị Hệ Thống/i })
      if (await adminNavBtn.isVisible()) {
        await adminNavBtn.dispatchEvent('click')
      }
    }
  }
  await page.waitForTimeout(800)
}

async function navigateToMyStores(page, width) {
  if (width < 768) {
    const myStoresNavBtn = page.locator('nav.fixed.bottom-0 button:has-text("Quán Tôi")')
    if (await myStoresNavBtn.isVisible()) {
      await myStoresNavBtn.click({ force: true })
    }
  } else {
    const avatarBtn = page.locator('header button:has(img[alt="avatar"])').first()
    if (await avatarBtn.isVisible()) {
      await avatarBtn.dispatchEvent('click')
      const myStoresBtn = page.getByRole('button', { name: /Quán Ăn Của Tôi/i })
      if (await myStoresBtn.isVisible()) {
        await myStoresBtn.dispatchEvent('click')
      }
    }
  }
  await page.waitForTimeout(800)
}

async function navigateToProfile(page, width) {
  if (width < 768) {
    const profileNavBtn = page.locator('nav.fixed.bottom-0 button:has-text("Tài Khoản")')
    if (await profileNavBtn.isVisible()) {
      await profileNavBtn.click({ force: true })
    }
  } else {
    const avatarBtn = page.locator('header button:has(img[alt="avatar"])').first()
    if (await avatarBtn.isVisible()) {
      await avatarBtn.dispatchEvent('click')
      const profileBtn = page.getByRole('button', { name: /Thông Tin Tài Khoản/i })
      if (await profileBtn.isVisible()) {
        await profileBtn.dispatchEvent('click')
      }
    }
  }
  await page.waitForTimeout(800)
}

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568 },
  { name: '375x667', width: 375, height: 667 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1280x800', width: 1280, height: 800 }
]

test.describe('Phase 4A: Authenticated Admin & MyStores Inspection', () => {
  for (const vp of VIEWPORTS) {
    test(`Inspect Admin Dashboard at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await loginAsAdmin(page, vp.width)
      await navigateToAdmin(page, vp.width)

      await page.screenshot({
        path: `e2e/screenshots/phase-4a-audit/admin-dashboard-${vp.width}x${vp.height}.png`,
        fullPage: false
      })

      // Mobile sidebar & stores tab
      if (vp.width < 768) {
        const menuBtn = page.getByRole('button', { name: /menu quản trị/i }).first()
        if (await menuBtn.isVisible()) {
          await menuBtn.click({ force: true })
          await page.waitForTimeout(400)
          await page.screenshot({
            path: `e2e/screenshots/phase-4a-audit/admin-sidebar-open-${vp.width}x${vp.height}.png`,
            fullPage: false
          })
          const storesTab = page.getByRole('button', { name: /Quán Ăn/i }).first()
          await storesTab.click({ force: true })
          await page.waitForTimeout(600)
          await page.screenshot({
            path: `e2e/screenshots/phase-4a-audit/admin-stores-${vp.width}x${vp.height}.png`,
            fullPage: false
          })
        }
      } else {
        const storesTab = page.getByRole('button', { name: /Quán Ăn/i }).first()
        if (await storesTab.isVisible()) {
          await storesTab.click({ force: true })
          await page.waitForTimeout(600)
          await page.screenshot({
            path: `e2e/screenshots/phase-4a-audit/admin-stores-${vp.width}x${vp.height}.png`,
            fullPage: false
          })
        }
      }
    })

    test(`Inspect My Stores & History at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await loginAsAdmin(page, vp.width)
      await navigateToMyStores(page, vp.width)

      await page.screenshot({
        path: `e2e/screenshots/phase-4a-audit/mystores-${vp.width}x${vp.height}.png`,
        fullPage: false
      })

      // Switch to History Submissions tab
      const historyTab = page.getByRole('button', { name: /Lịch Sử Kiểm Duyệt|Đã Gửi/i }).first()
      if (await historyTab.isVisible()) {
        await historyTab.click({ force: true })
        await page.waitForTimeout(600)
        await page.screenshot({
          path: `e2e/screenshots/phase-4a-audit/mystores-history-${vp.width}x${vp.height}.png`,
          fullPage: false
        })
      }
    })

    test(`Inspect Profile Page at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await loginAsAdmin(page, vp.width)
      await navigateToProfile(page, vp.width)

      await page.screenshot({
        path: `e2e/screenshots/phase-4a-audit/profile-${vp.width}x${vp.height}.png`,
        fullPage: false
      })
    })
  }
})
