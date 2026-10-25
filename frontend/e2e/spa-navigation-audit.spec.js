import { test, expect } from '@playwright/test'

const MOCK_CATEGORIES = [
  { id: 1, name: 'Cơm Tấm', icon: 'Utensils' },
  { id: 2, name: 'Bún & Phở', icon: 'Soup' },
  { id: 3, name: 'Bánh Mì', icon: 'Sandwich' },
  { id: 4, name: 'Trà Sữa & Cà Phê', icon: 'Coffee' }
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
  }
]

test.describe('Batch 3G-A: SPA Navigation Continuity & Loading Architecture Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/v1/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: MOCK_CATEGORIES })
      })
    })

    await page.route('**/v1/stores**', async (route) => {
      const url = route.request().url()
      if (url.includes('/101')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 1000, result: MOCK_STORES[0] })
        })
        return
      }
      if (url.includes('/saved')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 1000, result: [MOCK_STORES[1]] })
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

    await page.route('**/v1/stores/facets**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: {} })
      })
    })
  })

  test('Audit 1: Tab switching Explore -> Saved -> About -> Explore has 0 document reloads', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForSelector('header')

    // Inject unique window marker
    await page.evaluate(() => {
      window.__spaNavigationMarker = 'CGFT_SPA_SESSION_ACTIVE'
    })

    // Navigate to Saved
    await page.getByRole('button', { name: /Quán Đã Lưu/i }).click()
    await expect(page).toHaveURL(/.*saved/)
    const marker1 = await page.evaluate(() => window.__spaNavigationMarker)
    expect(marker1).toBe('CGFT_SPA_SESSION_ACTIVE')

    // Navigate to About
    await page.getByRole('button', { name: /Về Chúng Tôi/i }).click()
    await expect(page).toHaveURL(/.*about/)
    const marker2 = await page.evaluate(() => window.__spaNavigationMarker)
    expect(marker2).toBe('CGFT_SPA_SESSION_ACTIVE')

    // Navigate back to Explore
    await page.getByRole('button', { name: /Khám Phá Ẩm Thực/i }).click()
    await expect(page).toHaveURL(/.*explore/)
    const marker3 = await page.evaluate(() => window.__spaNavigationMarker)
    expect(marker3).toBe('CGFT_SPA_SESSION_ACTIVE')
  })

  test('Audit 2: Header DOM node identity during non-admin tab switching', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForSelector('header')

    // Tag the header DOM element directly
    await page.evaluate(() => {
      const header = document.querySelector('header')
      if (header) header.__headerMarker = 'HEADER_NODE_PERSISTENT'
    })

    // Switch to About
    await page.getByRole('button', { name: /Về Chúng Tôi/i }).click()
    await expect(page).toHaveURL(/.*about/)

    // Verify header DOM node was NOT remounted or recreated
    const headerTagAfterAbout = await page.evaluate(() => {
      const header = document.querySelector('header')
      return header ? header.__headerMarker : null
    })
    expect(headerTagAfterAbout).toBe('HEADER_NODE_PERSISTENT')

    // Switch to Saved
    await page.getByRole('button', { name: /Quán Đã Lưu/i }).click()
    await expect(page).toHaveURL(/.*saved/)

    const headerTagAfterSaved = await page.evaluate(() => {
      const header = document.querySelector('header')
      return header ? header.__headerMarker : null
    })
    expect(headerTagAfterSaved).toBe('HEADER_NODE_PERSISTENT')
  })

  test('Audit 3: Detect global backdrop spinner appearance on tab change', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForSelector('header')

    // Listen for DOM additions of the global spinner backdrop
    const spinnerEvents = []
    await page.exposeFunction('onSpinnerDetected', (text) => {
      spinnerEvents.push(text)
    })

    await page.evaluate(() => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) {
              if (node.classList?.contains('fixed') && node.classList?.contains('z-50') && node.classList?.contains('backdrop-blur-sm')) {
                window.onSpinnerDetected('GLOBAL_BACKDROP_SPINNER_RENDERED')
              }
            }
          }
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
    })

    // Click About tab
    await page.getByRole('button', { name: /Về Chúng Tôi/i }).click()
    await page.waitForTimeout(500)

    console.log('Global spinner events during About switch:', spinnerEvents)
  })

  test('Audit 4: Slow network on Explore reveals whether StoreCard skeleton exists', async ({ page }) => {
    // Artificial 600ms delay on public stores
    await page.route('**/v1/stores?**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600))
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

    await page.goto('/explore')

    // While request is in flight (at 200ms), check if a skeleton exists or empty state is shown
    await page.waitForTimeout(200)

    const skeletonCount = await page.locator('.brutalist-skeleton').count()
    const emptyStateText = await page.locator('text=Không tìm thấy quán ăn phù hợp').count()

    console.log(`Explore loading state audit: Skeletons found = ${skeletonCount}, Premature Empty State found = ${emptyStateText}`)
  })

  test('Audit 6: Slow network on Saved Stores reveals whether skeleton is passed or empty state is shown', async ({ page }) => {
    // Delay saved stores by 600ms
    await page.route('**/v1/stores/saved**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: [MOCK_STORES[1]] })
      })
    })

    // Mock authenticated user profile
    await page.route('**/users/me**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { id: 1, username: 'foodie_test', email: 'test@cgft.vn', roles: ['USER'] }
        })
      })
    })

    await page.goto('/saved')

    // At 200ms while request in flight: check if skeleton is rendered or premature empty state
    await page.waitForTimeout(200)

    const skeletonCount = await page.locator('.brutalist-skeleton').count()
    const emptyStateCount = await page.locator('text=Chưa Có Quán Nào Được Lưu').count()
    console.log(`Saved Stores loading state audit: Skeletons = ${skeletonCount}, Premature Empty State = ${emptyStateCount}`)
  })

  test('Audit 7: Direct navigation to Store Detail URL with slow network', async ({ page }) => {
    await page.route('**/v1/stores/101**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: MOCK_STORES[0] })
      })
    })

    await page.goto('/quan/quan-com-tam-dem-can-giuoc/101')

    // While fetching at 200ms: check if drawer dialog exists in DOM
    await page.waitForTimeout(200)

    const drawerVisible = await page.locator('aside[role="dialog"]').count()
    const detailSkeleton = await page.locator('.brutalist-skeleton').count()

    console.log(`StoreDetail direct load audit: Drawer rendered = ${drawerVisible}, Skeletons = ${detailSkeleton}`)
  })

  test('Audit 8: Logout state cleanup audit in memory', async ({ page }) => {
    await page.route('**/users/me**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 1000,
          result: { id: 1, username: 'foodie_test', firstname: 'Van', lastname: 'Nguyen', roles: ['USER'] }
        })
      })
    })
    await page.route('**/auth/logout**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 1000 }) })
    })

    await page.goto('/explore')
    await page.waitForTimeout(300)

    // Trigger logout
    const avatarBtn = page.locator('header button:has(img[alt=""])').first()
    if (await avatarBtn.isVisible()) {
      await avatarBtn.click()
      const logoutBtn = page.getByRole('button', { name: /Đăng Xuất/i })
      if (await logoutBtn.isVisible()) {
        await logoutBtn.click()
        await page.waitForTimeout(300)
      }
    }
  })
})
