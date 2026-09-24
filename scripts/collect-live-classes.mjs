import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4300;
const server = spawn(process.execPath, ['apps/api/server.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => { window.__DRESSBATTLE_NPC_DELAY = 20; window.__DRESSBATTLE_SEED = 1; });

const seen = new Set();
const collect = async () => {
  const list = await page.evaluate(() => [...document.querySelectorAll('*')].flatMap((n) => [...n.classList]));
  list.forEach((c) => seen.add(c));
};

const base = `http://127.0.0.1:${PORT}`;
await page.goto(base); await collect();
for (const route of ['table', 'workshop', 'gallery', 'inspector']) {
  await page.goto(`${base}/#/${route}`); await page.waitForTimeout(350); await collect();
}

// Play through to settlement, capturing every stage. Restart from the lobby so the
// guided game is available regardless of what the route walk left behind.
await page.goto(base);
await page.waitForTimeout(300);
await page.getByRole('button', { name: /进入今晚牌局/ }).click();
await page.getByRole('button', { name: '跳过入场' }).click();
await page.getByRole('button', { name: '叫 3 分' }).click();
for (let i = 0; i < 130; i += 1) {
  if (await page.getByRole('button', { name: '查看变装演出' }).isVisible().catch(() => false)) break;
  const hint = page.getByRole('button', { name: '提示' });
  if (await hint.isVisible().catch(() => false)) {
    await page.locator('#toast').evaluate((n) => { n.textContent = ''; });
    await hint.click(); await page.waitForTimeout(30);
    const text = await page.locator('#toast').innerText();
    if (text.includes('已标出')) await page.getByRole('button', { name: '出牌' }).click().catch(() => {});
    else { const pass = page.getByRole('button', { name: '不出' }); if (await pass.isVisible().catch(() => false)) await pass.click().catch(() => {}); }
  }
  await page.waitForTimeout(35);
}
await page.getByRole('button', { name: '查看变装演出' }).click();
for (let i = 0; i < 4; i += 1) {
  await collect();
  const next = page.getByRole('button', { name: /揭晓写真卡|前往写真馆/ });
  if (await next.isVisible().catch(() => false)) { await next.click(); await page.waitForTimeout(450); }
}

// Gallery: default grid, solo grid, card detail, replay overlay.
await page.goto(`${base}/#/gallery`); await page.waitForTimeout(400); await collect();
const card = page.locator('.pcard:not(.locked)').first();
if (await card.isVisible().catch(() => false)) {
  await card.click(); await page.waitForTimeout(350); await collect();
  const replay = page.getByRole('button', { name: '回放换装演出' });
  if (await replay.isVisible().catch(() => false)) { await replay.click(); await page.waitForTimeout(350); await collect(); }
}
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
await page.getByRole('button', { name: '林星', exact: true }).click().catch(() => {});
await page.waitForTimeout(350); await collect();

await browser.close();
server.kill();
process.stdout.write(JSON.stringify([...seen].sort()));
