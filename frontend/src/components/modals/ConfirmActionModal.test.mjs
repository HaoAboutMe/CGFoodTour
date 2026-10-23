import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const h = React.createElement

let viteServer
let ConfirmActionModal

test.before(async () => {
  viteServer = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom'
  })
  const mod = await viteServer.ssrLoadModule('./src/components/modals/ConfirmActionModal.jsx')
  ConfirmActionModal = mod.default
})

test.after(async () => {
  if (viteServer) {
    await viteServer.close()
  }
})

test('ConfirmActionModal - renders alertdialog with title, description and action buttons', () => {
  const html = renderToString(
    h(ConfirmActionModal, {
      isOpen: true,
      title: 'Xóa danh mục',
      description: 'Danh mục này sẽ bị xóa vĩnh viễn.',
      confirmLabel: 'Xóa ngay',
      onClose: () => {},
      onConfirm: () => {}
    })
  )

  assert.ok(html.includes('role="alertdialog"'), 'Uses alertdialog role for destructive confirmation')
  assert.ok(html.includes('Xóa danh mục'), 'Renders title')
  assert.ok(html.includes('Danh mục này sẽ bị xóa vĩnh viễn.'), 'Renders description')
  assert.ok(html.includes('Xóa ngay'), 'Renders custom confirm label')
  assert.ok(html.includes('Hủy bỏ'), 'Renders cancel button')
})

test('ConfirmActionModal - renders confirmation input when expectedText is provided', () => {
  const html = renderToString(
    h(ConfirmActionModal, {
      isOpen: true,
      title: 'Xóa người dùng',
      description: 'Hành động nguy hiểm',
      expectedText: 'admin_test',
      reasonRequired: true,
      onClose: () => {},
      onConfirm: () => {}
    })
  )

  assert.ok(html.includes('admin_test'), 'Renders expected confirmation text')
  assert.ok(html.includes('Lý do'), 'Renders reason field label')
  assert.ok(html.includes('id="confirm-action-confirmation"'), 'Renders confirmation FormField')
  assert.ok(html.includes('id="confirm-action-reason"'), 'Renders reason FormField')
})

test('ConfirmActionModal - renders nothing when isOpen is false', () => {
  const html = renderToString(
    h(ConfirmActionModal, {
      isOpen: false,
      title: 'Test',
      description: 'Desc',
      onClose: () => {},
      onConfirm: () => {}
    })
  )

  assert.strictEqual(html, '', 'Renders nothing when closed')
})
