import { test } from '@playwright/test'

const VIEWPORTS = [
  { name: '320x568 (iPhone SE 1st)', width: 320, height: 568 },
  { name: '375x667 (iPhone SE 2nd/8)', width: 375, height: 667 },
  { name: '390x844 (iPhone 12/13/14)', width: 390, height: 844 },
  { name: '430x932 (iPhone 14/15 Pro Max)', width: 430, height: 932 },
  { name: '768x1024 (iPad Portrait)', width: 768, height: 1024 },
  { name: '1024x768 (iPad Landscape)', width: 1024, height: 768 },
  { name: '1280x800 (Laptop)', width: 1280, height: 800 },
  { name: '1440x900 (Desktop)', width: 1440, height: 900 }
]

test.describe('Phase 4A: Responsive Inspection', () => {
  for (const vp of VIEWPORTS) {
    test(`Inspect Explore page at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/explore')
      await page.waitForTimeout(800)

      // 1. Horizontal overflow check
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          hasOverflow: doc.scrollWidth > doc.clientWidth,
          diff: doc.scrollWidth - doc.clientWidth
        }
      })

      // 2. Measure BottomNav and Header on mobile
      const navMetrics = await page.evaluate(() => {
        const header = document.querySelector('header')
        const bottomNav = document.querySelector('nav.fixed.bottom-0')
        const headerRect = header ? header.getBoundingClientRect() : null
        const bottomNavRect = bottomNav ? bottomNav.getBoundingClientRect() : null

        let bottomNavButtons = []
        if (bottomNav) {
          bottomNavButtons = Array.from(bottomNav.querySelectorAll('button')).map(btn => {
            const rect = btn.getBoundingClientRect()
            return {
              text: btn.innerText.trim().replace(/\n/g, ' '),
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              tooSmall: rect.width < 44 || rect.height < 44
            }
          })
        }

        return {
          headerHeight: headerRect ? Math.round(headerRect.height) : 0,
          bottomNavHeight: bottomNavRect ? Math.round(bottomNavRect.height) : 0,
          bottomNavButtons
        }
      }, vp.width)

      // 3. Measure touch targets on mobile (< 768)
      let undersizedButtons = []
      if (vp.width < 768) {
        undersizedButtons = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a[href], input, select'))
          return buttons
            .filter(el => {
              const rect = el.getBoundingClientRect()
              // Visible elements only
              if (rect.width === 0 || rect.height === 0 || el.offsetParent === null) return false
              return rect.width < 38 || rect.height < 38
            })
            .slice(0, 10)
            .map(el => ({
              tag: el.tagName,
              text: (el.innerText || el.getAttribute('aria-label') || el.name || '').slice(0, 30).trim(),
              w: Math.round(el.getBoundingClientRect().width),
              h: Math.round(el.getBoundingClientRect().height)
            }))
        })
      }

      console.log(`[Explore @ ${vp.name}] Overflow: ${overflow.hasOverflow ? `YES (+${overflow.diff}px)` : 'NO'}, BottomNavBtns: ${navMetrics.bottomNavButtons.length}, Undersized: ${undersizedButtons.length}`)

      // Take screenshot
      await page.screenshot({
        path: `e2e/screenshots/phase-4a-audit/explore-${vp.width}x${vp.height}.png`,
        fullPage: false
      })
    })

    test(`Inspect CS2 Spinner at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/cs2-spinner')
      await page.waitForTimeout(800)

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement
        return {
          hasOverflow: doc.scrollWidth > doc.clientWidth,
          diff: doc.scrollWidth - doc.clientWidth
        }
      })

      console.log(`[CS2 @ ${vp.name}] Overflow: ${overflow.hasOverflow ? `YES (+${overflow.diff}px)` : 'NO'}`)

      await page.screenshot({
        path: `e2e/screenshots/phase-4a-audit/cs2-spinner-${vp.width}x${vp.height}.png`,
        fullPage: false
      })
    })

    test(`Inspect About page at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/about')
      await page.waitForTimeout(800)

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement
        return {
          hasOverflow: doc.scrollWidth > doc.clientWidth,
          diff: doc.scrollWidth - doc.clientWidth
        }
      })

      console.log(`[About @ ${vp.name}] Overflow: ${overflow.hasOverflow ? `YES (+${overflow.diff}px)` : 'NO'}`)

      await page.screenshot({
        path: `e2e/screenshots/phase-4a-audit/about-${vp.width}x${vp.height}.png`,
        fullPage: false
      })
    })

    test(`Inspect Saved Stores unauthenticated at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/saved')
      await page.waitForTimeout(800)

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement
        return {
          hasOverflow: doc.scrollWidth > doc.clientWidth,
          diff: doc.scrollWidth - doc.clientWidth
        }
      })

      console.log(`[Saved @ ${vp.name}] Overflow: ${overflow.hasOverflow ? `YES (+${overflow.diff}px)` : 'NO'}`)

      await page.screenshot({
        path: `e2e/screenshots/phase-4a-audit/saved-${vp.width}x${vp.height}.png`,
        fullPage: false
      })
    })

    test(`Inspect Store Detail Drawer at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/explore')
      await page.waitForTimeout(800)

      // Click first store card to open drawer
      const firstCard = page.locator('[data-view-mode="mobile"], [role="button"][aria-label*="Xem chi tiết quán"]').first()
      if (await firstCard.isVisible()) {
        await firstCard.click()
        await page.waitForTimeout(600)

        const drawerMetrics = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"][aria-labelledby="store-detail-title"]')
          if (!dialog) return null
          const rect = dialog.getBoundingClientRect()
          const footer = document.querySelector('#store-detail-footer')
          const footerRect = footer ? footer.getBoundingClientRect() : null
          return {
            dialogW: Math.round(rect.width),
            dialogH: Math.round(rect.height),
            windowH: window.innerHeight,
            footerH: footerRect ? Math.round(footerRect.height) : 0,
            isDrawerScrollable: dialog.scrollHeight > dialog.clientHeight
          }
        })

        console.log(`[Drawer @ ${vp.name}] Metrics:`, drawerMetrics)

        await page.screenshot({
          path: `e2e/screenshots/phase-4a-audit/drawer-${vp.width}x${vp.height}.png`,
          fullPage: false
        })

        // Close drawer
        await page.keyboard.press('Escape')
      }
    })

    test(`Inspect Auth Modal at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/explore')
      await page.waitForTimeout(600)

      // Open Login Modal
      const loginBtn = page.getByRole('button', { name: /Đăng Nhập/i }).first()
      if (await loginBtn.isVisible()) {
        await loginBtn.click()
        await page.waitForTimeout(500)

        const modalMetrics = await page.evaluate(() => {
          const dialog = document.querySelector('[role="dialog"]')
          if (!dialog) return null
          const rect = dialog.getBoundingClientRect()
          return {
            w: Math.round(rect.width),
            h: Math.round(rect.height),
            windowH: window.innerHeight,
            windowW: window.innerWidth,
            isOffscreen: rect.top < 0 || rect.bottom > window.innerHeight
          }
        })

        console.log(`[AuthModal @ ${vp.name}] Metrics:`, modalMetrics)

        await page.screenshot({
          path: `e2e/screenshots/phase-4a-audit/auth-login-${vp.width}x${vp.height}.png`,
          fullPage: false
        })

        // Switch to Register Mode
        const regTab = page.getByRole('button', { name: /Tạo tài khoản mới|Đăng ký/i }).first()
        if (await regTab.isVisible()) {
          await regTab.click()
          await page.waitForTimeout(400)
          await page.screenshot({
            path: `e2e/screenshots/phase-4a-audit/auth-register-${vp.width}x${vp.height}.png`,
            fullPage: false
          })
        }

        await page.keyboard.press('Escape')
      }
    })
  }
})
