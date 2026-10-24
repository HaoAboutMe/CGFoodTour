import { test, expect } from '@playwright/test'

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
  let storesList = JSON.parse(JSON.stringify(MOCK_OWNED_STORES))

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
    const req = route.request()
    const method = req.method()
    const url = req.url()

    if (method === 'POST') {
      const postData = JSON.parse(req.postData() || '{}')
      const newStore = {
        id: `store-new-${Date.now()}`,
        name: postData.name || 'Quán mới tạo',
        addressLine: postData.addressLine || 'Địa chỉ mới',
        landmarkNote: postData.landmarkNote || '',
        status: 'PENDING',
        ownerUsername: 'chubale',
        ownerEmail: 'bale@cangiuoc.vn',
        categoryId: postData.categoryId || 1,
        categoryName: 'Bánh Mì',
        openTime: postData.openTime || '06:00',
        closeTime: postData.closeTime || '21:00',
        priceMin: postData.priceMin || 20000,
        priceMax: postData.priceMax || 50000,
        phoneNumber: postData.phoneNumber || '',
        bannerImageUrl: '',
        latitude: postData.latitude || 10.605,
        longitude: postData.longitude || 106.672,
        savedCount: 0,
        foodItems: []
      }
      storesList.push(newStore)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: newStore
        })
      })
      return
    }

    if (method === 'PUT') {
      const putData = JSON.parse(req.postData() || '{}')
      const urlParts = url.split('/')
      const storeId = urlParts[urlParts.length - 1].split('?')[0]
      const idx = storesList.findIndex(s => s.id === storeId)
      if (idx !== -1) {
        storesList[idx] = { ...storesList[idx], ...putData }
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: storesList[idx] || putData
        })
      })
      return
    }

    // Default GET stores/mine or GET stores
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          content: storesList,
          totalPages: 1,
          totalElements: storesList.length,
          last: true,
          page: 0
        }
      })
    })
  })

  // Food items endpoints
  await page.route(/\/v1\/food-items/, async (route) => {
    const req = route.request()
    const method = req.method()

    if (method === 'POST') {
      const data = JSON.parse(req.postData() || '{}')
      const createdItem = {
        id: `f-${Date.now()}`,
        name: data.name,
        price: data.price,
        description: data.description,
        imageUrl: ''
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: createdItem
        })
      })
      return
    }

    if (method === 'PUT') {
      const data = JSON.parse(req.postData() || '{}')
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { id: 'f-1', ...data }
        })
      })
      return
    }

    if (method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: true
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
}

test.describe('My Stores & Dish Management Desktop UX Tests (Batch 3E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  test('1. Owner Dashboard displays KPI Metric Cards and authentic copy', async ({ page }) => {
    await loginAndOpenMyStores(page)

    // Check heading and badge
    await expect(page.getByRole('heading', { name: /Quán Ăn Của Tôi/i })).toBeVisible()
    await expect(page.getByText('Cổng Chủ Quán (Owner Portal)')).toBeVisible()

    // Check KPI Stat Tiles
    await expect(page.getByText('Tổng Số Quán').first()).toBeVisible()
    await expect(page.getByText('Đang Hoạt Động').first()).toBeVisible()
    await expect(page.getByText('Chờ Phê Duyệt').first()).toBeVisible()
    await expect(page.getByText('Cần Chú Ý').first()).toBeVisible()

    // Total should be 4
    await expect(page.locator('text=4').first()).toBeVisible()
  })

  test('2. Live Search and Status Filter toolbar filters store items accurately', async ({ page }) => {
    await loginAndOpenMyStores(page)

    // Search for "Bà Mười"
    const searchInput = page.getByPlaceholder('Tìm kiếm theo tên quán, địa chỉ...')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('Bà Mười')

    // Should only see Bánh Xèo Bà Mười
    await expect(page.getByText('Bánh Xèo Bà Mười Giòn Rụm Chợ Trạm').first()).toBeVisible()
    await expect(page.getByText('Bánh Mì Ba Lẹ Chợ Cần Giuộc')).toBeHidden()

    // Clear search
    await page.locator('button:has-text("✕")').click()
    await expect(page.getByText('Bánh Mì Ba Lẹ Chợ Cần Giuộc').first()).toBeVisible()

    // Filter by "Từ chối"
    await page.getByRole('button', { name: 'Từ chối', exact: true }).click()
    await expect(page.getByText('Quán Nước Vỉa Hè Chân Cầu Cần Giuộc').first()).toBeVisible()
    await expect(page.getByText('Bánh Mì Ba Lẹ Chợ Cần Giuộc')).toBeHidden()

    // Reset to "Tất cả"
    await page.getByRole('button', { name: 'Tất cả', exact: true }).click()
    await expect(page.getByText('Bánh Mì Ba Lẹ Chợ Cần Giuộc').first()).toBeVisible()
  })

  test('3. Desktop View Mode toggle switches between Grid and Table views', async ({ page }) => {
    await loginAndOpenMyStores(page)

    // Initially in Grid mode
    await expect(page.getByTitle('Chế độ bảng dữ liệu')).toBeVisible()
    await page.getByTitle('Chế độ bảng dữ liệu').click()

    // Table view header should be visible
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Quán Ăn' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Vị Trí & Tọa Độ' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Trạng Thái' })).toBeVisible()

    // Switch back to Grid mode
    await page.getByTitle('Chế độ lưới').click()
    await expect(page.getByRole('table')).toBeHidden()
  })

  test('4. Create Store Form displays 2-column layout with validation and GPS parsing', async ({ page }) => {
    await loginAndOpenMyStores(page)

    // Open Add Store
    await page.getByRole('button', { name: /Thêm Quán Mới/i }).click()
    await expect(page.getByRole('heading', { name: /Đăng Ký Địa Điểm Ẩm Thực/i })).toBeVisible()

    // Verify 2-column sections are visible side-by-side
    await expect(page.getByText(/Bước 1: Thông Tin Cơ Bản Quán Ăn/i)).toBeVisible()
    await expect(page.getByText(/Bước 2: Địa Chỉ & Bản Đồ Google Maps/i)).toBeVisible()

    // Try submitting empty to test validation alert
    await page.getByRole('button', { name: /Gửi Quán Ăn Chờ Duyệt/i }).click()
    await expect(page.getByText(/Vui lòng nhập Tên quán ăn/i)).toBeVisible()

    // Fill Store Name
    await page.getByPlaceholder('Ví dụ: Bánh Xèo Bà Mười').fill('Quán Bánh Cống Cần Giuộc Mới')

    // Open Category Picker Modal
    await page.getByRole('button', { name: /Chọn ngay|Đổi danh mục/i }).click()
    const catDialog = page.getByRole('dialog', { name: 'Chọn Danh Mục Ẩm Thực' })
    await expect(catDialog).toBeVisible()

    // Select "Đặc Sản"
    await page.locator('button:has-text("Đặc Sản")').last().click()
    await expect(catDialog).toBeHidden()

    // Fill Landmark/Description
    await page.locator('textarea[placeholder*="Gần Chợ Trạm"]').fill('Quán bánh cống giòn rụm với đậu xanh và tôm sông tươi')

    // Test Google Maps parsing
    const gmapsInput = page.getByPlaceholder(/Dán link Google Maps hoặc dãy tọa độ/i)
    await gmapsInput.fill('https://www.google.com/maps/place/10.60500,106.67200')
    await expect(page.getByText(/Đã trích xuất thành công: Vĩ độ/i)).toBeVisible()

    // Fill Address
    await page.getByPlaceholder('Số 45, Quốc Lộ 50, Cần Giuộc').fill('123 Đường Nguyễn Thái Bình, Cần Giuộc')

    // Enter Price Min: 25 -> display has .000đ
    const priceMinInput = page.locator('input[placeholder="0"]').first()
    await priceMinInput.fill('25')
    await expect(page.locator('text=.000đ').first()).toBeVisible()

    // Submit Store Creation
    await page.getByRole('button', { name: /Gửi Quán Ăn Chờ Duyệt/i }).click()

    // After success, it immediately switches into Dish Management for this new store
    await expect(page.getByRole('heading', { name: /Thực Đơn/i }).first()).toBeVisible({ timeout: 10000 })
  })

  test('5. Edit Store Form preserves dirty state check and discard modal', async ({ page }) => {
    await loginAndOpenMyStores(page)

    // Click "Sửa" on Bánh Mì Ba Lẹ
    const editBtn = page.getByRole('button', { name: 'Sửa', exact: true }).first()
    await editBtn.click()

    await expect(page.getByRole('heading', { name: /Chỉnh Sửa Quán Ăn/i })).toBeVisible()

    // Modify store name to make it dirty
    const nameInput = page.locator('input[value*="Bánh Mì Ba Lẹ"]').first()
    await nameInput.fill('Bánh Mì Ba Lẹ Đã Chỉnh Sửa')

    // Click Close 'X' button
    await page.getByTitle('Đóng form chỉnh sửa').click()

    // Discard modal should appear
    const discardModal = page.getByRole('dialog', { name: /Bỏ thay đổi chưa lưu/i })
    await expect(discardModal).toBeVisible()

    // Click "Tiếp tục chỉnh sửa" -> modal closes, form remains
    await page.getByRole('button', { name: /Tiếp tục chỉnh sửa/i }).click()
    await expect(discardModal).toBeHidden()
    await expect(page.getByRole('heading', { name: /Chỉnh Sửa Quán Ăn/i })).toBeVisible()

    // Click Close again and select "Bỏ thay đổi" -> closes form back to store list
    await page.getByTitle('Đóng form chỉnh sửa').click()
    await page.getByRole('button', { name: /Bỏ thay đổi/i }).click()
    await expect(page.getByRole('heading', { name: /Quán Ăn Của Tôi/i })).toBeVisible()
  })

  test('6. Production Dish Management: Add dish with VND price conversion and delete confirmation', async ({ page }) => {
    await loginAndOpenMyStores(page)

    // Open Dish Management for Bánh Mì Ba Lẹ
    await page.getByRole('button', { name: /Quản Lý Món Ăn/i }).first().click()
    await expect(page.getByText('Thực Đơn Hiện Tại')).toBeVisible()

    // Verify existing dishes are displayed with VND format
    await expect(page.getByText('Bánh mì thịt nướng đặc biệt').first()).toBeVisible()
    await expect(page.getByText(/25[.,]000đ/).first()).toBeVisible()

    // Fill form to add new dish
    await page.getByPlaceholder('Ví dụ: Bánh Mì Thịt Nướng').fill('Bánh Mì Ốp La 2 Trứng')

    // Fill price: 20 (.000đ suffix)
    const dishPriceInput = page.locator('input[placeholder="0"]').last()
    await dishPriceInput.fill('20')
    await expect(page.locator('text=.000đ').last()).toBeVisible()

    await page.getByPlaceholder(/Thịt nướng xém cạnh/i).fill('Trứng lòng đào béo ngậy kèm nước tương ớt cay')

    // Submit dish
    await page.getByRole('button', { name: /Xác Nhận Thêm Món Ăn/i }).click()

    // Test Delete Dish Modal
    const deleteDishBtn = page.getByTitle('Xóa món').first()
    await deleteDishBtn.click()

    // ConfirmActionModal alertdialog should be visible
    const deleteModal = page.getByRole('alertdialog')
    await expect(deleteModal).toBeVisible()
    await expect(deleteModal.getByText(/sẽ bị xóa khỏi thực đơn/i)).toBeVisible()

    // Confirm deletion
    await deleteModal.getByRole('button', { name: 'Xóa món' }).click()
    await expect(deleteModal).toBeHidden()
  })

  test('7. Approval, Rejection & Recovery workflows render correct feedback', async ({ page }) => {
    await loginAndOpenMyStores(page)

    // 1. Check REJECTED store shows explicit reason callout
    await expect(page.getByText('Bị Từ Chối').first()).toBeVisible()
    await expect(
      page.getByText(/Địa chỉ chưa cụ thể số nhà và chưa đính kèm ảnh giấy chứng nhận/i).first()
    ).toBeVisible()

    // 2. Check HIDDEN by admin store shows "Admin Ẩn (Ban)" and "Xin Khôi Phục"
    await expect(page.getByText(/Admin Ẩn \(Ban\)/i).first()).toBeVisible()
    await expect(page.getByText(/Cần xác minh lại giấy phép vệ sinh an toàn thực phẩm/i).first()).toBeVisible()
    const recoverBtn = page.getByRole('button', { name: /Xin Khôi Phục|Gửi Yêu Cầu Khôi Phục/i }).first()
    await expect(recoverBtn).toBeVisible()

    // Click recover button to open action modal
    await recoverBtn.click()
    const actionDialog = page.getByRole('dialog')
    await expect(actionDialog).toBeVisible()
  })

  test('8. Accessibility: Escape key dismisses open modals safely', async ({ page }) => {
    await loginAndOpenMyStores(page)

    // Open Add Store
    await page.getByRole('button', { name: /Thêm Quán Mới/i }).click()

    // Open Category Modal
    await page.getByRole('button', { name: /Chọn ngay|Đổi danh mục/i }).click()
    const catDialog = page.getByRole('dialog', { name: 'Chọn Danh Mục Ẩm Thực' })
    await expect(catDialog).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')
    await expect(catDialog).toBeHidden()

    // Open Google Maps Guide
    await page.getByRole('button', { name: /Hướng dẫn lấy link/i }).click()
    const guideDialog = page.getByRole('dialog', { name: /Hướng Dẫn Lấy Link Google Maps/i })
    await expect(guideDialog).toBeVisible()

    // Press Escape
    await page.keyboard.press('Escape')
    await expect(guideDialog).toBeHidden()
  })
})
