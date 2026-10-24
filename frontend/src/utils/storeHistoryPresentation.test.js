import test from 'node:test'
import assert from 'node:assert/strict'
import {
  actorLabel,
  getStoreHistoryPresentation,
  getStoreStatusLabel,
  HISTORY_GROUP_OPTIONS
} from '../pages/MyStores/history/storeHistoryPresentation.js'

test('maps every current store audit action to Vietnamese owner-facing copy', () => {
  const actions = [
    'SUBMIT', 'APPROVE', 'REJECT', 'EDIT_PENDING', 'RESUBMIT_AFTER_EDIT',
    'EDIT_HIDDEN', 'HIDE', 'RECOVER', 'REQUEST_RECOVERY',
    'REJECT_RECOVERY_REQUEST', 'HARD_DELETE'
  ]

  for (const action of actions) {
    const presentation = getStoreHistoryPresentation(action, 'ADMIN')
    assert.ok(presentation.title)
    assert.ok(presentation.description)
    assert.ok(presentation.tone)
    assert.ok(presentation.icon)
  }
})

test('uses safe generic copy for unknown audit actions', () => {
  const presentation = getStoreHistoryPresentation('INTERNAL_REVIEW_NOTE', 'ADMIN')
  assert.equal(presentation.title, 'Hoạt động của quán đã được cập nhật')
  assert.equal(presentation.tone, 'neutral')
})

test('distinguishes owner and admin hide actions without exposing identity', () => {
  assert.equal(getStoreHistoryPresentation('HIDE', 'OWNER').title, 'Bạn đã tạm ẩn quán')
  assert.equal(getStoreHistoryPresentation('HIDE', 'ADMIN').title, 'Quán đã bị quản trị viên ẩn')
  assert.equal(actorLabel('ADMIN'), 'Ban quản trị')
  assert.equal(actorLabel('OWNER'), 'Bạn')
  assert.equal(actorLabel('UNKNOWN'), 'Hệ thống')
})

test('defines stable status and filter labels', () => {
  assert.equal(getStoreStatusLabel('PENDING'), 'Chờ duyệt')
  assert.equal(getStoreStatusLabel('DELETED'), 'Đã xóa')
  assert.equal(getStoreStatusLabel('CUSTOM'), 'CUSTOM')
  assert.deepEqual(HISTORY_GROUP_OPTIONS.map((item) => item.value), [
    'ALL', 'WAITING', 'SUCCESS', 'ACTION_REQUIRED', 'HIDDEN', 'DELETED'
  ])
})
