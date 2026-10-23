import test from 'node:test'
import assert from 'node:assert/strict'

/**
 * Calculates relative luminance according to WCAG 2.2 specification.
 * https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */
function getRelativeLuminance(hex) {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const transform = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))

  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b)
}

/**
 * Calculates contrast ratio between two colors (L1 + 0.05) / (L2 + 0.05)
 */
function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1)
  const l2 = getRelativeLuminance(hex2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

test('action red colors with white text pass WCAG 2.2 AA (>= 4.5:1)', () => {
  const white = '#ffffff'
  const actionRed = '#c92a2a'
  const actionRedHover = '#a61e1e'

  const actionRatio = getContrastRatio(white, actionRed)
  const hoverRatio = getContrastRatio(white, actionRedHover)

  assert.ok(
    actionRatio >= 4.5,
    `Action red contrast ${actionRatio.toFixed(2)} must be >= 4.5:1 for WCAG AA normal text`
  )
  assert.ok(
    hoverRatio >= 4.5,
    `Action hover contrast ${hoverRatio.toFixed(2)} must be >= 4.5:1 for WCAG AA normal text`
  )
})

test('brand red with black text passes WCAG 2.2 AA (>= 4.5:1)', () => {
  const ink = '#111111'
  const brandRed = '#ff3e3e'

  const ratio = getContrastRatio(ink, brandRed)
  assert.ok(
    ratio >= 4.5,
    `Brand red with ink contrast ${ratio.toFixed(2)} must be >= 4.5:1 for WCAG AA normal text`
  )
})

test('text colors on canvas and surface pass WCAG 2.2 AA (>= 4.5:1)', () => {
  const canvas = '#f7f6f2'
  const surface = '#ffffff'
  const ink = '#111111'
  const inkMuted = '#525252'

  const inkOnCanvas = getContrastRatio(ink, canvas)
  const inkOnSurface = getContrastRatio(ink, surface)
  const mutedOnCanvas = getContrastRatio(inkMuted, canvas)
  const mutedOnSurface = getContrastRatio(inkMuted, surface)

  assert.ok(inkOnCanvas >= 7.0, `Ink on canvas (${inkOnCanvas.toFixed(2)}) passes AAA`)
  assert.ok(inkOnSurface >= 7.0, `Ink on surface (${inkOnSurface.toFixed(2)}) passes AAA`)
  assert.ok(mutedOnCanvas >= 4.5, `Muted text on canvas (${mutedOnCanvas.toFixed(2)}) passes AA`)
  assert.ok(mutedOnSurface >= 4.5, `Muted text on surface (${mutedOnSurface.toFixed(2)}) passes AA`)
})

test('semantic status pairs pass WCAG 2.2 AA (>= 4.5:1)', () => {
  const successText = '#096c4a'
  const successBg = '#e6fcf5'
  const warningText = '#92400e'
  const warningBg = '#fff7d6'
  const dangerText = '#b42318'
  const dangerBg = '#fef3f2'

  const successRatio = getContrastRatio(successText, successBg)
  const warningRatio = getContrastRatio(warningText, warningBg)
  const dangerRatio = getContrastRatio(dangerText, dangerBg)

  assert.ok(successRatio >= 4.5, `Success pair contrast ${successRatio.toFixed(2)} must be >= 4.5:1`)
  assert.ok(warningRatio >= 4.5, `Warning pair contrast ${warningRatio.toFixed(2)} must be >= 4.5:1`)
  assert.ok(dangerRatio >= 4.5, `Danger pair contrast ${dangerRatio.toFixed(2)} must be >= 4.5:1`)
})

test('focus ring color passes WCAG 2.2 UI contrast (>= 3.0:1) on common backgrounds', () => {
  const focus = '#2563eb'
  const canvas = '#f7f6f2'
  const white = '#ffffff'
  const ink = '#111111'

  const againstCanvas = getContrastRatio(focus, canvas)
  const againstWhite = getContrastRatio(focus, white)
  const againstInk = getContrastRatio(focus, ink)

  assert.ok(againstCanvas >= 3.0, `Focus ring against canvas (${againstCanvas.toFixed(2)}) must be >= 3.0:1`)
  assert.ok(againstWhite >= 3.0, `Focus ring against white (${againstWhite.toFixed(2)}) must be >= 3.0:1`)
  assert.ok(againstInk >= 3.0, `Focus ring against ink (${againstInk.toFixed(2)}) must be >= 3.0:1`)
})
