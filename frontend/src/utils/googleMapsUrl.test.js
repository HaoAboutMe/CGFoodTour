import test from 'node:test'
import assert from 'node:assert/strict'
import { getSafeGoogleMapsUrl, isAllowedGoogleMapsUrl } from './googleMapsUrl.js'

test('accepts supported Google Maps links and rejects lookalikes', () => {
  assert.equal(isAllowedGoogleMapsUrl('https://maps.app.goo.gl/oW3cwtzLXYQXrYLN8'), true)
  assert.equal(isAllowedGoogleMapsUrl('https://www.google.com/maps/@10.5,106.6,17z'), true)
  assert.equal(isAllowedGoogleMapsUrl('https://google.com.attacker.example/maps/x'), false)
  assert.equal(isAllowedGoogleMapsUrl('https://www.google.com/maps/../../evil?query=10.5,106.6'), false)
  assert.equal(isAllowedGoogleMapsUrl('https://www.google.com/?notapi=1&query=10.5,106.6'), false)
  assert.equal(isAllowedGoogleMapsUrl('javascript:alert(1)'), false)
})

test('falls back to a coordinate-based Google Maps URL', () => {
  assert.equal(
    getSafeGoogleMapsUrl('https://evil.example/phish', 10.5, 106.6),
    'https://www.google.com/maps/search/?api=1&query=10.5%2C106.6'
  )
  assert.equal(getSafeGoogleMapsUrl('bad', null, null), null)
})
