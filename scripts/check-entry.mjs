import { chromium } from '@playwright/test';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:4173/');
await page.click('[data-action="start"]');
await page.waitForSelector('.entry-cinematic', { timeout: 10000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'shot-entry-seg1.png' });
await page.waitForFunction(() => {
  const segs = document.querySelectorAll('[data-entry-seg]');
  return segs[1] && segs[1].classList.contains('show');
}, { timeout: 30000 });
await page.waitForTimeout(1800);
await page.screenshot({ path: 'shot-entry-seg2.png' });
await page.waitForFunction(() => !document.querySelector('.entry-cinematic'), { timeout: 30000 });
await page.screenshot({ path: 'shot-entry-done.png' });
await browser.close();
console.log('done');
