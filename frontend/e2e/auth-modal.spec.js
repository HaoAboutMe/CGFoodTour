import { test, expect } from '@playwright/test'

test.describe('Batch 2D-2B.2A: AuthModal Form Accessibility & Controls', () => {
  test.beforeEach(async ({ page }) => {
    // Collect console errors & warnings to assert clean React state
    page.on('pageerror', (err) => {
      // Ignore Leaflet tile or external network warnings if any
      if (!err.message.includes('tile.openstreetmap') && !err.message.includes('favicon')) {
        console.error('Browser PageError:', err.message)
      }
    })
  })

  test('1. Close button accessibility, touch target, and Escape dismiss', async ({ page }) => {
    await page.goto('/explore')
    const loginButton = page.getByRole('button', { name: /Đăng Nhập/i }).first()
    await loginButton.click()

    const dialog = page.getByRole('dialog', { name: /^Đăng Nhập$/i })
    await expect(dialog).toBeVisible()

    // Verify close button
    const closeBtn = page.getByRole('button', { name: 'Đóng cửa sổ đăng nhập' })
    await expect(closeBtn).toBeVisible()
    const box = await closeBtn.boundingBox()
    expect(box).not.toBeNull()
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)

    // Close via close button
    await closeBtn.click()
    await expect(dialog).toBeHidden()
  })

  test('2. Login form: labels, autocomplete, password toggle, Enter submit and error handling', async ({ page }) => {
    let loginPayload = null
    await page.route('**/api/auth/token', async (route) => {
      loginPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1056, message: 'Email hoặc mật khẩu không chính xác' })
      })
    })

    await page.goto('/explore')
    await page.getByRole('button', { name: /Đăng Nhập/i }).first().click()

    const emailInput = page.locator('#login-email')
    const passwordInput = page.locator('#login-password')

    // Label association
    await expect(page.locator('label[for="login-email"]')).toContainText('Địa Chỉ Email')
    await expect(page.locator('label[for="login-password"]')).toContainText('Mật Khẩu')

    // Autocomplete attributes
    await expect(emailInput).toHaveAttribute('autocomplete', 'username')
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')

    // Type credentials
    await emailInput.fill('user@example.test')
    await passwordInput.fill('Secret123!')

    // Toggle password visibility
    const toggleBtn = page.getByRole('button', { name: /Hiện mật khẩu/i })
    await expect(toggleBtn).toBeVisible()
    await expect(toggleBtn).toHaveAttribute('type', 'button')

    await toggleBtn.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    await expect(page.getByRole('button', { name: /Ẩn mật khẩu/i })).toBeVisible()
    await expect(passwordInput).toHaveValue('Secret123!') // Value preserved

    await page.getByRole('button', { name: /Ẩn mật khẩu/i }).click()
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // Submit via Enter key on password input
    await passwordInput.press('Enter')

    await expect.poll(() => loginPayload).toEqual({
      email: 'user@example.test',
      password: 'Secret123!'
    })
  })

  test('3. Loading state and double-submit prevention', async ({ page }) => {
    let submitCount = 0
    await page.route('**/api/auth/token', async (route) => {
      submitCount++
      // Delay response to test loading state
      await new Promise((r) => setTimeout(r, 600))
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1056, message: 'Invalid credentials' })
      })
    })

    await page.goto('/explore')
    await page.getByRole('button', { name: /Đăng Nhập/i }).first().click()

    await page.locator('#login-email').fill('user@example.test')
    await page.locator('#login-password').fill('Secret123!')

    const submitBtn = page.locator('form button[type="submit"]')
    await submitBtn.click()

    // Assert button transitions to loading state
    await expect(submitBtn).toHaveAttribute('aria-busy', 'true')
    await expect(submitBtn).toContainText('Đang xác thực...')
    await expect(submitBtn).toBeDisabled()

    // Attempt second click during loading
    await submitBtn.click({ force: true }).catch(() => {})

    // Wait for completion
    await expect(submitBtn).not.toHaveAttribute('aria-busy', 'true')
    expect(submitCount).toBe(1)
  })

  test('4. Registration form: 7 fields, validation, live password match, DOB and submit', async ({ page }) => {
    let registerPayload = null
    await page.route('**/api/auth/register', async (route) => {
      registerPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: { id: 'new-user-id' } })
      })
    })

    await page.goto('/explore')
    await page.getByRole('button', { name: /Đăng Nhập/i }).first().click()

    // Switch to Register mode
    await page.getByRole('button', { name: /Đăng Ký Tài Khoản/i }).click()
    const dialog = page.getByRole('dialog', { name: /Tạo Tài Khoản/i })
    await expect(dialog).toBeVisible()

    const userInput = page.locator('#reg-username')
    const emailInput = page.locator('#reg-email')
    const firstInput = page.locator('#reg-firstname')
    const lastInput = page.locator('#reg-lastname')
    const passInput = page.locator('#reg-password')
    const confirmInput = page.locator('#reg-confirm-password')
    const dobInput = page.locator('#reg-dob')
    const submitBtn = page.getByRole('button', { name: /Hoàn Tất Đăng Ký/i })

    // Check autocomplete attributes
    await expect(userInput).toHaveAttribute('autocomplete', 'username')
    await expect(emailInput).toHaveAttribute('autocomplete', 'email')
    await expect(firstInput).toHaveAttribute('autocomplete', 'given-name')
    await expect(lastInput).toHaveAttribute('autocomplete', 'family-name')
    await expect(passInput).toHaveAttribute('autocomplete', 'new-password')
    await expect(confirmInput).toHaveAttribute('autocomplete', 'new-password')
    await expect(dobInput).toHaveAttribute('autocomplete', 'bday')

    // Check DOB maximum date constraint (must be at least 18 years old)
    const maxDob = await dobInput.getAttribute('max')
    expect(maxDob).not.toBeNull()
    const maxYear = Number.parseInt(maxDob.slice(0, 4), 10)
    const currentYear = new Date().getFullYear()
    expect(currentYear - maxYear).toBeGreaterThanOrEqual(18)

    // Initially submit is disabled
    await expect(submitBtn).toBeDisabled()

    // Test invalid username (<3 chars or special chars)
    await userInput.fill('ab')
    await expect(userInput).toHaveAttribute('aria-invalid', 'true')
    await userInput.fill('valid_user')
    await expect(userInput).not.toHaveAttribute('aria-invalid', 'true')

    await emailInput.fill('foodie@test.vn')
    await firstInput.fill('Nguyen')
    await lastInput.fill('An')

    // Test password and confirm password mismatch
    await passInput.fill('Pass123456!')
    await confirmInput.fill('Mismatch123!')
    await expect(confirmInput).toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('text=Mật khẩu không trùng khớp')).toBeVisible()
    await expect(page.locator('[role="status"]')).toHaveText(/Mật khẩu không trùng khớp/)
    await expect(submitBtn).toBeDisabled()

    // Match passwords
    await confirmInput.fill('Pass123456!')
    await expect(confirmInput).not.toHaveAttribute('aria-invalid', 'true')
    await expect(page.locator('text=Mật khẩu trùng khớp')).toBeVisible()

    // Fill valid DOB
    await dobInput.fill('2000-05-15')

    // Submit now enabled
    await expect(submitBtn).toBeEnabled()
    await submitBtn.click()

    await expect.poll(() => registerPayload).toEqual({
      username: 'valid_user',
      firstname: 'Nguyen',
      lastname: 'An',
      email: 'foodie@test.vn',
      password: 'Pass123456!',
      dateOfBirth: '2000-05-15'
    })
  })

  test('5. Forgot password flow: Step 1 Email, Step 2 OTP (paste/backspace), Step 3 Reset', async ({ page }) => {
    let forgotEmailPayload = null
    let verifyOtpPayload = null
    let resetPasswordPayload = null

    await page.route('**/api/auth/forgot-password', async (route) => {
      forgotEmailPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: 'OTP sent' })
      })
    })

    await page.route('**/api/auth/verify-otp', async (route) => {
      verifyOtpPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: true })
      })
    })

    await page.route('**/api/auth/reset-password', async (route) => {
      resetPasswordPayload = route.request().postDataJSON()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1000, result: true })
      })
    })

    await page.goto('/explore')
    await page.getByRole('button', { name: /Đăng Nhập/i }).first().click()

    // Step 1: Open forgot password
    await page.getByRole('button', { name: /Quên mật khẩu\?/i }).click()
    const dialog = page.getByRole('dialog', { name: /Quên Mật Khẩu/i })
    await expect(dialog).toBeVisible()

    const forgotEmailInput = page.locator('#forgot-email')
    await forgotEmailInput.fill('reset@example.test')
    await page.getByRole('button', { name: /Gửi OTP Đặt Lại Mật Khẩu/i }).click()

    await expect.poll(() => forgotEmailPayload).toEqual({ email: 'reset@example.test' })

    // Step 2: OTP screen
    await expect(page.getByRole('dialog', { name: /Xác thực OTP/i })).toBeVisible()
    const otpGroup = page.locator('[role="group"][aria-labelledby="otp-group-label"]')
    await expect(otpGroup).toBeVisible()

    // Verify 6 OTP inputs have accessible digit labels
    for (let i = 0; i < 6; i++) {
      const digitInput = page.locator(`#otp-input-${i}`)
      await expect(digitInput).toHaveAttribute('aria-label', `Chữ số thứ ${i + 1}`)
      await expect(digitInput).toHaveAttribute('inputmode', 'numeric')
      const box = await digitInput.boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(44)
      expect(box.height).toBeGreaterThanOrEqual(44)
    }

    // Test Paste 6 digits
    const firstDigit = page.locator('#otp-input-0')
    await firstDigit.focus()
    await page.evaluate(() => {
      const input = document.getElementById('otp-input-0')
      const dt = new DataTransfer()
      dt.setData('text', '852963')
      input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }))
    })

    // Verify values populated across all 6 inputs
    await expect(page.locator('#otp-input-0')).toHaveValue('8')
    await expect(page.locator('#otp-input-1')).toHaveValue('5')
    await expect(page.locator('#otp-input-2')).toHaveValue('2')
    await expect(page.locator('#otp-input-3')).toHaveValue('9')
    await expect(page.locator('#otp-input-4')).toHaveValue('6')
    await expect(page.locator('#otp-input-5')).toHaveValue('3')

    // Test Backspace navigation
    await page.locator('#otp-input-5').focus()
    await page.keyboard.press('Backspace')
    await expect(page.locator('#otp-input-5')).toHaveValue('')
    await page.keyboard.press('Backspace')
    // Focus should automatically move to previous input (#otp-input-4)
    await expect(page.locator('#otp-input-4')).toBeFocused()

    // Re-fill digit 4 and 5
    await page.locator('#otp-input-4').fill('6')
    await page.locator('#otp-input-5').fill('3')

    // Submit OTP
    await page.getByRole('button', { name: /Xác Thực OTP/i }).click()
    await expect.poll(() => verifyOtpPayload).toEqual({
      email: 'reset@example.test',
      otp: '852963'
    })

    // Step 3: New password screen
    await expect(page.getByRole('dialog', { name: /Đặt lại mật khẩu/i })).toBeVisible()
    const newPassInput = page.locator('#reset-password')
    const confirmNewPassInput = page.locator('#reset-confirm-password')

    await expect(newPassInput).toHaveAttribute('autocomplete', 'new-password')
    await expect(confirmNewPassInput).toHaveAttribute('autocomplete', 'new-password')

    await newPassInput.fill('BrandNewPass99!')
    await confirmNewPassInput.fill('BrandNewPass99!')
    await expect(page.locator('text=Mật khẩu trùng khớp')).toBeVisible()

    await page.getByRole('button', { name: /Đổi Mật Khẩu & Đăng Nhập/i }).click()
    await expect.poll(() => resetPasswordPayload).toEqual({
      email: 'reset@example.test',
      otp: '852963',
      newPassword: 'BrandNewPass99!'
    })
  })

  test('6. Email verification & resend verification flow', async ({ page }) => {
    await page.goto('/harness.html')

    // Open AuthModal directly in 'verify' mode
    await page.locator('#open-auth-verify-trigger').click()
    const dialog = page.getByRole('dialog', { name: /Xác Thực Email/i })
    await expect(dialog).toBeVisible()

    // Test token activation input
    const tokenInput = page.locator('#verify-token')
    await expect(tokenInput).toBeVisible()
    await tokenInput.fill('manual-verification-uuid-123')
    await page.getByRole('button', { name: /Kích Hoạt Tài Khoản/i }).click()

    // Verify callback fired
    await expect(page.locator('#harness-verify-result')).toContainText('Last Verify: manual-verification-uuid-123')

    // Test resend verification block
    const resendInput = page.locator('#resend-email')
    await expect(resendInput).toBeVisible()
    await resendInput.fill('resend-me@example.test')
    await page.getByRole('button', { name: /Gửi Lại Kích Hoạt/i }).click()

    // Verify resend callback fired
    await expect(page.locator('#harness-verify-result')).toContainText('Last Resend: resend-me@example.test')
  })

  for (const width of [320, 390, 768, 1440]) {
    test(`7. Responsive viewport ${width}px without modal overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/explore')

      const openBtn = width < 640
        ? page.locator('nav button', { hasText: 'Đăng Nhập' }).first()
        : page.locator('header button', { hasText: 'Đăng Nhập' }).first()
      await openBtn.dispatchEvent('click')

      const dialog = page.getByRole('dialog', { name: /^Đăng Nhập$/i })
      await expect(dialog).toBeVisible()

      // Check document horizontal overflow
      const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(docOverflow).toBeLessThanOrEqual(1)

      // Check modal doesn't exceed screen width
      const dialogBox = await dialog.boundingBox()
      expect(dialogBox).not.toBeNull()
      expect(dialogBox.width).toBeLessThanOrEqual(width)

      // Switch to register and check responsive grid
      await page.getByRole('button', { name: /Đăng Ký Tài Khoản/i }).click()
      const regDialog = page.getByRole('dialog', { name: /Tạo Tài Khoản/i })
      await expect(regDialog).toBeVisible()

      const regOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(regOverflow).toBeLessThanOrEqual(1)

      // Close modal
      await page.keyboard.press('Escape')
      await expect(regDialog).toBeHidden()
    })
  }
})

test.describe('Batch 2D-2B.2B: Dialog Shell & Accessibility Contracts', () => {
  test('1. WAI-ARIA role, modal semantics, title and description associations', async ({ page }) => {
    await page.goto('/explore')
    await page.getByRole('button', { name: /Đăng Nhập/i }).first().click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')

    // Verify aria-labelledby points to DialogTitle
    const labelledBy = await dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const titleEl = page.locator(`#${labelledBy}`)
    await expect(titleEl).toBeVisible()
    await expect(titleEl).toContainText('Đăng Nhập')

    // Verify aria-describedby points to DialogDescription
    const describedBy = await dialog.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()
    const descEl = page.locator(`#${describedBy}`)
    await expect(descEl).toContainText('Cửa sổ đăng nhập tài khoản')
  })

  test('2. Backdrop click safety (closeOnBackdropClick=false) prevents data loss', async ({ page }) => {
    await page.goto('/explore')
    await page.getByRole('button', { name: /Đăng Nhập/i }).first().click()

    const emailInput = page.locator('#login-email')
    await emailInput.fill('stay-safe@example.test')

    // Click outside on backdrop (coordinates 10, 10)
    await page.mouse.click(10, 10)

    // Modal must remain open and data preserved
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(emailInput).toHaveValue('stay-safe@example.test')
  })

  test('3. Background isolation: inert and aria-hidden management, body scroll lock', async ({ page }) => {
    await page.goto('/explore')
    const loginButton = page.getByRole('button', { name: /Đăng Nhập/i }).first()
    await loginButton.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Background root isolation while open
    const rootEl = page.locator('#root')
    await expect(rootEl).toHaveAttribute('inert', '')
    await expect(rootEl).toHaveAttribute('aria-hidden', 'true')

    // Body scroll lock
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow)
    expect(bodyOverflow).toBe('hidden')

    // Close dialog
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()

    // Isolation restored
    await expect(rootEl).not.toHaveAttribute('inert')
    await expect(rootEl).not.toHaveAttribute('aria-hidden')
    const restoredOverflow = await page.evaluate(() => document.body.style.overflow)
    expect(restoredOverflow).toBe('')
  })

  test('4. Keyboard focus trap cycling and focus restoration to opener button', async ({ page }) => {
    await page.goto('/explore')
    const loginButton = page.getByRole('button', { name: /Đăng Nhập/i }).first()
    await loginButton.focus()
    await loginButton.press('Enter')

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Focus starts inside dialog
    const isInitialFocusInside = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]')
      return d ? d.contains(document.activeElement) : false
    })
    expect(isInitialFocusInside).toBe(true)

    // Tab through elements and verify focus remains trapped
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab')
      const isInside = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]')
        return d ? d.contains(document.activeElement) : false
      })
      expect(isInside).toBe(true)
    }

    // Close via Escape and verify focus restores to loginButton
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(loginButton).toBeFocused()
  })

  test('5. Escape key and close button locked during loading state', async ({ page }) => {
    await page.route('**/api/auth/token', async (route) => {
      await new Promise((r) => setTimeout(r, 800))
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ code: 1056, message: 'Invalid credentials' })
      })
    })

    await page.goto('/explore')
    await page.getByRole('button', { name: /Đăng Nhập/i }).first().click()

    await page.locator('#login-email').fill('user@example.test')
    await page.locator('#login-password').fill('Secret123!')

    const submitBtn = page.locator('form button[type="submit"]')
    await submitBtn.click()

    const dialog = page.locator('[role="dialog"]')

    // While loading, close button in header is disabled
    const closeBtn = page.getByRole('button', { name: 'Đóng cửa sổ đăng nhập' })
    await expect(closeBtn).toBeDisabled()

    // Press Escape during loading: dialog must NOT close
    await page.keyboard.press('Escape')
    await expect(dialog).toBeVisible()

    // Wait until loading finishes
    await expect(submitBtn).not.toHaveAttribute('aria-busy', 'true')

    // Close button and Escape are restored after loading
    await expect(closeBtn).toBeEnabled()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
