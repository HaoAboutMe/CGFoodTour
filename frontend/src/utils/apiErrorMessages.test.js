import test from 'node:test'
import assert from 'node:assert/strict'

import { getVietnameseApiError } from './apiErrorMessages.js'

test('translates known backend error codes without using the English message', () => {
  assert.equal(
    getVietnameseApiError({ code: 1026, message: 'Email or password is incorrect' }, 'Đăng nhập thất bại.'),
    'Email hoặc mật khẩu không chính xác.'
  )
})

test('uses the Vietnamese operation fallback for unknown and network errors', () => {
  assert.equal(
    getVietnameseApiError({ message: 'Failed to fetch' }, 'Không thể kết nối đến máy chủ.'),
    'Không thể kết nối đến máy chủ.'
  )
  assert.equal(getVietnameseApiError(null, 'Thao tác thất bại.'), 'Thao tác thất bại.')
})
