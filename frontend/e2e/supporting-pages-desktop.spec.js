import { test, expect } from '@playwright/test'

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

async function setupSupportingRoutes(page, customSaved = MOCK_SAVED_STORES) {
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
            content: customSaved,
            page: 0,
            size: 24,
            totalElements: customSaved.length,
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
    if (url.includes('/save')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: {
            isSaved: false,
            savedCount: 17
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

  const avatarBtn = page.locator('header button:has(img[alt=""])').first()
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

  await expect(page.locator('header')).toBeVisible({ timeout: 8000 })
}

test.describe('Batch 3F: Supporting Pages & Desktop Header E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  test('1. Desktop Header: Layout, Brand, Nav Links & Active page indicator', async ({ page }) => {
    await setupSupportingRoutes(page)
    await loginUser(page)

    // Check fixed header is present
    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Brand logo & title check
    const brandBtn = page.getByRole('button', { name: /Trang chủ Cần Giuộc Food Tour/i })
    await expect(brandBtn).toBeVisible()

    // Check navigation buttons exist with aria-label
    const exploreNav = page.getByRole('button', { name: /Khám Phá Ẩm Thực/i })
    const cs2Nav = page.getByRole('button', { name: /Vòng Xoay Quán Ăn/i })
    const savedNav = page.getByRole('button', { name: /Quán Đã Lưu/i }).first()
    const aboutNav = page.getByRole('button', { name: /Về Chúng Tôi/i }).first()

    await expect(exploreNav).toBeVisible()
    await expect(cs2Nav).toBeVisible()
    await expect(savedNav).toBeVisible()
    await expect(aboutNav).toBeVisible()

    // Explore should be active initially
    await expect(exploreNav).toHaveAttribute('aria-current', 'page')

    // Navigate to CS2 Spinner
    await cs2Nav.click()
    await expect(cs2Nav).toHaveAttribute('aria-current', 'page')
    await expect(exploreNav).not.toHaveAttribute('aria-current', 'page')

    // Navigate to About
    await aboutNav.click()
    await expect(aboutNav).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('heading', { name: /Bản Đồ Ẩm Thực Mở Đất Cần Giuộc/i })).toBeVisible()
  })

  test('2. Header User Dropdown: Keyboard Escape, ARIA roles & Profile Summary Card', async ({ page }) => {
    await setupSupportingRoutes(page)
    await loginUser(page)

    const avatarBtn = page.locator('header button[aria-haspopup="true"]')
    await expect(avatarBtn).toBeVisible()
    await expect(avatarBtn).toHaveAttribute('aria-expanded', 'false')

    // Open dropdown
    await avatarBtn.click()
    await expect(avatarBtn).toHaveAttribute('aria-expanded', 'true')

    const menu = page.locator('div[role="menu"]')
    await expect(menu).toBeVisible()

    // Check profile summary details inside menu
    await expect(menu.getByText('Hảo Nguyễn Lê')).toBeVisible()
    await expect(menu.getByText('@hoanhao')).toBeVisible()
    await expect(menu.getByText('hoanhao@cangiuoc.vn')).toBeVisible()
    await expect(menu.getByText('THÀNH VIÊN')).toBeVisible()

    // Check menu items
    await expect(menu.getByRole('button', { name: /Quán Ăn Đã Lưu/i })).toBeVisible()
    await expect(menu.getByRole('button', { name: /Thông Tin Tài Khoản/i })).toBeVisible()
    await expect(menu.getByRole('button', { name: /Quán Ăn Của Tôi/i })).toBeVisible()
    await expect(menu.getByRole('button', { name: /Đăng Xuất Tài Khoản/i })).toBeVisible()

    // Press Escape to close dropdown
    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(avatarBtn).toHaveAttribute('aria-expanded', 'false')
    // Focus should be restored on the trigger
    await expect(avatarBtn).toBeFocused()
  })

  test('3. Saved Stores: StoreCard Grid, Search filter & View Mode toggle', async ({ page }) => {
    await setupSupportingRoutes(page)
    await loginUser(page)

    // Navigate to Saved tab
    const savedNav = page.getByRole('button', { name: /Quán Đã Lưu/i }).first()
    await savedNav.click()

    // Title and total count
    await expect(page.getByRole('heading', { name: /Quán Ăn Đã Lưu/i })).toBeVisible()
    await expect(page.getByText('3 quán')).toBeVisible()

    // Search bar functionality
    const searchInput = page.locator('#saved-stores-search')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Ba Lẹ')
    await page.waitForTimeout(300)

    // Should only show Ba Lẹ
    await expect(page.getByRole('heading', { name: /Bánh Mì Ba Lẹ/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Hủ Tiếu Nam Vang/i })).toBeHidden()

    // Clear search
    await searchInput.fill('')
    await page.waitForTimeout(300)
    await expect(page.getByRole('heading', { name: /Hủ Tiếu Nam Vang/i })).toBeVisible()

    // Test View Mode toggle (Grid vs Compact)
    const compactBtn = page.getByRole('button', { name: /Chế độ danh sách thu gọn/i })
    await compactBtn.click()
    await page.waitForTimeout(200)

    // In compact mode, cards with data-view-mode="compact" should be visible
    const compactCards = page.locator('div[data-view-mode="compact"]')
    await expect(compactCards.first()).toBeVisible()

    // Toggle back to Grid
    const gridBtn = page.getByRole('button', { name: /Chế độ lưới ảnh lớn/i })
    await gridBtn.click()
    await page.waitForTimeout(200)
    const gridCards = page.locator('div[data-view-mode="grid"]')
    await expect(gridCards.first()).toBeVisible()
  })

  test('4. Saved Stores: Empty State & Navigation to Explore', async ({ page }) => {
    await setupSupportingRoutes(page, [])
    await loginUser(page)

    const savedNav = page.getByRole('button', { name: /Quán Đã Lưu/i }).first()
    await savedNav.click()

    // Global empty state
    await expect(page.getByText(/Chưa Có Quán Ăn Nào Được Lưu/i)).toBeVisible()

    // Click CTA button
    const exploreCta = page.getByRole('button', { name: /Khám Phá Quán Ăn Ngay ↗/i })
    await expect(exploreCta).toBeVisible()
    await exploreCta.click()

    // Should switch to explore tab
    const exploreNav = page.getByRole('button', { name: /Khám Phá Ẩm Thực/i })
    await expect(exploreNav).toHaveAttribute('aria-current', 'page')
  })

  test('5. User Profile Page: Form Fields, Readonly Email & Accessible Labels', async ({ page }) => {
    await setupSupportingRoutes(page)
    await loginUser(page)

    // Navigate to Profile via dropdown
    const avatarBtn = page.locator('header button[aria-haspopup="true"]')
    await avatarBtn.click()
    const profileItem = page.getByRole('button', { name: /Thông Tin Tài Khoản/i })
    await profileItem.click()

    // Check Hero Banner
    await expect(page.getByRole('heading', { name: /Quản Lý Cá Nhân/i })).toBeVisible()
    await expect(page.getByText('Thành Viên Ẩm Thực')).toBeVisible()
    await expect(page.getByText('Đã xác thực email')).toBeVisible()

    // Check Form Fields
    const emailField = page.locator('#profile-email-readonly')
    await expect(emailField).toBeVisible()
    await expect(emailField).toHaveValue('hoanhao@cangiuoc.vn')
    await expect(emailField).toBeDisabled()

    const usernameInput = page.locator('#profile-username')
    await expect(usernameInput).toBeVisible()
    await expect(usernameInput).toHaveValue('hoanhao')

    const firstnameInput = page.locator('#profile-firstname')
    const lastnameInput = page.locator('#profile-lastname')
    await expect(firstnameInput).toHaveValue('Hảo')
    await expect(lastnameInput).toHaveValue('Nguyễn Lê')

    const dobInput = page.locator('#profile-dob')
    await expect(dobInput).toHaveValue('2004-05-15')

    // Check Change Password section
    await expect(page.getByRole('heading', { name: /Đổi Mật Khẩu/i })).toBeVisible()
    const pwdOld = page.locator('#profile-pwd-old')
    const pwdNew = page.locator('#profile-pwd-new')
    await expect(pwdOld).toBeVisible()
    await expect(pwdNew).toBeVisible()

    // Test Show/Hide password toggle
    const toggleBtn = page.getByRole('button', { name: /Hiện mật khẩu mới/i })
    await expect(toggleBtn).toBeVisible()
    await pwdNew.fill('NewSecret@123')
    await toggleBtn.click()
    await expect(pwdNew).toHaveAttribute('type', 'text')
  })

  test('6. About Page: Hero, 2-Column Story, Values & CTA buttons', async ({ page }) => {
    await setupSupportingRoutes(page)
    await loginUser(page)

    const aboutNav = page.getByRole('button', { name: /Về Chúng Tôi/i }).first()
    await aboutNav.click()

    // Main heading
    await expect(page.getByRole('heading', { name: /Bản Đồ Ẩm Thực Mở Đất Cần Giuộc/i })).toBeVisible()

    // Mission and community contact
    await expect(page.getByRole('heading', { name: /Mục Đích Phát Triển Dự Án/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Đóng Góp & Kết Nối/i })).toBeVisible()

    const mailto = page.locator('a[href="mailto:cangiuocfoodtour@gmail.com"]:visible')
    await expect(mailto).toBeVisible()

    // Core values headings (Desktop)
    await expect(page.getByRole('heading', { name: /Tôn Vinh Ẩm Thực/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Thông Tin Xác Thực/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Hỗ Trợ Chủ Quán/i })).toBeVisible()

    // CTA buttons
    const exploreCta = page.getByRole('button', { name: /Khám Phá Quán Ăn ↗/i }).first()
    await expect(exploreCta).toBeVisible()
    await exploreCta.click()
    await expect(page.getByRole('button', { name: /Khám Phá Ẩm Thực/i })).toHaveAttribute('aria-current', 'page')
  })

  test('7. Responsive Viewports: Mobile 390px, Tablet 768px & Zero horizontal overflow', async ({ page }) => {
    await setupSupportingRoutes(page)

    // Test on Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 })
    await loginUser(page)

    // BottomNav should be visible on mobile
    const bottomNav = page.locator('nav.fixed.bottom-0')
    await expect(bottomNav).toBeVisible()

    // Switch to Saved via BottomNav
    const savedBottom = bottomNav.getByRole('button', { name: /Đã Lưu/i })
    await savedBottom.click()
    await expect(page.getByRole('heading', { name: /Quán Ăn Đã Lưu/i })).toBeVisible()

    // Check zero horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)

    // Switch to About via BottomNav
    const aboutBottom = bottomNav.getByRole('button', { name: /Về Chúng Tôi/i })
    await aboutBottom.click()
    await expect(page.getByRole('heading', { name: /Cần Giuộc Food Tour/i }).first()).toBeVisible()

    const aboutScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const aboutClientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(aboutScrollWidth).toBeLessThanOrEqual(aboutClientWidth + 1)
  })
})
