import { test, expect } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots', 'before-batch-3f')
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })

const MOCK_USER = {
  id: 'user-standard-1',
  username: 'hoanhao',
  email: 'hoanhao@cangiuoc.vn',
  firstname: 'Hảo',
  lastname: 'Nguyễn Lê',
  roles: ['USER'],
  enabled: true,
  emailVerified: true,
  dateOfBirth: '2004-05-15',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
}

const MOCK_SAVED_STORES = [
  {
    id: 'store-saved-1',
    name: 'Bánh Mì Ba Lẹ Chợ Cần Giuộc',
    addressLine: 'Khu phố 1, Thị trấn Cần Giuộc, Long An',
    status: 'APPROVED',
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
    satisfactionRate: 96,
    totalVotes: 52,
    savedCount: 18,
    isSaved: true
  },
  {
    id: 'store-saved-2',
    name: 'Hủ Tiếu Nam Vang Cô Út Cần Giuộc',
    addressLine: 'QL50, Xã Trường Bình, Cần Giuộc, Long An',
    status: 'APPROVED',
    categoryId: 3,
    categoryName: 'Hủ Tiếu & Bún',
    openTime: '06:30',
    closeTime: '22:00',
    priceMin: 35000,
    priceMax: 60000,
    phoneNumber: '0907654321',
    bannerImageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800',
    latitude: 10.608,
    longitude: 106.676,
    satisfactionRate: 92,
    totalVotes: 38,
    savedCount: 24,
    isSaved: true
  },
  {
    id: 'store-saved-3',
    name: 'Lạp Xưởng Tươi Cô Chín Cần Giuộc',
    addressLine: 'Ấp Long Phú, Xã Tân Kim, Cần Giuộc, Long An',
    status: 'APPROVED',
    categoryId: 2,
    categoryName: 'Đặc Sản',
    openTime: '07:00',
    closeTime: '19:00',
    priceMin: 180000,
    priceMax: 260000,
    phoneNumber: '0918765432',
    bannerImageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800',
    latitude: 10.622,
    longitude: 106.685,
    satisfactionRate: 98,
    totalVotes: 74,
    savedCount: 32,
    isSaved: true
  }
]

const MOCK_CATEGORIES = [
  { id: 1, name: 'Bánh Mì', icon: 'fa-bread-slice' },
  { id: 2, name: 'Đặc Sản', icon: 'fa-drumstick-bite' },
  { id: 3, name: 'Hủ Tiếu & Bún', icon: 'fa-bowl-food' },
  { id: 4, name: 'Cà Phê & Nước', icon: 'fa-mug-hot' }
]

async function setupCommonRoutes(page, savedList = MOCK_SAVED_STORES) {
  await page.route('**/v1/stores/events**', (route) => route.abort())

  await page.route('**/auth/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          accessToken: 'mock-supporting-token-jwt',
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
          accessToken: 'mock-supporting-token-jwt',
          tokenType: 'Bearer'
        }
      })
    })
  })

  await page.route(/\/users/, async (route) => {
    const url = route.request().url()
    if (url.includes('/users/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: MOCK_USER
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

  await page.route(/\/v1\/stores/, async (route) => {
    const url = route.request().url()
    if (url.includes('/saved')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: {
            content: savedList,
            page: 0,
            size: 24,
            totalElements: savedList.length,
            totalPages: 1,
            last: true
          }
        })
      })
      return
    }
    if (url.includes('/mine')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: {
            content: MOCK_SAVED_STORES,
            page: 0,
            size: 24,
            totalElements: MOCK_SAVED_STORES.length,
            totalPages: 1,
            last: true
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
          content: MOCK_SAVED_STORES,
          page: 0,
          size: 20,
          totalElements: MOCK_SAVED_STORES.length,
          totalPages: 1,
          last: true
        }
      })
    })
  })
}

async function loginUser(page) {
  await page.goto('/')

  const avatarBtn = page.locator('header button:has(img[alt="avatar"])').first()
  const loginNavBtn = page.getByRole('button', { name: /Đăng Nhập/i }).first()

  await Promise.race([
    avatarBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    loginNavBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
  ])

  if (await loginNavBtn.isVisible()) {
    await loginNavBtn.click()
    const authDialog = page.getByRole('dialog', { name: /^Đăng Nhập$/i })
    await expect(authDialog).toBeVisible({ timeout: 5000 })
    await page.locator('#login-email').fill('hoanhao@cangiuoc.vn')
    await page.locator('#login-password').fill('User@123456')
    await page.locator('form button[type="submit"]').click()
    await expect(authDialog).toBeHidden({ timeout: 5000 })
  }

  await expect(avatarBtn).toBeVisible({ timeout: 8000 })
}

test.describe('Batch 3F: Capture Before Screenshots', () => {
  test('1. Capture Header & Nav on Desktop 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await setupCommonRoutes(page)
    await loginUser(page)

    await page.waitForTimeout(600)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'header-desktop-1440.png')
    })
  })

  test('2. Capture User Dropdown Menu open on Desktop 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await setupCommonRoutes(page)
    await loginUser(page)

    const avatarBtn = page.locator('header button:has(img[alt="avatar"])').first()
    await avatarBtn.click()
    await page.waitForTimeout(400)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'header-user-dropdown-desktop-1440.png')
    })
  })

  test('3. Capture Header on Tablet 768x1024', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await setupCommonRoutes(page)
    await loginUser(page)

    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'header-tablet-768.png')
    })
  })

  test('4. Capture Header & BottomNav on Mobile 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setupCommonRoutes(page)
    await loginUser(page)

    await page.waitForTimeout(500)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'header-mobile-390.png')
    })
  })

  test('5. Capture Saved Stores on Desktop 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await setupCommonRoutes(page)
    await loginUser(page)

    const savedNavBtn = page.getByRole('button', { name: /quán đã lưu/i }).first()
    await savedNavBtn.click()
    await page.waitForTimeout(600)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'saved-stores-desktop-1440.png')
    })
  })

  test('6. Capture Saved Stores Empty State on Desktop 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await setupCommonRoutes(page, [])
    await loginUser(page)

    const savedNavBtn = page.getByRole('button', { name: /quán đã lưu/i }).first()
    await savedNavBtn.click()
    await page.waitForTimeout(600)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'saved-stores-empty-desktop-1440.png')
    })
  })

  test('7. Capture Saved Stores on Mobile 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setupCommonRoutes(page)
    await loginUser(page)

    const savedBottomBtn = page.locator('nav.fixed.bottom-0 button').filter({ hasText: /đã lưu/i })
    await savedBottomBtn.click()
    await page.waitForTimeout(600)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'saved-stores-mobile-390.png')
    })
  })

  test('8. Capture Profile Page on Desktop 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await setupCommonRoutes(page)
    await loginUser(page)

    const avatarBtn = page.locator('header button:has(img[alt="avatar"])').first()
    await avatarBtn.click()
    await page.waitForTimeout(300)
    const profileLink = page.getByRole('button', { name: /thông tin tài khoản/i })
    await profileLink.click()
    await page.waitForTimeout(600)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'profile-desktop-1440.png')
    })
  })

  test('9. Capture Profile Page on Mobile 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setupCommonRoutes(page)
    await loginUser(page)

    const profileBottomBtn = page.locator('nav.fixed.bottom-0 button').filter({ hasText: /tài khoản/i })
    await profileBottomBtn.click()
    await page.waitForTimeout(600)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'profile-mobile-390.png')
    })
  })

  test('10. Capture About Page on Desktop 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await setupCommonRoutes(page)
    await loginUser(page)

    const aboutNavBtn = page.getByRole('button', { name: /về chúng tôi/i }).first()
    await aboutNavBtn.click()
    await page.waitForTimeout(600)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'about-desktop-1440.png')
    })
  })

  test('11. Capture About Page on Mobile 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setupCommonRoutes(page)
    await loginUser(page)

    const aboutBottomBtn = page.locator('nav.fixed.bottom-0 button').filter({ hasText: /về chúng tôi/i })
    await aboutBottomBtn.click()
    await page.waitForTimeout(600)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'about-mobile-390.png')
    })
  })

  test('12. Capture My Stores Header Clearance on Desktop 1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await setupCommonRoutes(page)
    await loginUser(page)

    const avatarBtn = page.locator('header button:has(img[alt="avatar"])').first()
    await avatarBtn.click()
    await page.waitForTimeout(300)
    const myStoresLink = page.getByRole('button', { name: /quán ăn của tôi/i })
    await myStoresLink.click()
    await page.waitForTimeout(600)

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mystores-header-clearance-desktop-1440.png')
    })
  })
})
