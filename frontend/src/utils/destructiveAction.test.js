import test from 'node:test'
import assert from 'node:assert/strict'
import { validateDestructiveAction } from './destructiveAction.js'

test('requires an exact confirmation value', () => {
  assert.match(validateDestructiveAction({ confirmation: 'wrong', expectedText: 'owner' }), /owner/)
  assert.equal(validateDestructiveAction({ confirmation: ' owner ', expectedText: 'owner' }), '')
})

test('requires a non-blank reason when configured', () => {
  assert.match(validateDestructiveAction({ reason: '  ', reasonRequired: true }), /lý do/i)
  assert.equal(validateDestructiveAction({ reason: 'Vi phạm nội dung', reasonRequired: true }), '')
})
