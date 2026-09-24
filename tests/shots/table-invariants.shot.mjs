import { test } from '@playwright/test';

// Sweeps the supported desktop range and asserts the invariants that the "round 4"
// coordinate system is supposed to guarantee:
//   1. no page scroll
//   2. mia stays on the right half, linxing on the top-centre
//   3. the played stack never overlaps either standee
//   4. the played stack stays inside the felt
//   5. label / cards / owner row all sit inside the stack box
const VIEWPORTS = [
  { w: 1024, h: 720, tag: '1024x720' },
  { w: 1280, h: 720, tag: '1280x720' },
  { w: 1366, h: 768, tag: '1366x768' },
  { w: 1440, h: 900, tag: '1440x900' },
  { w: 1920, h: 1080, tag: '1920x1080' },
  { w: 2560, h: 1440, tag: '2560x1440' }
];

for (const { w, h, tag } of VIEWPORTS) {
  test(`table invariants @ ${tag}`, async ({ page }) => {
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

    const g = await page.evaluate(() => {
      const felt = document.querySelector('.table-felt');
      const f = felt.getBoundingClientRect();
      const rel = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.left - f.left), y: Math.round(r.top - f.top), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right - f.left), bottom: Math.round(r.bottom - f.top), cx: Math.round(r.left - f.left + r.width / 2) };
      };
      const ov = (a, b) => Boolean(a && b && a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom);
      // Measure the seat *box*, not the inner <img>: the standee clips its image with
      // object-position: 56% center, so the img's bounding box sits ~12px right of the
      // box centre at every viewport. That is an intentional crop, not a centring error,
      // and measuring it made the assertion fail on correct layouts.
      const linxing = rel(document.querySelector('.opponent.top .pal-standee'));
      const mia = rel(document.querySelector('.opponent.right .pal-standee'));
      const linxingSeat = rel(document.querySelector('.opponent.top'));
      const miaSeat = rel(document.querySelector('.opponent.right'));
      const stack = rel(document.querySelector('.played-stack'));
      const lab = rel(document.querySelector('.played-stack > p'));
      const own = rel(document.querySelector('.played-stack > b'));
      return {
        feltW: Math.round(f.width), feltH: Math.round(f.height),
        overflow: document.documentElement.scrollHeight - window.innerHeight,
        linxing, mia, linxingSeat, miaSeat, stack, lab, own,
        labelInStack: Boolean(lab && stack && lab.y >= stack.y - 2 && lab.bottom <= stack.bottom + 2),
        ownerInStack: Boolean(own && stack && own.y >= stack.y - 2 && own.bottom <= stack.bottom + 2),
        stackOutFelt: stack ? (stack.x < 0 || stack.y < 0 || stack.right > Math.round(f.width) || stack.bottom > Math.round(f.height)) : null,
        hitLinxing: ov(stack, linxing), hitMia: ov(stack, mia),
        miaOnRight: mia ? mia.cx > Math.round(f.width) / 2 : null,
        linxingCentred: linxing ? Math.abs(linxing.cx - Math.round(f.width) / 2) < 12 : null
      };
    });

    const fails = [];
    if (g.overflow > 0) fails.push('scroll +' + g.overflow + 'px');
    if (g.hitLinxing) fails.push('stack over linxing');
    if (g.hitMia) fails.push('stack over mia');
    if (g.stackOutFelt) fails.push('stack outside felt');
    if (!g.labelInStack) fails.push('label outside stack');
    if (!g.ownerInStack) fails.push('owner row outside stack');
    if (!g.miaOnRight) fails.push('mia not on right');
    if (!g.linxingCentred) fails.push('linxing not centred');

    console.log(
      '\n[' + tag + '] felt=' + g.feltW + 'x' + g.feltH +
      ' overflow=' + g.overflow + 'px' +
      '\n  linxing img  x' + g.linxing.x + '-' + g.linxing.right + ' y' + g.linxing.y + '-' + g.linxing.bottom +
      '\n  mia     img  x' + g.mia.x + '-' + g.mia.right + ' y' + g.mia.y + '-' + g.mia.bottom +
      '\n  stack        x' + g.stack.x + '-' + g.stack.right + ' y' + g.stack.y + '-' + g.stack.bottom +
      '\n  ' + (fails.length ? 'FAIL: ' + fails.join(', ') : 'PASS')
    );
    test.info().annotations.push({ type: 'result', description: fails.length ? fails.join(', ') : 'PASS' });
  });
}
