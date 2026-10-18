import test from 'node:test'
import assert from 'node:assert/strict'
import { canShareStore, slugifyStoreName, storePath } from './storeUrl.js'

test('creates stable Vietnamese store slugs', () => {
  assert.equal(slugifyStoreName('Bánh Xèo Bà Hai'), 'banh-xeo-ba-hai')
  assert.equal(slugifyStoreName('  Đặc sản & Quán Ăn  '), 'dac-san-quan-an')
  assert.equal(slugifyStoreName('***'), 'quan-an')
  assert.equal(storePath({ id: 'store/1', name: 'Bún bò' }), '/quan/store%2F1/bun-bo')
})

test('only allows approved stores to be shared', () => {
  assert.equal(canShareStore({ status: 'APPROVED' }), true)
  assert.equal(canShareStore({ status: 'PENDING' }), false)
  assert.equal(canShareStore({ status: 'HIDDEN' }), false)
  assert.equal(canShareStore({ status: 'REJECTED' }), false)
  assert.equal(canShareStore(null), false)
})
