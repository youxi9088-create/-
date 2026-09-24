import { test, expect } from '@playwright/test';
test('first player path exposes real sequential NPC turns instead of an immediate scripted reset', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('Tab'); await expect(page.getByRole('link', { name: '跳到主要内容' })).toBeFocused();
  await page.screenshot({ path: 'test-results/stage-two-home.png', fullPage: true });
  await page.getByRole('button', { name: /进入今晚牌局/ }).click();
  await expect(page.locator('.entry-cinematic video')).toHaveCount(2);
  await page.getByRole('button', { name: '跳过入场' }).click();
  await expect(page.getByText('叫分决定地主')).toBeVisible(); await page.getByRole('button', { name: '叫 3 分' }).click();
  await expect(page.locator('video.action-video')).toHaveCount(0);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.screenshot({ path: 'test-results/first-loop-table.png', fullPage: true });
  await expect.poll(() => page.locator('.hand').evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('.pal-avatar')).toHaveCount(2);
  await expect(page.locator('.pal-standee.cutout .layer-base')).toHaveCount(2);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: '提示' }).click(); await page.getByRole('button', { name: '出牌' }).click();
  await expect(page.getByText('林星的回合')).toBeVisible(); await expect(page.getByText('林星正在思考…')).toBeVisible();
  await expect(page.getByText('米娅的回合')).toBeVisible({ timeout: 2500 });
  await expect(page.getByText('你的回合', { exact: true })).toBeVisible({ timeout: 2500 });
  await expect(page.locator('.event-feed')).toContainText('林星');
  await expect(page.locator('.event-feed')).toContainText('米娅');
  await expect(page.locator('video.action-video')).toHaveCount(1);
  await page.getByRole('button', { name: '提示' }).click();
  if (await page.locator('.card.selected').count()) await page.getByRole('button', { name: '出牌' }).click();
  else await page.getByRole('button', { name: '不出' }).click();
  await expect(page.getByText('林星的回合')).toBeVisible({ timeout: 1200 });
});

test('browser main loop reaches live dress-up settlement and a collected photo card', async ({ page }) => {
  await page.addInitScript(() => { window.__DRESSBATTLE_NPC_DELAY = 20; window.__DRESSBATTLE_SEED = 1; });
  await page.goto('/'); await page.getByRole('button', { name: /进入今晚牌局/ }).click();
  await page.getByRole('button', { name: '跳过入场' }).click();
  await page.getByRole('button', { name: '叫 3 分' }).click();
  for (let step = 0; step < 90; step += 1) {
    if (await page.getByRole('button', { name: '查看变装演出' }).isVisible()) break;
    if (await page.getByRole('button', { name: '提示' }).isVisible()) {
      await page.locator('#toast').evaluate((node) => { node.textContent = ''; });
      await page.getByRole('button', { name: '提示' }).click();
      await expect(page.locator('#toast')).toContainText(/已标出|当前没有/);
      if ((await page.locator('#toast').innerText()).includes('已标出')) {
        await expect(page.locator('.card.selected').first()).toBeVisible();
        await page.getByRole('button', { name: '出牌' }).click();
      } else {
        await page.getByRole('button', { name: '不出' }).click();
      }
    }
    await page.waitForTimeout(35);
  }
  await expect(page.getByRole('button', { name: '查看变装演出' })).toBeVisible();
  await expect(page.getByText('本局已结算')).toBeVisible();
  await page.getByRole('button', { name: '查看变装演出' }).click();
  const stage = page.locator('.dressup-stage');
  await expect(stage).toBeVisible();
  const perfVideo = page.locator('video.settlement-action-video');
  await expect(perfVideo).toBeVisible();
  await expect(perfVideo.locator('source')).toHaveAttribute('src', /linxing-A05-lose-v1\.webm$/);
  await page.screenshot({ path: 'test-results/settlement-video-performance.png', fullPage: true });
  await expect(perfVideo).toBeHidden({ timeout: 20000 });
  const figure = page.locator('.dressup-figure');
  await expect(figure).toBeVisible();
  await expect(figure.locator('.band')).toHaveCount(3);
  await expect(figure.locator('.layer-base')).toHaveAttribute('src', /linxing-v1\.png$/);
  await expect(figure.locator('.band-1')).toHaveAttribute('src', /linxing-starry-gown\.jpg$/);
  await expect.poll(() => stage.evaluate((node) => node.clientWidth)).toBeGreaterThan(700);
  await page.screenshot({ path: 'test-results/settlement-dressup-performance.png', fullPage: true });
  await page.getByRole('button', { name: '揭晓写真卡' }).click();
  const reveal = page.locator('.photo-card-reveal');
  await expect(reveal).toBeVisible();
  await expect(reveal.locator('.pcard-art')).toBeVisible();
  await expect(reveal.locator('.pcard-serial')).toContainText('No.001');
  await page.screenshot({ path: 'test-results/settlement-photo-reveal.png', fullPage: true });
  await page.getByRole('button', { name: '前往写真馆' }).click();
  await page.getByRole('button', { name: '打开写真馆' }).click();
  await expect(page).toHaveURL(/#\/gallery$/);
  await expect(page.locator('.collection-progress b')).toContainText('1 / 6');
  await expect(page.locator('.pcard')).toHaveCount(6);
  await expect(page.locator('.pcard.locked')).toHaveCount(5);
  await expect(page.locator('.pcard:not(.locked)')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/gallery-first-card.png', fullPage: true });
  await page.locator('.pcard:not(.locked)').click();
  await expect(page.locator('.card-detail')).toBeVisible();
  await expect(page.locator('.detail-info')).toContainText('星夜礼服');
  await expect(page.locator('.detail-info')).toContainText('月光步');
  await page.screenshot({ path: 'test-results/gallery-card-detail.png', fullPage: true });
});

test('mock workshop is traceable and policy gates unsafe requests', async ({ page }) => {
  await page.goto('/'); await page.getByRole('link', { name: '牌友工坊' }).click();
  await expect(page).toHaveURL(/#\/workshop$/);
  await page.getByLabel('描述你的成年虚构牌友').fill('一位复古优雅的成年虚构舞台魔术师，喜欢蓝紫色灯光');
  await page.getByRole('button', { name: /生成 Mock 候选/ }).click();
  await expect(page.locator('.candidate').filter({ hasText: 'DEGRADED_READY' })).toBeVisible(); await page.getByRole('button', { name: '确认建档' }).click();
  await page.screenshot({ path: 'test-results/stage-two-workshop.png', fullPage: true });
  await expect(page.locator('#toast')).toContainText('已建档');
  await page.reload(); await expect(page.locator('.candidate').filter({ hasText: 'DEGRADED_READY' })).toBeVisible();
  await page.getByLabel('描述你的成年虚构牌友').fill('名人同款舞台造型'); await page.getByRole('button', { name: /生成 Mock 候选/ }).click();
  await expect(page.locator('#toast')).toContainText('PL-7'); await expect(page.locator('#prompt-error')).toContainText('PL-7'); await expect(page.getByLabel('描述你的成年虚构牌友')).toBeFocused();
});

test('a direct table reload restores the authoritative game snapshot', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: /进入今晚牌局/ }).click();
  await page.getByRole('button', { name: '跳过入场' }).click();
  await expect(page.getByText('叫分决定地主')).toBeVisible(); await page.reload();
  await expect(page.getByText('叫分决定地主')).toBeVisible(); await expect(page.getByText('牌桌还没开局')).toHaveCount(0);
});
