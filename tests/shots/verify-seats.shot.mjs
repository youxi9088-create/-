import { test } from '@playwright/test';

// Verifies the "round 4" shared table coordinate system for every player. A stack only
// exists once somebody has led, so the harness bids, plays one card as the player, and
// then cycles NPC turns until a PAL_ACTION has produced a combo too.
const VIEWPORTS = [
  { w: 1080, h: 620, tag: '1080x620' },
  { w: 1440, h: 900, tag: '1440x900' }
];

async function readGeo(page) {
  return page.evaluate(() => {
    const felt = document.querySelector('.table-felt');
    const f = felt.getBoundingClientRect();
    const rel = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.left - f.left), y: Math.round(r.top - f.top), w: Math.round(r.width), h: Math.round(r.height), cx: Math.round(r.left - f.left + r.width / 2), cy: Math.round(r.top - f.top + r.height / 2), bottom: Math.round(r.bottom - f.top), right: Math.round(r.right - f.left) };
    };
    const q = (s) => rel(document.querySelector(s));
    const overlaps = (a, b) => Boolean(a && b && a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom);
    const linxing = q('.opponent.top .pal-standee');
    const mia = q('.opponent.right .pal-standee');
    const stack = q('.played-stack');
    const lab = q('.played-stack > b');
    return {
      felt: { w: Math.round(f.width), h: Math.round(f.height) },
      scroll: document.documentElement.scrollHeight - window.innerHeight,
      owner: document.querySelector('.played-stack')?.className.match(/from-([\w-]+)/)?.[1] ?? null,
      linxing, mia, stack, lab,
      bubble: q('.pal-bubble'),
      stackHitsLinxing: overlaps(stack, linxing),
      stackHitsMia: overlaps(stack, mia),
      labelInsideStack: Boolean(stack && lab && lab.y >= stack.y && lab.bottom <= stack.bottom),
      stackOutsideFelt: stack ? (stack.x < 0 || stack.y < 0 || stack.right > Math.round(f.width) || stack.bottom > Math.round(f.height)) : null,
      stackZ: stack ? getComputedStyle(document.querySelector('.played-stack')).zIndex : null,
      seatZ: linxing ? getComputedStyle(document.querySelector('.opponent.top')).zIndex : null
    };
  });
}

function report(tag, g) {
  console.log(`\n[${tag}] felt=${g.felt.w}x${g.felt.h} scrollOverflow=${g.scroll}px owner=${g.owner}`);
  if (g.linxing) console.log(`  linxing standee x${g.linxing.x}-${g.linxing.right} y${g.linxing.y}-${g.linxing.bottom}`);
  if (g.mia) console.log(`  mia     standee x${g.mia.x}-${g.mia.right} y${g.mia.y}-${g.mia.bottom}`);
  if (g.stack) console.log(`  played  stack   x${g.stack.x}-${g.stack.right} y${g.stack.y}-${g.stack.bottom} (cx${g.stack.cx} cy${g.stack.cy})`);
  if (g.bubble) console.log(`  bubble          x${g.bubble.x}-${g.bubble.right} y${g.bubble.y}-${g.bubble.bottom}`);
  console.log(`  overlaps: linxing=${g.stackHitsLinxing} mia=${g.stackHitsMia} outsideFelt=${g.stackOutsideFelt} labelInside=${g.labelInsideStack}`);
  console.log(`  z-index: stack=${g.stackZ} seat=${g.seatZ}`);
}

for (const { w, h, tag } of VIEWPORTS) {
  test(`played-card anchoring @ ${tag}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/#/home');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForLoadState('networkidle');
    await page.locator('[data-action="start"]').first().click();
    await page.waitForSelector('.table-felt', { timeout: 20_000 });
    const skip = page.locator('[data-action="close-entry"]');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await page.waitForTimeout(600);

    await page.locator('[data-action="bid"]').click().catch(() => {});
    await page.waitForTimeout(1200);

    // Play one card so a player-owned stack exists, then wait out the NPC replies.
    await page.locator('.hand .card').first().click();
    await page.locator('[data-action="play"]').click();
    await page.waitForTimeout(6000);

    const g = await readGeo(page);
    report(tag, g);
    await page.screenshot({ path: `docs/ui-shots/fix-seats-${tag}.png` });
  });
}
