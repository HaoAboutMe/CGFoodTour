import { test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const OUT_DIR = path.resolve(process.cwd(), 'e2e/screenshots/after-batch-3b')
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

const VIEWPORTS = [
  { name: 'desktop-1920x1080', width: 1920, height: 1080 },
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'desktop-1280x800', width: 1280, height: 800 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'mobile-390x844', width: 390, height: 844 },
  { name: 'mobile-320x568', width: 320, height: 568 }
]

test.describe('Capture After Screenshots for Explore Page Batch 3B', () => {
  for (const vp of VIEWPORTS) {
    test(`Capture Explore After ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/explore')
      await page.locator('#root > div, main').first().waitFor({ state: 'visible', timeout: 15000 })
      await page.waitForTimeout(500)

      const screenshotPath = path.join(OUT_DIR, `explore-${vp.name}.png`)
      await page.screenshot({ path: screenshotPath, fullPage: false })
      console.log(`Captured: ${screenshotPath}`)
    })
  }
})
