import { test } from '@playwright/test';

// Final visual evidence for the played-card anchoring fix. Each shot is taken after a
// player lead plus NPC replies, so a real played stack is on the felt.
const CASES = [
  { w: 1440, h: 900, tag: '1440x900' },
  { w: 1280, h: 720, tag: '1280x720' }
];

for (const { w, h, tag } of CASES) {
  test(`anchoring shot @ ${tag}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/#/home');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForLoadState('networkidle');
    await page.locator('[data-action="start"]').first().click();
    await page.waitForSelector('.table-felt', { timeout: 20_000 });
    const skip = page.locator('[data-action="close-entry"]');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await page.waitForTimeout(500);
    await page.locator('[data-action="bid"]').click().catch(() => {});
    await page.waitForTimeout(1000);
    await page.locator('.hand .card').first().click();
    await page.locator('[data-action="play"]').click();
    await page.waitForTimeout(6500);
    await page.screenshot({ path: `docs/ui-shots/fixed-anchor-${tag}.png` });
  });
}
