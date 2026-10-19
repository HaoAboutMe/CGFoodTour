import test from 'node:test'
import assert from 'node:assert/strict'
import { validateProductionBuildEnvironment } from './frontend-build-contract.mjs'

const validEnvironment = {
  VITE_GOOGLE_CLIENT_ID: 'test-client.apps.googleusercontent.com',
  VITE_FACEBOOK_APP_ID: 'test-facebook-app',
  VITE_API_BASE_URL: '/api'
}

test('accepts complete same-origin production configuration', () => {
  assert.doesNotThrow(() => validateProductionBuildEnvironment(validEnvironment))
})

test('rejects missing and placeholder OAuth identifiers', () => {
  assert.throws(() => validateProductionBuildEnvironment({ ...validEnvironment, VITE_GOOGLE_CLIENT_ID: '' }))
  assert.throws(() => validateProductionBuildEnvironment({ ...validEnvironment, VITE_FACEBOOK_APP_ID: 'YOUR_FB_ID' }))
})

test('rejects localhost and cross-origin API build values', () => {
  assert.throws(() => validateProductionBuildEnvironment({
    ...validEnvironment,
    VITE_API_BASE_URL: 'http://localhost:8080/api'
  }))
  assert.throws(() => validateProductionBuildEnvironment({
    ...validEnvironment,
    VITE_API_BASE_URL: 'https://api.example.com/api'
  }))
})
