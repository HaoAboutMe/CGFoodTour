import { test, expect } from '@playwright/test'

const MOCK_CATEGORIES = [
  { id: 1, name: 'Cơm Tấm', icon: 'Utensils' },
  { id: 2, name: 'Bún & Phở', icon: 'Soup' },
  { id: 3, name: 'Bánh Mì', icon: 'Sandwich' },
  { id: 4, name: 'Trà Sữa & Cà Phê', icon: 'Coffee' },
  { id: 5, name: 'Ăn Vặt', icon: 'Cookie' },
  { id: 6, name: 'Hải Sản', icon: 'Fish' },
  { id: 7, name: 'Lẩu & Nướng', icon: 'Flame' },
  { id: 8, name: 'Chè & Tráng Miệng', icon: 'IceCream' }
]

const MOCK_STORES = [
  {
    id: 101,
    name: 'Quán Cơm Tấm Đêm Cần Giuộc',
    slug: 'quan-com-tam-dem-can-giuoc',
    status: 'APPROVED',
    categoryName: 'Cơm Tấm',
    categoryId: 1,
    addressLine: '123 QL50, TT. Cần Giuộc, Long An',
    openTime: '17:00',
    closeTime: '23:30',
    priceMin: 35000,
    priceMax: 65000,
    satisfactionRate: 98,
    totalVotes: 142,
    distanceKm: 0.8,
    isSaved: false,
    savedCount: 24,
    bannerImageUrl: ''
  },
  {
    id: 102,
    name: 'Phở Bò Gia Truyền Cần Giuộc',
    slug: 'pho-bo-gia-truyen-can-giuoc',
    status: 'APPROVED',
    categoryName: 'Bún & Phở',
    categoryId: 2,
    addressLine: '45 Đường Tránh Cần Giuộc, Long An',
    openTime: '06:00',
    closeTime: '21:00',
    priceMin: 40000,
    priceMax: 70000,
    satisfactionRate: 95,
    totalVotes: 89,
    distanceKm: 1.2,
    isSaved: true,
    savedCount: 42,
    bannerImageUrl: ''
  },
  {
    id: 103,
    name: 'Bánh Mì Ba Lẹ Giòn Rụm',
    slug: 'banh-mi-ba-le-gion-rum',
    status: 'APPROVED',
    categoryName: 'Bánh Mì',
    categoryId: 3,
    addressLine: '78 Lãnh Binh Thái, TT. Cần Giuộc',
    openTime: '05:30',
    closeTime: '11:00',
    priceMin: 20000,
    priceMax: 35000,
    satisfactionRate: 92,
    totalVotes: 65,
    distanceKm: 2.1,
    isSaved: false,
    savedCount: 15,
    bannerImageUrl: ''
  }
]

test.describe('Batch 3B - Explore Page Desktop & Responsive Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept v1 endpoints
    await page.route('**/v1/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: MOCK_CATEGORIES
        })
      })
    })

    await page.route('**/v1/stores**', async (route) => {
      const url = route.request().url()
      // Store detail by ID
      if (url.includes('/101') || url.includes('/102') || url.includes('/103')) {
        const storeId = url.includes('/101') ? 101 : url.includes('/102') ? 102 : 103
        const found = MOCK_STORES.find((s) => s.id === storeId)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 1000,
            result: found
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
            content: MOCK_STORES,
            totalElements: MOCK_STORES.length,
            totalPages: 1,
            last: true
          }
        })
      })
    })
  })

  test('1. Search bar and Desktop Category NativeSelect render side-by-side on 1440px', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const searchInput = page.getByRole('textbox', { name: /Tìm kiếm món ăn/i })
    await expect(searchInput).toBeVisible()

    const categorySelect = page.getByRole('combobox', { name: /Lọc theo danh mục món ăn/i })
    await expect(categorySelect).toBeVisible()

    // Test typing in search bar
    await searchInput.fill('Cơm Tấm')
    await expect(searchInput).toHaveValue('Cơm Tấm')

    // Clear filter button appears when search query is active
    const clearFilterBtn = page.getByRole('button', { name: /Xóa tất cả các bộ lọc hiện tại/i })
    await expect(clearFilterBtn).toBeVisible()
    await clearFilterBtn.click()
    await expect(searchInput).toHaveValue('')
  })

  test('2. Desktop Category NativeSelect updates selection', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const categorySelect = page.getByRole('combobox', { name: /Lọc theo danh mục món ăn/i })
    await expect(categorySelect).toBeVisible()

    // Select category id '2' (Bún & Phở)
    await categorySelect.selectOption('2')
    await expect(categorySelect).toHaveValue('2')

    // Clear filters button should be visible
    const clearBtn = page.getByRole('button', { name: /Xóa tất cả các bộ lọc hiện tại/i })
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()
    await expect(categorySelect).toHaveValue('')
  })

  test('3. Desktop Category Pills cluster allows clicking to filter', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    // Find Cơm Tấm pill in desktop wrapped row
    const comTamBtn = page.locator('div.hidden.md\\:flex button').filter({ hasText: 'Cơm Tấm' }).first()
    await expect(comTamBtn).toBeVisible()
    await comTamBtn.click()

    // Header shows active category
    await expect(page.locator('h2')).toContainText('Cơm Tấm')

    // Click "Tất Cả Món" pill to reset
    const allBtn = page.locator('div.hidden.md\\:flex button').filter({ hasText: 'Tất Cả Món' }).first()
    await allBtn.click()
    await expect(page.locator('h2')).toContainText('Quán Ăn Nổi Bật')
  })

  test('4. View Mode Switcher toggles between Grid and Compact List on Desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    // Initially grid card is visible
    const gridCard = page.locator('[data-view-mode="grid"]').first()
    await expect(gridCard).toBeVisible()

    // Switch to Compact List
    const compactBtn = page.getByRole('button', { name: /Danh Sách/i }).first()
    await expect(compactBtn).toBeVisible()
    await compactBtn.click()

    // Verify compact card is mounted and visible
    const compactCard = page.locator('[data-view-mode="compact"]').first()
    await expect(compactCard).toBeVisible()

    // Switch back to Grid
    const gridBtn = page.getByRole('button', { name: /Lưới Quán/i }).first()
    await gridBtn.click()
    await expect(page.locator('[data-view-mode="grid"]').first()).toBeVisible()
  })

  test('5. Clicking a desktop StoreCard opens StoreDetailDrawer and Escape closes it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const storeCard = page.locator('[data-view-mode="grid"]').first()
    await expect(storeCard).toBeVisible()
    await storeCard.click()

    // Drawer opens
    const drawer = page.locator('div[role="dialog"]')
    await expect(drawer).toBeVisible({ timeout: 5000 })

    // Close with Escape
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden({ timeout: 5000 })
  })

  test('6. Fast Chips: Gần Tôi and Đang Mở Cửa toggle states properly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const openNowBtn = page.getByRole('button', { name: /Lọc quán đang mở cửa/i })
    await expect(openNowBtn).toBeVisible()
    await expect(openNowBtn).toHaveAttribute('aria-pressed', 'false')

    await openNowBtn.click()
    await expect(openNowBtn).toHaveAttribute('aria-pressed', 'true')

    // Clear filter resets it
    const clearBtn = page.getByRole('button', { name: /Xóa tất cả các bộ lọc hiện tại/i })
    await clearBtn.click()
    await expect(openNowBtn).toHaveAttribute('aria-pressed', 'false')
  })

  for (const width of [1920, 1440, 1280, 768, 390, 320]) {
    test(`7. Responsive layout check without horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/explore')

      // Check overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(1)

      // Search input is always visible
      const searchInput = page.getByRole('textbox', { name: /Tìm kiếm món ăn/i })
      await expect(searchInput).toBeVisible()
    })
  }

  test('8. Dynamic viewport resize cycle (Desktop -> Tablet -> Mobile -> Desktop) preserves cards without loss or duplication', async ({ page }) => {
    // 1. Start at Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/explore')

    const desktopCards1440 = page.locator('[data-view-mode="grid"]')
    await expect(desktopCards1440).toHaveCount(3)
    await expect(desktopCards1440.first()).toBeVisible()
    // Mobile cards are hidden
    const mobileCards1440 = page.locator('[data-view-mode="mobile"]')
    await expect(mobileCards1440.first()).toBeHidden()

    // 2. Resize to Tablet 768px
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(200)
    await expect(desktopCards1440).toHaveCount(3)
    await expect(desktopCards1440.first()).toBeVisible()
    await expect(mobileCards1440.first()).toBeHidden()

    // 3. Resize to Mobile 390px
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(200)
    await expect(mobileCards1440).toHaveCount(3)
    await expect(mobileCards1440.first()).toBeVisible()
    await expect(desktopCards1440.first()).toBeHidden()

    // 4. Resize to Mobile 320px
    await page.setViewportSize({ width: 320, height: 568 })
    await page.waitForTimeout(200)
    await expect(mobileCards1440).toHaveCount(3)
    await expect(mobileCards1440.first()).toBeVisible()
    await expect(desktopCards1440.first()).toBeHidden()

    // 5. Resize back to Desktop 1440px
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(200)
    await expect(desktopCards1440).toHaveCount(3)
    await expect(desktopCards1440.first()).toBeVisible()
    await expect(mobileCards1440.first()).toBeHidden()

    // 6. Test Bookmark interaction on restored desktop card
    const firstBookmark = desktopCards1440.first().locator('button[title*="Lưu quán"]')
    await expect(firstBookmark).toBeVisible()
    await firstBookmark.click()
    // Bookmark button toggles successfully without throwing
    await expect(desktopCards1440.first()).toBeVisible()
  })
})
