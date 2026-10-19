import { test, expect } from '@playwright/test'

test('serves the Vietnamese SPA and exposes a healthy backend', async ({ page, request }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))

  await page.goto('/')

  await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  await expect(page).toHaveTitle(/Food Tour/i)
  const health = await request.get('/api/actuator/health/readiness')
  expect(health.ok()).toBeTruthy()
  expect(await health.json()).toMatchObject({ status: 'UP' })
  expect(errors).toEqual([])
})

test('returns correlation id without exposing health details', async ({ request }) => {
  const response = await request.get('/api/actuator/health', {
    headers: { 'X-Request-ID': 'e2e-health-check' }
  })

  expect(response.ok()).toBeTruthy()
  expect(response.headers()['x-request-id']).toBe('e2e-health-check')
  const body = await response.json()
  expect(body).toEqual({ status: 'UP' })
})
