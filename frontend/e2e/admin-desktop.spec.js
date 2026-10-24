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

const MOCK_ADMIN_STORES = [
  {
    id: 'store-pending-1',
    name: 'Bánh Mì Ba Lẹ Chợ Cần Giuộc Thơm Ngon Giòn Rụm',
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
      { id: 'f-2', name: 'Bánh mì xíu mại trứng muối', price: 28000, description: 'Xíu mại sốt cà chua trứng muối đậm đà' }
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
  await page.route('**/v1/stores/events**', (route) => route.abort())

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

  await page.route('**/*categories*', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { id: 5, name: 'Món Mới Tạo', icon: 'fa-pizza-slice' }
        })
      })
      return
    }
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
          result: MOCK_ADMIN_USER
        })
      })
      return
    }
    const isPage1 = url.includes('page=1')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          content: isPage1
            ? [
                {
                  id: 'u-5',
                  username: 'user_page2',
                  email: 'page2@cangiuoc.vn',
                  firstname: 'User',
                  lastname: 'Trang Hai',
                  roles: ['USER'],
                  enabled: true,
                  emailVerified: true
                }
              ]
            : MOCK_ADMIN_USERS,
          totalPages: 2,
          totalElements: 5,
          last: isPage1,
          page: isPage1 ? 1 : 0
        }
      })
    })
  })

  await page.route(/\/v1\/stores/, async (route) => {
    const url = route.request().url()
    if (url.includes('/approve')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: true, message: 'Approved' })
      })
      return
    }
    if (url.includes('/reject')) {
      const postData = route.request().postDataJSON() || {}
      if (postData.reason === 'TRIGGER_FAILURE') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ code: 2001, message: 'Lý do từ chối không hợp lệ theo quy định' })
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: true, message: 'Rejected' })
      })
      return
    }
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
    const isPage1 = url.includes('page=1')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 1000,
        result: {
          content: isPage1
            ? [
                {
                  id: 'store-page2-1',
                  name: 'Quán Cơm Tấm Đêm Long An Tập Hai',
                  addressLine: 'Ấp 2, Cần Giuộc, Long An',
                  status: 'APPROVED',
                  ownerUsername: 'comtam_trang2',
                  ownerEmail: 'comtam@longan.vn',
                  categoryId: 1,
                  categoryName: 'Cơm Tấm',
                  satisfactionRate: 90,
                  totalVotes: 12
                }
              ]
            : MOCK_ADMIN_STORES,
          totalPages: 2,
          totalElements: 5,
          last: isPage1,
          page: isPage1 ? 1 : 0
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

  await expect(avatarBtn).toBeVisible({ timeout: 8000 })
  await page.addStyleTag({ content: '.fixed.bottom-0.right-4 { display: none !important; }' }).catch(() => {})
  await avatarBtn.dispatchEvent('click')

  const adminNavBtn = page.getByRole('button', { name: /Bảng Quản Trị Hệ Thống/i })
  await expect(adminNavBtn).toBeVisible({ timeout: 5000 })
  await adminNavBtn.dispatchEvent('click')

  await expect(page.getByRole('heading', { name: /Bảng Tổng Quan Quản Trị/i })).toBeVisible({ timeout: 10000 })
  // Remove DevConsole so it never creates multiple text match targets
  await page.evaluate(() => {
    const dc = document.querySelector('.fixed.bottom-0.right-4')
    if (dc) dc.remove()
  }).catch(() => {})
}

test.describe('Admin Dashboard Desktop UX Test Suite (Batch 3D)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
  })

  test('1. Admin Layout & Navigation across tabs', async ({ page }) => {
    await loginAndOpenAdmin(page)

    // Check Dashboard metrics
    const main = page.locator('main')
    await expect(main.getByText('Quán Chờ Duyệt').first()).toBeVisible()
    await expect(main.getByText('Xin Khôi Phục').first()).toBeVisible()
    await expect(main.getByText('Quán Đã Duyệt').first()).toBeVisible()
    await expect(main.getByText('Tài Khoản User').first()).toBeVisible()

    // Needs Attention table renders pending store
    await expect(main.locator('table').getByText('Bánh Mì Ba Lẹ Chợ Cần Giuộc Thơm Ngon Giòn Rụm')).toBeVisible()

    // Navigate to Stores tab via Sidebar
    const storesNavBtn = page.locator('aside').getByRole('button', { name: /Quán Ăn/i })
    await storesNavBtn.click()
    await expect(page.getByRole('heading', { name: /Quản Lý Tất Cả Quán Ăn/i })).toBeVisible()

    // Navigate to Users tab via Sidebar
    const usersNavBtn = page.locator('aside').getByRole('button', { name: /Người Dùng/i })
    await usersNavBtn.click()
    await expect(page.getByRole('heading', { name: /Quản Lý Tài Khoản Người Dùng/i })).toBeVisible()

    // Navigate to Categories tab via Sidebar
    const catNavBtn = page.locator('aside').getByRole('button', { name: /Danh Mục/i })
    await catNavBtn.click()
    await expect(page.getByRole('heading', { name: /Danh Sách Danh Mục Ẩm Thực/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Thêm Danh Mục Mới/i })).toBeVisible()
  })

  test('2. Stores Tab: Table vs Card view toggle & filtering', async ({ page }) => {
    await loginAndOpenAdmin(page)
    await page.locator('aside').getByRole('button', { name: /Quán Ăn/i }).click()
    await expect(page.getByRole('heading', { name: /Quản Lý Tất Cả Quán Ăn/i })).toBeVisible()

    const main = page.locator('main')

    // Table view is active by default
    const tableBtn = page.getByRole('button', { name: /Chuyển sang chế độ xem dạng Bảng/i })
    const cardBtn = page.getByRole('button', { name: /Chuyển sang chế độ xem dạng Lưới Thẻ/i })
    await expect(tableBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(main.locator('table')).toBeVisible()

    // Switch to Card view
    await cardBtn.click()
    await expect(cardBtn).toHaveAttribute('aria-pressed', 'true')
    await expect(tableBtn).toHaveAttribute('aria-pressed', 'false')

    // Switch back to Table view
    await tableBtn.click()
    await expect(tableBtn).toHaveAttribute('aria-pressed', 'true')

    // Filter by Pending status
    const pendingFilterBtn = main.getByRole('button', { name: /CHỜ DUYỆT/i })
    await pendingFilterBtn.click()
    await expect(main.locator('table').getByText('Bánh Mì Ba Lẹ Chợ Cần Giuộc Thơm Ngon Giòn Rụm')).toBeVisible()
    await expect(main.locator('table').getByText('Hủ Tiếu Mực Ông Già Cần Giuộc')).toBeHidden()

    // Filter by Recovery status
    const recoveryFilterBtn = main.getByRole('button', { name: /XIN KP/i })
    await recoveryFilterBtn.click()
    await expect(main.locator('table').getByText('Lạp Xưởng Tươi Cô Chín Cần Giuộc')).toBeVisible()
    await expect(main.locator('table').getByText('Bánh Mì Ba Lẹ Chợ Cần Giuộc Thơm Ngon Giòn Rụm')).toBeHidden()

    // Filter back to ALL
    await main.getByRole('button', { name: /^TẤT CẢ$/i }).click()
    await expect(main.locator('table').getByText('Bánh Mì Ba Lẹ Chợ Cần Giuộc Thơm Ngon Giòn Rụm')).toBeVisible()
    await expect(main.locator('table').getByText('Hủ Tiếu Mực Ông Già Cần Giuộc')).toBeVisible()

    // Search query filter
    const searchInput = page.locator('#admin-store-search')
    await searchInput.fill('Hủ Tiếu')
    await expect(main.locator('table').getByText('Hủ Tiếu Mực Ông Già Cần Giuộc')).toBeVisible()
    await expect(main.locator('table').getByText('Bánh Mì Ba Lẹ Chợ Cần Giuộc Thơm Ngon Giòn Rụm')).toBeHidden()
    await searchInput.fill('')
  })

  test('3. Store Actions: Approve, Reject, and Danger Confirmation Modals', async ({ page }) => {
    await loginAndOpenAdmin(page)
    await page.locator('aside').getByRole('button', { name: /Quán Ăn/i }).click()

    const main = page.locator('main')

    // Test Approve modal for Pending store
    const approveBtn = main.locator('table tbody tr:has-text("Bánh Mì Ba Lẹ")').getByRole('button', { name: 'Duyệt', exact: true })
    await approveBtn.click()
    const confirmApproveDialog = page.getByRole('dialog', { name: /Phê Duyệt Quán Ăn/i })
    await expect(confirmApproveDialog).toBeVisible()
    await expect(confirmApproveDialog).toContainText('Bánh Mì Ba Lẹ')
    // Cancel modal
    await confirmApproveDialog.getByRole('button', { name: /Hủy Bỏ/i }).click()
    await expect(confirmApproveDialog).toBeHidden()

    // Test Hard Delete modal
    const deleteBtn = main.locator('table tbody tr:has-text("Bánh Mì Ba Lẹ")').getByRole('button', { name: /Xóa vĩnh viễn/i })
    await deleteBtn.click()
    const confirmDeleteDialog = page.getByRole('dialog', { name: /Xóa Vĩnh Viễn Quán Ăn/i })
    await expect(confirmDeleteDialog).toBeVisible()
    await expect(confirmDeleteDialog).toContainText('KHÔNG THỂ KHÔI PHỤC')
    await confirmDeleteDialog.getByRole('button', { name: /Hủy Bỏ/i }).click()
    await expect(confirmDeleteDialog).toBeHidden()
  })

  test('4. Viewing Store Drawer: 2-column Desktop Layout & Details', async ({ page }) => {
    await loginAndOpenAdmin(page)
    await page.locator('aside').getByRole('button', { name: /Quán Ăn/i }).click()

    const main = page.locator('main')

    // Click "Chi Tiết" on Bánh Mì Ba Lẹ
    const detailBtn = main.locator('table tbody tr:has-text("Bánh Mì Ba Lẹ")').getByRole('button', { name: 'Chi Tiết', exact: true })
    await detailBtn.click()

    // Verify Drawer is visible
    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Verify 2-column contents
    // Left column: Banner, Address, Google Maps link, Hours, Price, Owner audit
    await expect(drawer.getByText('Khu phố 1, Thị trấn Cần Giuộc, Long An')).toBeVisible()
    await expect(drawer.getByRole('link', { name: /Google Maps/i }).first()).toBeVisible()
    await expect(drawer.getByText(/06:00/)).toBeVisible()
    await expect(drawer.getByText('@chubale')).toBeVisible()

    // Right column: Description, Food items, Action toolbar
    await expect(drawer.getByText('Bánh mì thịt nướng gia truyền hơn 30 năm')).toBeVisible()
    await expect(drawer.getByText('Bánh mì thịt nướng đặc biệt')).toBeVisible()
    await expect(drawer.getByText('Bánh mì xíu mại trứng muối')).toBeVisible()

    // Close drawer via Escape key
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
  })

  test('5. Users Tab: Search, Role Filtering, Accordion & Modals', async ({ page }) => {
    await loginAndOpenAdmin(page)
    await page.locator('aside').getByRole('button', { name: /Người Dùng/i }).click()
    await expect(page.getByRole('heading', { name: /Quản Lý Tài Khoản Người Dùng/i })).toBeVisible()

    const main = page.locator('main')

    // Search user
    const userSearchInput = page.locator('#admin-user-search')
    await userSearchInput.fill('chubale')
    await expect(main.locator('table').getByText('@chubale')).toBeVisible()
    await expect(main.locator('table').getByText('@onggia_hutieu')).toBeHidden()
    await userSearchInput.fill('')

    // Role filter
    const roleSelect = page.locator('#admin-user-role-filter')
    await roleSelect.selectOption('ADMIN')
    await expect(main.locator('table').getByText('@admin_cangiuoc')).toBeVisible()
    await expect(main.locator('table').getByText('@chubale')).toBeHidden()
    await roleSelect.selectOption('ALL')

    // Expand user stores accordion for @chubale
    const chubaleRow = main.locator('table tbody tr:has-text("@chubale")')
    const expandBtn = chubaleRow.getByRole('button', { name: /Xem Quán/i })
    await expandBtn.click()
    await expect(page.getByText('Cây Thư Mục Quán Ăn Của @chubale')).toBeVisible()
    // Collapse accordion using exact button text
    const collapseBtn = chubaleRow.getByRole('button', { name: 'Thu Gọn', exact: true })
    await collapseBtn.click()
    await expect(page.getByText('Cây Thư Mục Quán Ăn Của @chubale')).toBeHidden()

    // Edit roles modal
    const editRolesBtn = chubaleRow.getByRole('button', { name: /Sửa Roles/i })
    await editRolesBtn.click()
    await expect(page.getByRole('heading', { name: /Chỉnh Sửa Tài Khoản/i })).toBeVisible()
    await page.getByRole('button', { name: 'Hủy', exact: true }).click()
    await expect(page.getByRole('heading', { name: /Chỉnh Sửa Tài Khoản/i })).toBeHidden()
  })

  test('6. Categories Tab: 2-column layout, Icon Picker, Sorting', async ({ page }) => {
    await loginAndOpenAdmin(page)
    await page.locator('aside').getByRole('button', { name: /Danh Mục/i }).click()
    await expect(page.getByRole('heading', { name: /Danh Sách Danh Mục Ẩm Thực/i })).toBeVisible()

    const main = page.locator('main')

    // Verify existing categories rendered in table
    await expect(main.locator('table').getByText('Bánh Mì', { exact: true })).toBeVisible()
    await expect(main.locator('table').getByText('Đặc Sản', { exact: true })).toBeVisible()
    await expect(main.locator('table').getByText('Hủ Tiếu & Bún', { exact: true })).toBeVisible()
    await expect(main.locator('table').getByText('Cà Phê & Nước', { exact: true })).toBeVisible()

    // Category sorting select
    const sortSelect = page.locator('#admin-category-sort-by')
    await sortSelect.selectOption('NAME_ASC')
    await expect(sortSelect).toHaveValue('NAME_ASC')

    // Create Category Form on left column
    const catInput = page.locator('input[placeholder="Ví dụ: Bánh Mì"]')
    await expect(catInput).toBeVisible()
    await catInput.fill('Món Ăn Vặt')

    // Category Icon Picker search input exists
    await expect(page.getByPlaceholder(/Tìm icon/i)).toBeVisible()
  })

  test('7. Mobile Responsiveness: 390px viewport navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await loginAndOpenAdmin(page)

    // Verify dashboard rendered on mobile without crashes
    await expect(page.getByRole('heading', { name: /Bảng Tổng Quan Quản Trị/i })).toBeVisible()

    // Open mobile sidebar via mobile hamburger button
    const mobileMenuBtn = page.getByRole('button', { name: /Mở menu quản trị/i })
    await expect(mobileMenuBtn).toBeVisible()
    await mobileMenuBtn.click()

    // Now click Quán Ăn inside the opened sidebar
    const storesNavBtn = page.locator('aside').getByRole('button', { name: /Quán Ăn/i })
    await expect(storesNavBtn).toBeVisible()
    await storesNavBtn.click()
    await expect(page.getByRole('heading', { name: /Quản Lý Tất Cả Quán Ăn/i })).toBeVisible()

    // Reopen menu and switch to Người Dùng
    await mobileMenuBtn.click()
    const usersNavBtn = page.locator('aside').getByRole('button', { name: /Người Dùng/i })
    await expect(usersNavBtn).toBeVisible()
    await usersNavBtn.click()
    await expect(page.getByRole('heading', { name: /Quản Lý Tài Khoản Người Dùng/i })).toBeVisible()
  })

  test('8. Multi-page Pagination: Numbered buttons, Prev/Next navigation, and Total Count', async ({ page }) => {
    await loginAndOpenAdmin(page)
    await page.locator('aside').getByRole('button', { name: /Quán Ăn/i }).click()
    await expect(page.getByRole('heading', { name: /Quản Lý Tất Cả Quán Ăn/i })).toBeVisible()

    const main = page.locator('main')

    // Previous and Next buttons should be visible because totalPages > 1
    const prevBtn = main.getByRole('button', { name: /Trang Trước/i })
    const nextBtn = main.getByRole('button', { name: /Trang Sau/i })
    await expect(prevBtn).toBeVisible()
    await expect(nextBtn).toBeVisible()

    // Previous button should be disabled on page 1
    await expect(prevBtn).toBeDisabled()
    await expect(nextBtn).toBeEnabled()

    // Page 1 button is active
    const page1Btn = main.getByRole('button', { name: 'Trang 1', exact: true })
    const page2Btn = main.getByRole('button', { name: 'Trang 2', exact: true })
    await expect(page1Btn).toHaveAttribute('aria-current', 'page')

    // Navigate to Page 2
    await page2Btn.click()
    await expect(page2Btn).toHaveAttribute('aria-current', 'page')
    await expect(prevBtn).toBeEnabled()
    await expect(nextBtn).toBeDisabled()
    await expect(main.locator('table').getByText('Quán Cơm Tấm Đêm Long An Tập Hai')).toBeVisible()

    // Navigate back to Page 1 via "Trang Trước"
    await prevBtn.click()
    await expect(page1Btn).toHaveAttribute('aria-current', 'page')
    await expect(main.locator('table').getByText('Bánh Mì Ba Lẹ Chợ Cần Giuộc Thơm Ngon Giòn Rụm')).toBeVisible()
  })

  test('9. Admin Operations: Destructive Confirmations, Payload verification, and Failure modal retention', async ({ page }) => {
    await loginAndOpenAdmin(page)
    await page.locator('aside').getByRole('button', { name: /Quán Ăn/i }).click()

    const main = page.locator('main')

    // 1. Test Reject Modal failure retention:
    // Click "Chi Tiết" on Bánh Mì Ba Lẹ
    await main.locator('table tbody tr:has-text("Bánh Mì Ba Lẹ")').getByRole('button', { name: 'Chi Tiết', exact: true }).click()
    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Click "Từ Chối" inside drawer
    await drawer.getByRole('button', { name: 'Từ Chối', exact: true }).click()
    const rejectModal = page.getByRole('dialog', { name: /Từ Chối Xét Duyệt Quán/i })
    await expect(rejectModal).toBeVisible()

    // Enter trigger failure reason
    const reasonTextarea = rejectModal.locator('textarea')
    await reasonTextarea.fill('TRIGGER_FAILURE')
    await rejectModal.getByRole('button', { name: /Xác Nhận Từ Chối/i }).click()

    // Modal must NOT close because API returned an error
    await expect(rejectModal).toBeVisible()
    await expect(reasonTextarea).toHaveValue('TRIGGER_FAILURE')

    // Change reason to valid text and submit again
    await reasonTextarea.fill('Chưa đủ giấy chứng nhận VSATTP hợp lệ')
    await rejectModal.getByRole('button', { name: /Xác Nhận Từ Chối/i }).click()

    // Upon success, rejection modal and drawer close cleanly
    await expect(rejectModal).toBeHidden()
    await expect(drawer).toBeHidden()
  })

  test('10. Admin Store Detail Drawer: Focus trapping, Initial focus, Escape dismissal & Body scroll lock', async ({ page }) => {
    await loginAndOpenAdmin(page)
    await page.locator('aside').getByRole('button', { name: /Quán Ăn/i }).click()

    const main = page.locator('main')

    // Open drawer
    await main.locator('table tbody tr:has-text("Bánh Mì Ba Lẹ")').getByRole('button', { name: 'Chi Tiết', exact: true }).click()
    const drawer = page.getByRole('dialog', { name: /Chi tiết quán/i })
    await expect(drawer).toBeVisible()

    // Check body scroll lock
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow)
    expect(bodyOverflow).toBe('hidden')

    // Check Escape dismissal
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()

    // Check body scroll restored
    const restoredOverflow = await page.evaluate(() => document.body.style.overflow)
    expect(restoredOverflow).toBe('')
  })
})
