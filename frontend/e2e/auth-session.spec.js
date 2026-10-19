import { test, expect, request as playwrightRequest } from '@playwright/test'

const mailpitUrl = process.env.E2E_MAILPIT_URL
const appBaseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:8081'

test('registers, verifies, logs in, rotates refresh token and logs out', async ({ page }) => {
  test.skip(!mailpitUrl, 'Set E2E_MAILPIT_URL to the isolated staging/rehearsal Mailpit API')

  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`
  const email = `e2e-${suffix}@example.test`
  const password = `E2e-${suffix}-Password!`

  const registration = await page.request.post('/api/auth/register', {
    data: {
      username: `e2e_${suffix}`.slice(0, 20),
      firstname: 'E2E',
      lastname: 'User',
      email,
      password,
      dateOfBirth: '1990-01-01'
    }
  })
  expect(registration.status()).toBe(201)

  const verificationToken = await waitForVerificationToken(email)
  const verification = await page.request.post('/api/auth/verify-email', {
    data: { token: verificationToken }
  })
  expect(verification.ok()).toBeTruthy()

  const login = await page.request.post('/api/auth/token', { data: { email, password } })
  expect(login.ok()).toBeTruthy()
  const loginBody = await login.json()
  expect(loginBody.result.accessToken).toBeTruthy()
  expect(loginBody.result.refreshToken).toBeUndefined()

  const cookiesAfterLogin = await page.context().cookies()
  const oldRefresh = cookiesAfterLogin.find(cookie => cookie.name.endsWith('cgft_refresh'))
  const csrf = cookiesAfterLogin.find(cookie => cookie.name.endsWith('cgft_csrf'))
  expect(oldRefresh?.httpOnly).toBeTruthy()
  if (appBaseUrl.startsWith('https://')) expect(oldRefresh?.secure).toBeTruthy()
  expect(csrf?.value).toBeTruthy()

  const refresh = await page.request.post('/api/auth/refresh', {
    headers: { 'X-CSRF-Token': csrf.value }
  })
  expect(refresh.ok()).toBeTruthy()

  const rotatedCookies = await page.context().cookies()
  const newRefresh = rotatedCookies.find(cookie => cookie.name.endsWith('cgft_refresh'))
  const newCsrf = rotatedCookies.find(cookie => cookie.name.endsWith('cgft_csrf'))
  expect(newRefresh.value).not.toBe(oldRefresh.value)

  const isolated = await playwrightRequest.newContext({ baseURL: appBaseUrl })
  const reusedOldRefresh = await isolated.post('/api/auth/refresh', {
    headers: {
      Cookie: `${oldRefresh.name}=${oldRefresh.value}; ${csrf.name}=${csrf.value}`,
      'X-CSRF-Token': csrf.value
    }
  })
  expect(reusedOldRefresh.status()).toBe(401)
  await isolated.dispose()

  const logout = await page.request.post('/api/auth/logout', {
    headers: {
      Authorization: `Bearer ${loginBody.result.accessToken}`,
      'X-CSRF-Token': newCsrf.value
    }
  })
  expect(logout.ok()).toBeTruthy()

  const refreshAfterLogout = await page.request.post('/api/auth/refresh', {
    headers: { 'X-CSRF-Token': newCsrf.value }
  })
  expect(refreshAfterLogout.status()).toBe(401)
})

async function waitForVerificationToken(email) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    const listResponse = await fetch(`${mailpitUrl}/api/v1/messages?query=${encodeURIComponent(`to:${email}`)}`)
    if (listResponse.ok) {
      const list = await listResponse.json()
      const message = list.messages?.[0]
      if (message?.ID) {
        const detailResponse = await fetch(`${mailpitUrl}/api/v1/message/${message.ID}`)
        if (detailResponse.ok) {
          const detail = await detailResponse.json()
          const content = `${detail.HTML || ''}\n${detail.Text || ''}`
          const match = content.match(/[?&]token=([A-Za-z0-9-]+)/)
          if (match) return match[1]
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`Verification email was not observed for ${email}`)
}
