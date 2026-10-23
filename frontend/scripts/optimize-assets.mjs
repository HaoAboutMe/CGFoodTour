import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const root = path.resolve(import.meta.dirname, '..')
const source = path.join(root, 'assets-source', 'logo_1024.webp')
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage()
  const sourceData = await fs.readFile(source)
  const sourceUrl = `data:image/webp;base64,${sourceData.toString('base64')}`

  for (const size of [128, 512]) {
    const dataUrl = await page.evaluate(async ({ sourceUrl: url, size: targetSize }) => {
      const image = new Image()
      image.src = url
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = targetSize
      canvas.height = targetSize
      canvas.getContext('2d').drawImage(image, 0, 0, targetSize, targetSize)
      return canvas.toDataURL('image/webp', 0.82)
    }, { sourceUrl, size })
    const bytes = Buffer.from(dataUrl.split(',')[1], 'base64')
    await fs.writeFile(path.join(root, 'public', `logo-${size}.webp`), bytes)
    if (size === 128) await fs.writeFile(path.join(root, 'src', 'assets', 'logo-128.webp'), bytes)
  }
} finally {
  await browser.close()
}
