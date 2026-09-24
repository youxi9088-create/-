import { test } from '@playwright/test';

// The seat/stack anchoring is only meaningful if the felt is tall enough to hold the
// seats in the first place. This dumps the felt height derivation term by term.
const VIEWPORTS = [
  { w: 1080, h: 620, tag: '1080x620' },
  { w: 1280, h: 720, tag: '1280x720' },
  { w: 1440, h: 900, tag: '1440x900' }
];

for (const { w, h, tag } of VIEWPORTS) {
  test(`felt derivation @ ${tag}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/#/home');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForLoadState('networkidle');
    await page.locator('[data-action="start"]').first().click();
    await page.waitForSelector('.table-felt', { timeout: 20_000 });
    const skip = page.locator('[data-action="close-entry"]');
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await page.waitForTimeout(700);

    const d = await page.evaluate(() => {
      const hgt = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null);
      const felt = document.querySelector('.table-felt');
      const cs = getComputedStyle(felt);
      const rows = Array.from(document.querySelectorAll('.table-page > *')).map((el) => el.className + '=' + hgt(el));
      return {
        viewportH: window.innerHeight,
        scrollH: document.documentElement.scrollHeight,
        overflow: document.documentElement.scrollHeight - window.innerHeight,
        feltComputed: cs.height,
        feltActual: hgt(felt),
        feltMinHeight: cs.minHeight,
        boardH: hgt(document.querySelector('.table-board')),
        handH: hgt(document.querySelector('.hand')),
        handWrapH: hgt(document.querySelector('.hand-wrap')),
        topbarH: hgt(document.querySelector('.topbar')),
        tablePageH: hgt(document.querySelector('.table-page')),
        gridRows: rows,
        standeeH: hgt(document.querySelector('.opponent.top .pal-standee'))
      };
    });
    console.log('\n[' + tag + '] viewportH=' + d.viewportH + ' scrollH=' + d.scrollH + ' overflow=' + d.overflow + 'px');
    console.log('  felt: computed=' + d.feltComputed + ' actual=' + d.feltActual + ' minHeight=' + d.feltMinHeight);
    console.log('  topbar=' + d.topbarH + ' tablePage=' + d.tablePageH + ' board=' + d.boardH + ' handWrap=' + d.handWrapH + ' hand=' + d.handH);
    console.log('  standeeH=' + d.standeeH + '  gridRows=' + d.gridRows.join(' | '));
  });
}
