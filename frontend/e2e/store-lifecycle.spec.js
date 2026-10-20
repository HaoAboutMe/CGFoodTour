import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

test('creates, edits, uploads, approves and reloads a store deep-link', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD
  test.skip(!email || !password, 'Set the isolated rehearsal admin credentials')

  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`
  const login = await page.request.post('/api/auth/token', { data: { email, password } })
  expect(login.ok()).toBeTruthy()
  const accessToken = (await login.json()).result.accessToken
  const authenticated = { Authorization: `Bearer ${accessToken}` }

  const categoryResponse = await page.request.post('/api/v1/categories', {
    headers: authenticated,
    data: { name: `E2E ${suffix}`, iconUrl: 'utensils' }
  })
  expect(categoryResponse.ok()).toBeTruthy()
  const categoryId = (await categoryResponse.json()).result.id

  const initialStore = storePayload(categoryId, `E2E Store ${suffix}`)
  const createResponse = await page.request.post('/api/v1/stores', {
    headers: authenticated,
    data: initialStore
  })
  expect(createResponse.ok()).toBeTruthy()
  const created = (await createResponse.json()).result
  expect(created.status).toBe('PENDING')

  const uploadResponse = await page.request.patch(`/api/v1/stores/${created.id}/banner`, {
    headers: authenticated,
    multipart: {
      file: {
        name: 'hero.png',
        mimeType: 'image/png',
        buffer: await import('node:fs/promises').then(fs => fs.readFile(
          path.resolve(currentDirectory, '../src/assets/hero.png')
        ))
      }
    }
  })
  expect(uploadResponse.ok()).toBeTruthy()
  const uploaded = (await uploadResponse.json()).result
  expect(uploaded.bannerImageUrl).toContain('res.cloudinary.com/demo/')

  const replacementResponse = await page.request.patch(`/api/v1/stores/${created.id}/banner`, {
    headers: authenticated,
    multipart: {
      file: {
        name: 'hero-replacement.png',
        mimeType: 'image/png',
        buffer: await import('node:fs/promises').then(fs => fs.readFile(
          path.resolve(currentDirectory, '../src/assets/hero.png')
        ))
      }
    }
  })
  expect(replacementResponse.ok()).toBeTruthy()
  const replacement = (await replacementResponse.json()).result
  expect(replacement.bannerImageUrl).toBe(uploaded.bannerImageUrl)

  const editedName = `${initialStore.name} Updated`
  const editResponse = await page.request.put(`/api/v1/stores/${created.id}`, {
    headers: { ...authenticated, 'Content-Type': 'application/json' },
    data: { ...initialStore, name: editedName }
  })
  expect(editResponse.ok()).toBeTruthy()
  const edited = (await editResponse.json()).result
  expect(edited.name).toBe(editedName)
  expect(edited.bannerImageUrl).toBe(replacement.bannerImageUrl)
  expect(edited.status).toBe('PENDING')

  const approveResponse = await page.request.post(`/api/v1/stores/${created.id}/approve`, {
    headers: authenticated
  })
  expect(approveResponse.ok()).toBeTruthy()
  expect((await approveResponse.json()).result.status).toBe('APPROVED')

  const publicResponse = await page.request.get(`/api/v1/stores/${created.id}`)
  expect(publicResponse.ok()).toBeTruthy()
  expect((await publicResponse.json()).result.name).toBe(editedName)

  await page.goto(`/quan/${created.id}/e2e-store`)
  await expect(page).toHaveURL(new RegExp(`/quan/${created.id}/`))
  await page.reload()
  await expect(page).toHaveURL(new RegExp(`/quan/${created.id}/`))
  await expect(page.locator('body')).toContainText(editedName)
})

function storePayload(categoryId, name) {
  return {
    categoryId,
    name,
    phoneNumber: '0900000000',
    addressLine: 'Cần Giuộc, Long An',
    landmarkNote: 'Dữ liệu Docker rehearsal',
    latitude: 10.608,
    longitude: 106.671,
    openTime: '06:00:00',
    closeTime: '22:00:00',
    priceMin: 10000,
    priceMax: 50000,
    isVerified: false
  }
}
