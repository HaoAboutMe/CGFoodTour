import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const h = React.createElement

let viteServer
let ui

test.before(async () => {
  viteServer = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom'
  })
  ui = await viteServer.ssrLoadModule('./src/components/ui/index.js')
})

test.after(async () => {
  if (viteServer) {
    await viteServer.close()
  }
})

test('Button - default behavior and variant classes', () => {
  const html = renderToString(h(ui.Button, null, 'Bấm Vào Đây'))
  assert.ok(html.includes('type="button"'), 'Button defaults to type="button"')
  assert.ok(html.includes('Bấm Vào Đây'), 'Renders button text')
  assert.ok(html.includes('bg-[var(--color-action)]'), 'Defaults to action red variant')
  assert.ok(html.includes('shadow-[var(--shadow-brutalist-sm)]'), 'Includes neo-brutalist shadow')
})

test('Button - variants (brand, surface, outline, ghost, danger)', () => {
  const brandHtml = renderToString(h(ui.Button, { variant: 'brand' }, 'Brand'))
  assert.ok(brandHtml.includes('bg-[var(--color-brand)]'), 'Brand variant uses brand color')

  const surfaceHtml = renderToString(h(ui.Button, { variant: 'surface' }, 'Surface'))
  assert.ok(surfaceHtml.includes('bg-[var(--color-surface)]'), 'Surface variant uses surface color')

  const dangerHtml = renderToString(h(ui.Button, { variant: 'danger' }, 'Danger'))
  assert.ok(dangerHtml.includes('bg-[var(--color-danger-text)]'), 'Danger variant uses danger color')

  const ghostHtml = renderToString(h(ui.Button, { variant: 'ghost' }, 'Ghost'))
  assert.ok(ghostHtml.includes('border-transparent'), 'Ghost variant has transparent border')
})

test('Button - disabled and loading states', () => {
  const disabledHtml = renderToString(h(ui.Button, { disabled: true }, 'Vô hiệu'))
  assert.ok(disabledHtml.includes('disabled=""') || disabledHtml.includes('disabled'), 'Has disabled attribute')
  assert.ok(disabledHtml.includes('cursor-not-allowed'), 'Has cursor-not-allowed')

  const loadingHtml = renderToString(h(ui.Button, { isLoading: true, loadingText: 'Đang gửi...' }, 'Gửi'))
  assert.ok(loadingHtml.includes('aria-busy="true"'), 'Has aria-busy when loading')
  assert.ok(loadingHtml.includes('Đang gửi...'), 'Renders loadingText')
  assert.ok(loadingHtml.includes('animate-spin'), 'Renders spinning loader icon')
})

test('IconButton - enforces accessible name and renders square geometry', () => {
  const html = renderToString(
    h(ui.IconButton, {
      'aria-label': 'Xóa mục',
      icon: h('span', { 'data-testid': 'trash-icon' }, '🗑️')
    })
  )
  assert.ok(html.includes('aria-label="Xóa mục"'), 'Renders required aria-label')
  assert.ok(html.includes('w-10 h-10') || html.includes('p-0'), 'Has icon button square dimensions')
  assert.ok(html.includes('data-testid="trash-icon"'), 'Renders icon')
})

test('FormField - associates label, input, hint and error with deterministic IDs', () => {
  const html = renderToString(
    h(
      ui.FormField,
      {
        id: 'test-email',
        label: 'Địa chỉ Email',
        hint: 'Chúng tôi không bao giờ chia sẻ email của bạn',
        error: 'Email không hợp lệ',
        required: true
      },
      h(ui.Input, { placeholder: 'name@example.com' })
    )
  )

  // Label association
  assert.ok(html.includes('for="test-email"'), 'Label has matching htmlFor attribute')
  assert.ok(html.includes('id="test-email"'), 'Input receives control id from FormField')

  // Required announcement
  assert.ok(html.includes('(bắt buộc)'), 'Accessible text announces required state to screen readers')

  // Error alert association
  assert.ok(html.includes('id="test-email-error"'), 'Error element has error id')
  assert.ok(html.includes('role="alert"'), 'Error element has role="alert"')
  assert.ok(html.includes('Email không hợp lệ'), 'Renders error text')

  // Hint association
  assert.ok(html.includes('id="test-email-hint"'), 'Hint element has hint id')

  // Input aria-describedby and aria-invalid
  assert.ok(html.includes('aria-describedby="test-email-error test-email-hint"'), 'Input links to error and hint')
  assert.ok(html.includes('aria-invalid="true"'), 'Input is flagged as invalid')
})

test('Input - left and right adornments', () => {
  const html = renderToString(
    h(ui.Input, {
      leftAdornment: h('span', { 'data-testid': 'search-icon' }, '🔍'),
      rightAdornment: h('button', { type: 'button' }, 'Xóa')
    })
  )
  assert.ok(html.includes('data-testid="search-icon"'), 'Renders left adornment')
  assert.ok(html.includes('Xóa'), 'Renders right adornment')
  assert.ok(html.includes('pl-10'), 'Input applies left padding for adornment')
  assert.ok(html.includes('pr-10'), 'Input applies right padding for adornment')
})

test('NativeSelect - options rendering and FormField integration', () => {
  const options = [
    { value: 'hn', label: 'Hà Nội' },
    { value: 'hcm', label: 'TP. Hồ Chí Minh' },
    { value: 'cg', label: 'Cần Giuộc' }
  ]

  const html = renderToString(
    h(
      ui.FormField,
      { id: 'select-city', label: 'Tỉnh/Thành' },
      h(ui.NativeSelect, { placeholder: 'Chọn khu vực...', options })
    )
  )

  assert.ok(html.includes('id="select-city"'), 'NativeSelect receives control id')
  assert.ok(html.includes('Chọn khu vực...'), 'Renders placeholder option')
  assert.ok(html.includes('value="cg"'), 'Renders options')
  assert.ok(html.includes('Cần Giuộc'), 'Renders option labels')
  assert.ok(html.includes('appearance-none'), 'Customizes native appearance')

  const standaloneHtml = renderToString(
    h(ui.NativeSelect, {
      id: 'admin-filter-role',
      'aria-label': 'Lọc vai trò',
      containerClassName: 'w-48',
      options: [{ value: 'ALL', label: 'Tất Cả' }]
    })
  )
  assert.ok(standaloneHtml.includes('w-48'), 'NativeSelect applies containerClassName to outer wrapper')
  assert.ok(standaloneHtml.includes('aria-label="Lọc vai trò"'), 'NativeSelect receives aria-label')
})

test('Dialog - rendering structure, accessibility roles and closed state', () => {
  const closedHtml = renderToString(
    h(ui.Dialog, { isOpen: false, onClose: () => {} }, h(ui.DialogTitle, null, 'Tiêu đề'))
  )
  assert.strictEqual(closedHtml, '', 'Dialog renders nothing when closed (isOpen=false)')

  const openHtml = renderToString(
    h(
      ui.Dialog,
      { isOpen: true, onClose: () => {}, role: 'alertdialog' },
      h(
        ui.DialogHeader,
        null,
        h(ui.DialogTitle, null, 'Xác nhận xóa'),
        h(ui.DialogDescription, null, 'Hành động này không thể hoàn tác')
      ),
      h(ui.DialogContent, null, 'Nội dung cảnh báo'),
      h(
        ui.DialogFooter,
        null,
        h(ui.Button, { variant: 'outline' }, 'Hủy'),
        h(ui.Button, { variant: 'danger' }, 'Xác nhận')
      )
    )
  )

  assert.ok(openHtml.includes('role="alertdialog"'), 'Renders dialog role')
  assert.ok(openHtml.includes('aria-modal="true"'), 'Has aria-modal="true"')
  assert.ok(openHtml.includes('aria-labelledby='), 'Has aria-labelledby linked to Title')
  assert.ok(openHtml.includes('aria-describedby='), 'Has aria-describedby linked to Description')
  assert.ok(openHtml.includes('Xác nhận xóa'), 'Renders Title')
  assert.ok(openHtml.includes('Hành động này không thể hoàn tác'), 'Renders Description')
  assert.ok(openHtml.includes('Đóng hộp thoại'), 'Close button has accessible aria-label')
})

test('Primitives - enforce minimum 44px touch target geometry', () => {
  const btnHtml = renderToString(h(ui.Button, null, 'Click Me'))
  assert.ok(btnHtml.includes('min-h-[44px]'), 'Button defaults to min-h-[44px] touch target')

  const inputHtml = renderToString(h(ui.Input, null))
  assert.ok(inputHtml.includes('min-h-[44px]'), 'Input enforces min-h-[44px] touch target')

  const selectHtml = renderToString(h(ui.NativeSelect, { options: [{ value: '1', label: 'One' }] }))
  assert.ok(selectHtml.includes('min-h-[44px]'), 'NativeSelect enforces min-h-[44px] touch target')

  const iconBtnHtml = renderToString(h(ui.IconButton, { 'aria-label': 'Action', icon: 'X' }))
  assert.ok(iconBtnHtml.includes('min-w-[44px]') && iconBtnHtml.includes('min-h-[44px]'), 'IconButton guarantees 44x44px touch target')
})

test('Skeleton - primitives have aria-hidden and brutalist classes', () => {
  const skeletonHtml = renderToString(h(ui.Skeleton, { className: 'h-6 w-24' }))
  assert.ok(skeletonHtml.includes('aria-hidden="true"'), 'Skeleton primitive has aria-hidden="true"')
  assert.ok(skeletonHtml.includes('brutalist-skeleton'), 'Skeleton primitive uses brutalist-skeleton class')
  assert.ok(skeletonHtml.includes('h-6 w-24'), 'Preserves custom utility classes')

  const storeSkeletonGrid = renderToString(h(ui.StoreCardSkeleton, { viewMode: 'grid' }))
  assert.ok(storeSkeletonGrid.includes('brutalist-card'), 'StoreCardSkeleton renders card container')
  assert.ok(storeSkeletonGrid.includes('h-44'), 'Grid skeleton matches 176px image geometry')

  const metricSkeleton = renderToString(h(ui.MetricCardSkeleton, null))
  assert.ok(metricSkeleton.includes('brutalist-card'), 'MetricCardSkeleton renders brutalist card')

  const tableSkeleton = renderToString(h(ui.TableSkeleton, { rows: 3, cols: 4 }))
  assert.ok(tableSkeleton.includes('<table'), 'TableSkeleton renders table element')
  assert.ok(tableSkeleton.includes('aria-hidden="true"'), 'TableSkeleton has aria-hidden')

  const drawerSkeleton = renderToString(h(ui.DetailDrawerSkeleton, null))
  assert.ok(drawerSkeleton.includes('h-52') || drawerSkeleton.includes('h-64'), 'DetailDrawerSkeleton has hero banner placeholder')

  const profileSkeleton = renderToString(h(ui.ProfileFormSkeleton, null))
  assert.ok(profileSkeleton.includes('brutalist-card'), 'ProfileFormSkeleton renders card containers')
})

