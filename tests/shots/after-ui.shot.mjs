import { test, expect } from '@playwright/test';

// Captures the current rendered state of each route so the reviewer can see the
// post-hardening UI without opening a browser. Output: docs/ui-shots/after-*.png
const SHOT_DIR = 'docs/ui-shots';

async function settle(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
}

test('after: 大厅（含新增顶栏偏好控件）', async ({ page }) => {
  await page.goto('/#/home');
  await settle(page);
  await expect(page.locator('.top-controls')).toBeVisible();
  await page.screenshot({ path: `${SHOT_DIR}/after-01-home.png` });
});

test('after: 牌桌（手牌扇面 + 视口无溢出）', async ({ page }) => {
  await page.goto('/#/home');
  await settle(page);
  await page.locator('[data-action="start"]').first().click();
  await page.waitForSelector('.table-felt', { timeout: 20_000 });
  // Dismiss the entry cinematic so the hand is fully visible.
  const skip = page.locator('[data-action="close-entry"]');
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.waitForTimeout(1500);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight
  );
  console.log(`[shot] table overflow = ${overflow}px`);
  await page.screenshot({ path: `${SHOT_DIR}/after-02-table.png` });
});

test('after: 切换速度与音效后的顶栏状态', async ({ page }) => {
  await page.goto('/#/home');
  await settle(page);
  await page.locator('[data-action="toggle-speed"]').click();
  await page.locator('[data-action="toggle-sfx"]').click();
  await page.waitForTimeout(300);
  const label = await page.locator('#speedLabel').textContent();
  const pressed = await page.locator('[data-action="toggle-sfx"]').getAttribute('aria-pressed');
  console.log(`[shot] speed=${label} sfxPressed=${pressed}`);
  await page.screenshot({ path: `${SHOT_DIR}/after-03-toggles.png` });
});

test('after: 写真馆', async ({ page }) => {
  await page.goto('/#/gallery');
  await settle(page);
  await page.screenshot({ path: `${SHOT_DIR}/after-04-gallery.png` });
});
