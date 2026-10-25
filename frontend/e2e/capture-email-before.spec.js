import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREVIEWS_DIR = path.resolve(__dirname, 'email-previews/before');
const SCREENSHOTS_DIR = path.resolve(__dirname, 'screenshots/before-batch-3f-e');

fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const emailFiles = [
  { file: '1-verification.html', name: 'email-verification' },
  { file: '2-otp.html', name: 'email-otp' },
  { file: '3-account-disabled.html', name: 'email-account-disabled' },
  { file: '4-account-enabled.html', name: 'email-account-enabled' },
  { file: '5-store-hidden.html', name: 'email-store-hidden' },
  { file: '6-store-recovery-rejected.html', name: 'email-store-recovery-rejected' },
  { file: '7-store-hard-deleted.html', name: 'email-store-hard-deleted' }
];

test.describe('Batch 3F-E: Capture Before Email Screenshots', () => {
  for (const item of emailFiles) {
    test(`Capture Before Desktop: ${item.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1000, height: 900 });
      const filePath = path.join(PREVIEWS_DIR, item.file);
      await page.goto(`file://${filePath.replace(/\\/g, '/')}`);
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${item.name}-desktop.png`),
        fullPage: true
      });
    });

    test(`Capture Before Mobile: ${item.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const filePath = path.join(PREVIEWS_DIR, item.file);
      await page.goto(`file://${filePath.replace(/\\/g, '/')}`);
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `${item.name}-mobile.png`),
        fullPage: true
      });
    });
  }
});
