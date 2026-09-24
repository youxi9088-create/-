import { test } from '@playwright/test';

// The top seat's row = standee + role chip + back-cards. translateX(-50%) centres the ROW,
// so the character sits left of true centre by half the trailing siblings' width. This
// measures that width directly instead of guessing a px nudge.
test('measure top-seat row composition', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/#/home');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForLoadState('networkidle');
  await page.locator('[data-action="start"]').first().click();
  await page.waitForSelector('.table-felt', { timeout: 20_000 });
  const skip = page.locator('[data-action="close-entry"]');
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await page.waitForTimeout(800);

  const m = await page.evaluate(() => {
    const row = document.querySelector('.opponent.top');
    const kid = (sel) => {
      const el = row.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    };
    const cs = getComputedStyle(row);
    return {
      rowW: Math.round(row.getBoundingClientRect().width),
      rowH: Math.round(row.getBoundingClientRect().height),
      transform: cs.transform,
      gap: cs.gap,
      standee: kid('.pal-standee'),
      chip: kid('div:not([class])'),
      back: kid('.back-cards'),
      bubble: kid('.pal-bubble')
    };
  });
  console.log(JSON.stringify(m, null, 2));
});
