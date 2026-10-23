import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-320', width: 320, height: 568 }
]

const BASELINE_DIR = path.resolve(process.cwd(), 'e2e/visual-baselines')

// Ensure baseline directory exists
if (!fs.existsSync(BASELINE_DIR)) {
  fs.mkdirSync(BASELINE_DIR, { recursive: true })
}

/**
 * Standardize page styles to eliminate font loading and animation jitter
 */
async function stabilizeForVisualCapture(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }
    `
  })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(100)
}

test.describe('Batch 2D-1 — Visual Regression Baseline Captures', () => {
  for (const vp of VIEWPORTS) {
    test(`Capture Visual Baseline: Primitives Harness (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/harness.html')
      await stabilizeForVisualCapture(page)

      const harnessMain = page.locator('#root > div')
      await expect(harnessMain).toBeVisible()

      // Save baseline snapshot file for review
      const filePath = path.join(BASELINE_DIR, `primitives-harness-${vp.name}.png`)
      await harnessMain.screenshot({ path: filePath })
      expect(fs.existsSync(filePath)).toBe(true)

      // Automated visual comparison contract with tolerance
      await expect(harnessMain).toHaveScreenshot(`harness-${vp.name}.png`, {
        maxDiffPixelRatio: 0.03,
        threshold: 0.2
      })
    })

    test(`Capture Visual Baseline: ConfirmActionModal (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/harness.html')
      await stabilizeForVisualCapture(page)

      const triggerBtn = page.locator('#open-confirm-modal-trigger')
      await triggerBtn.click()

      const alertDialog = page.getByRole('alertdialog')
      await expect(alertDialog).toBeVisible()
      await stabilizeForVisualCapture(page)

      const filePath = path.join(BASELINE_DIR, `confirm-action-modal-${vp.name}.png`)
      await alertDialog.screenshot({ path: filePath })
      expect(fs.existsSync(filePath)).toBe(true)

      await expect(alertDialog).toHaveScreenshot(`confirm-modal-${vp.name}.png`, {
        maxDiffPixelRatio: 0.03,
        threshold: 0.2
      })
    })

    test(`Capture Visual Baseline: Explore Search Bar (${vp.name})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/explore')
      await page.locator('#root > div, main').first().waitFor({ state: 'visible', timeout: 15000 })
      await stabilizeForVisualCapture(page)

      const searchInput = page.getByRole('textbox', { name: 'Tìm kiếm món ăn, quán ăn, tên đường tại Cần Giuộc' })
      await expect(searchInput).toBeVisible()

      // Parent container of the search bar
      const searchContainer = searchInput.locator('xpath=./ancestor::div[contains(@class, "brutalist-card") or contains(@class, "bg-white")][1]')
      const targetElement = (await searchContainer.count()) > 0 ? searchContainer : searchInput

      const filePath = path.join(BASELINE_DIR, `explore-search-bar-${vp.name}.png`)
      await targetElement.screenshot({ path: filePath })
      expect(fs.existsSync(filePath)).toBe(true)

      await expect(targetElement).toHaveScreenshot(`explore-search-${vp.name}.png`, {
        maxDiffPixelRatio: 0.03,
        threshold: 0.2
      })
    })
  }
})
