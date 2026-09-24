import { test, expect } from '@playwright/test';

/** Walks the guided first loop until the table is in PLAYING state with the player on turn. */
async function openTable(page) {
  await page.addInitScript(() => { window.__DRESSBATTLE_NPC_DELAY = 20; window.__DRESSBATTLE_SEED = 1; });
  await page.goto('/');
  await page.getByRole('button', { name: /进入今晚牌局/ }).click();
  await page.getByRole('button', { name: '跳过入场' }).click();
  await page.getByRole('button', { name: '叫 3 分' }).click();
  await expect(page.locator('.table-page')).toBeVisible();
}

test('table layout fits the viewport without vertical overflow', async ({ page }) => {
  await openTable(page);
  // 760px is the documented floor: below it the felt keeps its 360px minimum and the page
  // scrolls deliberately instead of crushing the table.
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1440, height: 800 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    expect(overflow, `viewport ${viewport.width}×${viewport.height} should not scroll vertically`).toBeLessThanOrEqual(1);
  }
});

test('the felt never collapses below its readable minimum on short viewports', async ({ page }) => {
  await openTable(page);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.waitForTimeout(150);
  const felt = await page.locator('.table-felt').evaluate((node) => Math.round(node.getBoundingClientRect().height));
  // 300px is the short-viewport floor: the seats shrink via @media (max-height:780px), so the
  // felt may be shorter there than the 360px used on tall screens.
  expect(felt).toBeGreaterThanOrEqual(300);
  // 1280×720 is the smallest supported size and must still be scroll-free.
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('the hand scrolls as one reachable row and every card can be clicked', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openTable(page);
  // The row scrolls rather than clipping: with justify-content:flex-start nothing is stolen
  // off the left edge the way an overflowing centred flex row would do.
  await expect.poll(() => page.locator('.hand').evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  const hand = await page.locator('.hand').evaluate((node) => {
    const cards = [...node.querySelectorAll('.card')];
    return { count: cards.length, scrollLeft: node.scrollLeft, firstLeft: cards[0].getBoundingClientRect().left };
  });
  // 17 dealt + 3 bottom cards, because bidding 3 makes the player the landlord.
  expect(hand.count).toBe(20);
  expect(hand.scrollLeft).toBe(0);
  // Each card answers its own click — a negative-margin fan must not let a neighbour swallow it.
  for (const index of [0, 1, 10, hand.count - 1]) {
    await page.locator('.hand').evaluate((node) => { node.scrollLeft = 0; });
    const target = page.locator('.hand .card').nth(index);
    await target.scrollIntoViewIfNeeded();
    await target.click();
    await expect(target).toHaveAttribute('aria-pressed', 'true');
    await target.click();
    await expect(target).toHaveAttribute('aria-pressed', 'false');
  }
});

test('player can change NPC pacing and it survives a reload', async ({ page }) => {
  await openTable(page);
  await expect(page.locator('#speedLabel')).toHaveText('标准');
  await page.locator('[data-action="toggle-speed"]').click();
  await expect(page.locator('#speedLabel')).toHaveText('慢速');
  await page.locator('[data-action="toggle-speed"]').click();
  await expect(page.locator('#speedLabel')).toHaveText('快速');
  await page.reload();
  await expect(page.locator('#speedLabel')).toHaveText('快速');
});

test('audio toggle reports its state and is exposed to assistive tech', async ({ page }) => {
  await openTable(page);
  const toggle = page.locator('[data-action="toggle-sfx"]');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#sfxLabel')).toHaveText('音效关');
});

test('settlement performance can be skipped straight to the photo reveal', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openTable(page);
  for (let step = 0; step < 90; step += 1) {
    if (await page.getByRole('button', { name: '查看变装演出' }).isVisible()) break;
    if (await page.getByRole('button', { name: '提示' }).isVisible()) {
      await page.locator('#toast').evaluate((node) => { node.textContent = ''; });
      await page.getByRole('button', { name: '提示' }).click();
      await expect(page.locator('#toast')).toContainText(/已标出|当前没有/);
      if ((await page.locator('#toast').innerText()).includes('已标出')) await page.getByRole('button', { name: '出牌' }).click();
      else await page.getByRole('button', { name: '不出' }).click();
    }
    await page.waitForTimeout(35);
  }
  await page.getByRole('button', { name: '查看变装演出' }).click();
  await expect(page.locator('.dressup-stage')).toBeVisible();
  await page.getByRole('button', { name: '跳过演出 →' }).click();
  // Skipping must land on the terminal stage without walking every intermediate one.
  await expect(page.getByRole('button', { name: '再开一局' })).toBeVisible();
  await expect(page.getByRole('button', { name: '跳过演出 →' })).toHaveCount(0);
  // Read the unlocked total from the gallery itself: the server is shared across specs.
  await page.getByRole('button', { name: '打开写真馆' }).click();
  await expect(page.locator('.collection-progress b')).toContainText(/[1-6] \/ 6/);
  await expect(page.locator('.pcard:not(.locked)').first()).toBeVisible();
});

test('a filtered gallery of four or fewer cards switches to the featured layout', async ({ page }) => {
  await page.addInitScript(() => { window.__DRESSBATTLE_NPC_DELAY = 20; window.__DRESSBATTLE_SEED = 1; });
  await page.goto('/');
  await page.getByRole('link', { name: '写真馆' }).click();
  const grid = page.locator('.gallery-grid');
  await expect(grid).not.toHaveClass(/solo/);
  await expect(grid.locator('.pcard')).toHaveCount(6);
  // A per-pal tab halves the pool to three cards, which is what the featured layout is for.
  await page.getByRole('button', { name: '林星', exact: true }).click();
  await expect(grid).toHaveClass(/solo/);
  await expect(grid.locator('.pcard')).toHaveCount(3);
  await expect(grid.locator('.pcard').first()).toBeVisible();
});

// Kept last on purpose: this test plays a card, which mutates the in-memory game the server
// shares across specs in the same file. Running it earlier shortened the hand for the
// hit-target test above and made that assertion order-dependent.
test('a played hand lands between its owner and the table centre, clear of both seats', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openTable(page);
  // Lead with one card so a played stack exists, then wait for the NPC replies to resolve.
  // Measuring the instant the stack first appears caught it mid-transition and produced a
  // spurious overlap; waiting for mia's reply pins the final owner class and felt height.
  await page.locator('.hand .card').first().click();
  await page.getByRole('button', { name: '出牌' }).click();
  await page.waitForFunction(
    () => document.querySelector('.played-stack')?.classList.contains('from-pal-mia'),
    null,
    { timeout: 15_000 }
  );
  await page.waitForTimeout(250);

  const geo = await page.evaluate(() => {
    const felt = document.querySelector('.table-felt').getBoundingClientRect();
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - felt.left, right: r.right - felt.left, y: r.top - felt.top, bottom: r.bottom - felt.top, w: r.width };
    };
    return {
      feltW: Math.round(felt.width),
      stack: box('.played-stack'),
      linxing: box('.opponent.top .pal-standee'),
      mia: box('.opponent.right .pal-standee'),
      // label / owner row must sit inside the stack box, not float away from it
      label: box('.played-stack > p'),
      owner: box('.played-stack > b')
    };
  });

  // The stack must not overlap either character. This is the regression guard for the bug
  // where mia's cards were anchored at a fixed 63% of the felt and landed on linxing.
  const overlaps = (a, b) => a && b && a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom;
  expect(overlaps(geo.stack, geo.linxing), 'played stack must not overlap linxing').toBe(false);
  expect(overlaps(geo.stack, geo.mia), 'played stack must not overlap mia').toBe(false);

  // Both label rows must stay within the stack's own box so the three parts read as one unit.
  expect(geo.label.y, 'type label must sit inside the stack').toBeGreaterThanOrEqual(geo.stack.y - 2);
  expect(geo.label.bottom, 'type label must sit inside the stack').toBeLessThanOrEqual(geo.stack.bottom + 2);
  expect(geo.owner.bottom, 'owner row must sit inside the stack').toBeLessThanOrEqual(geo.stack.bottom + 2);
});
