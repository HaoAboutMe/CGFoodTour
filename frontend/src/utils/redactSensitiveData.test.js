import assert from 'node:assert/strict'
import test from 'node:test'
import { REDACTED, redactSensitiveData } from './redactSensitiveData.js'

test('redacts nested credentials without mutating input', () => {
  const input = {
    email: 'user@example.com',
    password: 'secret',
    nested: [{ accessToken: 'access', label: 'safe' }]
  }

  const output = redactSensitiveData(input)

  assert.equal(output.email, input.email)
  assert.equal(output.password, REDACTED)
  assert.equal(output.nested[0].accessToken, REDACTED)
  assert.equal(output.nested[0].label, 'safe')
  assert.equal(input.password, 'secret')
})

test('normalizes sensitive key spelling and casing', () => {
  const output = redactSensitiveData({ refresh_token: 'refresh', OldPassword: 'old', otp: '123456' })

  assert.equal(output.refresh_token, REDACTED)
  assert.equal(output.OldPassword, REDACTED)
  assert.equal(output.otp, REDACTED)
})
