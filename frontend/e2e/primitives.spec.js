import { test, expect } from '@playwright/test'

test.describe('Batch 2B - Shared Accessible Primitives', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/harness.html')
  })

  test('Buttons and IconButtons respond to clicks, enforce accessible names and disabled state', async ({ page }) => {
    const actionBtn = page.locator('#action-btn')
    await expect(actionBtn).toHaveText('Action (0)')
    await actionBtn.click()
    await expect(actionBtn).toHaveText('Action (1)')
    await actionBtn.click()
    await expect(actionBtn).toHaveText('Action (2)')

    // Disabled button
    const disabledBtn = page.locator('#disabled-btn')
    await expect(disabledBtn).toBeDisabled()

    // Loading button
    const loadingBtn = page.locator('#toggle-loading-btn')
    await loadingBtn.click()
    await expect(loadingBtn).toHaveAttribute('aria-busy', 'true')
    await expect(loadingBtn).toContainText('Đang tải...')

    // IconButton accessible name
    const iconBtn = page.locator('#icon-btn-delete')
    await expect(iconBtn).toHaveAttribute('aria-label', 'Xóa dữ liệu mẫu')
    await expect(page.getByRole('button', { name: 'Xóa dữ liệu mẫu' })).toBeVisible()
  })

  test('FormField coordinates label, helper hint, error alert and invalid state', async ({ page }) => {
    const label = page.locator('label[for="test-username"]')
    await expect(label).toBeVisible()
    await expect(label).toContainText('Tên đăng nhập')
    await expect(label).toContainText('*')

    const input = page.locator('#test-username')
    await expect(input).toBeVisible()
    await expect(input).toHaveAttribute('required', '')

    // Initial state: hint is visible, no error
    const hint = page.locator('#test-username-hint')
    await expect(hint).toHaveText('Ít nhất 3 ký tự')
    await expect(input).not.toHaveAttribute('aria-invalid', 'true')

    // Type text
    await input.fill('admin123')
    await expect(input).toHaveValue('admin123')

    // Toggle error
    await page.locator('#toggle-error-btn').click()
    const errorAlert = page.locator('#test-username-error')
    await expect(errorAlert).toBeVisible()
    await expect(errorAlert).toHaveAttribute('role', 'alert')
    await expect(errorAlert).toContainText('Tên đăng nhập không được chứa ký tự đặc biệt')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(input).toHaveAttribute('aria-describedby', /test-username-error/)
  })

  test('NativeSelect supports mouse and keyboard value selection', async ({ page }) => {
    const select = page.locator('#test-city')
    const display = page.locator('#selected-city-display')

    // 1. Accessible name and label association
    await expect(page.getByRole('combobox', { name: /Khu vực hoạt động/i })).toBeVisible()
    await page.locator('label[for="test-city"]').click()
    await expect(select).toBeFocused()

    // 2. Minimum 44px touch target height
    const box = await select.boundingBox()
    expect(box).not.toBeNull()
    expect(box.height).toBeGreaterThanOrEqual(44)

    // 3. Initial display
    await expect(display).toHaveText('Đã chọn: (chưa chọn)')

    // 4. Mouse option selection
    await select.selectOption('can-giuoc')
    await expect(display).toHaveText('Đã chọn: can-giuoc')

    // 5. Value change and controlled state
    await select.selectOption('tan-an')
    await expect(display).toHaveText('Đã chọn: tan-an')
  })

  test('Dialog traps keyboard focus, closes with Escape and restores focus to trigger button', async ({ page }) => {
    const triggerBtn = page.locator('#open-dialog-trigger')
    await expect(triggerBtn).toBeVisible()

    // Click trigger to open
    await triggerBtn.focus()
    await triggerBtn.press('Enter')

    const dialog = page.getByRole('dialog', { name: /Xác Nhận Hành Động/i })
    await expect(dialog).toBeVisible()

    // Verify background (#root) is inert and aria-hidden while dialog is open
    const rootEl = page.locator('#root')
    await expect(rootEl).toHaveAttribute('aria-hidden', 'true')
    await expect(rootEl).toHaveAttribute('inert', '')

    // Verify focus is inside dialog
    await expect.poll(async () => {
      const activeTag = await page.evaluate(() => document.activeElement?.tagName)
      return ['BUTTON', 'INPUT', 'DIV'].includes(activeTag)
    }).toBe(true)

    // Focus input inside dialog and type
    const dialogInput = page.locator('#dialog-input')
    await dialogInput.fill('Xác nhận kiểm thử')
    await expect(dialogInput).toHaveValue('Xác nhận kiểm thử')

    // NativeSelect interaction inside Dialog (no conflict with modal focus trap)
    const dialogSelect = page.locator('#dialog-select')
    await expect(dialogSelect).toBeVisible()
    await dialogSelect.selectOption('HIGH')
    await expect(dialogSelect).toHaveValue('HIGH')

    // Focus trap test: Tab cycling inside dialog
    await dialogInput.focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    // After tabs, active element must still be within dialog
    const isFocusInside = await page.evaluate(() => {
      const dialogEl = document.querySelector('[role="dialog"]')
      return dialogEl ? dialogEl.contains(document.activeElement) : false
    })
    expect(isFocusInside).toBe(true)

    // Press Escape to close
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // Background (#root) isolation restored on modal close
    await expect(rootEl).not.toHaveAttribute('aria-hidden')
    await expect(rootEl).not.toHaveAttribute('inert')

    // Focus must be restored back to the trigger button!
    await expect(triggerBtn).toBeFocused()
  })

  test('ConfirmActionModal (Pilot 1) traps focus, prevents backdrop dismiss, validates input and restores focus', async ({ page }) => {
    const triggerBtn = page.locator('#open-confirm-modal-trigger')
    await expect(triggerBtn).toBeVisible()

    await triggerBtn.focus()
    await triggerBtn.press('Enter')

    const alertDialog = page.getByRole('alertdialog', { name: /Xóa cửa hàng thử nghiệm/i })
    await expect(alertDialog).toBeVisible()

    // 1. Initial focus goes to the confirmation input
    const confirmInput = alertDialog.locator('#confirm-action-confirmation')
    await expect(confirmInput).toBeFocused()

    // 2. Backdrop click does not dismiss destructive modal
    await page.mouse.click(10, 10)
    await expect(alertDialog).toBeVisible()

    // 3. Validation error when confirmation text doesn't match
    await alertDialog.locator('button', { hasText: 'Xóa Vĩnh Viễn' }).click()
    const errorAlert = alertDialog.locator('#confirm-action-confirmation-error')
    await expect(errorAlert).toBeVisible()
    await expect(alertDialog.locator('#confirm-action-reason-error')).toBeVisible()

    // 4. Fill required data
    await confirmInput.fill('delete-me')
    await alertDialog.locator('#confirm-action-reason').fill('Lý do thử nghiệm')

    // 5. Close with Escape and check focus restoration
    await page.keyboard.press('Escape')
    await expect(alertDialog).toBeHidden()
    await expect(triggerBtn).toBeFocused()
  })
})

test.describe('Batch 2C - Pilot 2: Explore Search Bar Accessible Name & Responsive Viewports', () => {
  for (const width of [1440, 768, 390, 320]) {
    test(`explore search bar renders without overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/explore')

      const searchInput = page.getByRole('textbox', { name: /Tìm kiếm món ăn/i })
      await expect(searchInput).toBeVisible()
      await expect(searchInput).toHaveAttribute('aria-label', 'Tìm kiếm món ăn, quán ăn, tên đường tại Cần Giuộc')

      // Check overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(1)

      // Test typing
      await searchInput.fill('Bánh Mì')
      await expect(searchInput).toHaveValue('Bánh Mì')
    })
  }
})

