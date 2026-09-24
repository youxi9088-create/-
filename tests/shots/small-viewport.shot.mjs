import { test } from '@playwright/test';

// Proves the felt-height fix at the two weakest supported viewports.
// 1280x720 is the stated minimum; 1440x900 is the design target.
const CASES = [
  { w: 1440, h: 900, tag: '1440x900' },
  { w: 1280, h: 720, tag: '1280x720' }
];

for (const { w, h, tag } of CASES) {
  test(`table @ ${tag}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/#/home');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForLoadState('networkidle');
    await page.locator('[data-action="start"]').first().click();
    await page.waitForSelector('.table-felt', { timeout: 20_000 });
    const skip = page.locator('[data-action="close-entry"]');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await page.waitForTimeout(1200);
    const m = await page.evaluate(() => {
      const felt = document.querySelector('.table-felt');
      const hand = document.querySelector('.hand');
      return {
        overflow: document.documentElement.scrollHeight - window.innerHeight,
        felt: felt ? Math.round(felt.getBoundingClientRect().height) : null,
        hand: hand ? Math.round(hand.getBoundingClientRect().height) : null
      };
    });
    console.log(`[shot] ${tag} overflow=${m.overflow}px felt=${m.felt}px hand=${m.hand}px`);
    await page.screenshot({ path: `docs/ui-shots/after-05-${tag}.png` });
  });
}
