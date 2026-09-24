# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-hardening.spec.mjs >> table layout fits the viewport without vertical overflow
- Location: tests\e2e\ui-hardening.spec.mjs:13:1

# Error details

```
Error: viewport 1440×900 should not scroll vertically

expect(received).toBeLessThanOrEqual(expected)

Expected: <= 1
Received:    12
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "跳到主要内容" [ref=e2] [cursor=pointer]:
    - /url: "#app"
  - banner [ref=e3]:
    - link "返回大厅" [ref=e4] [cursor=pointer]:
      - /url: "#/home"
      - text: ♠ 换装斗地主
      - emphasis [ref=e5]: DRESSBATTLE
    - navigation "主导航" [ref=e6]:
      - link "大厅" [ref=e7] [cursor=pointer]:
        - /url: "#/home"
      - link "牌桌" [ref=e8] [cursor=pointer]:
        - /url: "#/table"
      - link "牌友工坊" [ref=e9] [cursor=pointer]:
        - /url: "#/workshop"
      - link "写真馆" [ref=e10] [cursor=pointer]:
        - /url: "#/gallery"
      - link "检查器" [ref=e11] [cursor=pointer]:
        - /url: "#/inspector"
    - group "牌局偏好" [ref=e12]:
      - button "切换牌友思考速度" [ref=e13] [cursor=pointer]:
        - generic [ref=e14]: 标准
        - generic [aria-hidden] [ref=e15]: ⏱
      - button "音效开关" [pressed] [ref=e16] [cursor=pointer]:
        - generic [ref=e17]: 音效开
        - generic [aria-hidden] [ref=e18]: ♪
    - generic [ref=e19]: ◇ 12 Token
  - main [ref=e20]:
    - generic [ref=e21]:
      - complementary [ref=e22]:
        - generic [ref=e23]: 引导牌局 · 第 1 局
        - heading "你的回合" [level=1] [ref=e24]
        - paragraph [ref=e25]: 现在由你领出一手牌；“提示”会标出可出的合法牌型。
      - generic [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]: 第 1 局 / BO3
            - generic [ref=e30]: 地主 ×3
            - generic [ref=e31]: 轮到你
          - generic [ref=e32]:
            - text: DRESSBATTLE
            - generic [ref=e33]: MOONLIT TABLE
          - generic [ref=e34]:
            - generic [ref=e35]:
              - img "林星，成年虚构 AI 牌友，星夜礼服" [ref=e36]
              - generic [ref=e37]:
                - strong [ref=e38]: 林星
                - generic [ref=e39]: AI 虚构成年
            - generic [ref=e40]:
              - generic [ref=e41]: 农民
              - generic [ref=e42]: 17 张
            - generic [ref=e43]: ▣ ▣ ▣
          - generic [ref=e44]:
            - generic [ref=e45]:
              - img "米娅，成年虚构 AI 牌友，薄荷舞台装" [ref=e46]
              - generic [ref=e47]:
                - strong [ref=e48]: 米娅
                - generic [ref=e49]: AI 虚构成年
            - generic [ref=e50]:
              - generic [ref=e51]: 农民
              - generic [ref=e52]: 17 张
            - generic [ref=e53]: ▣ ▣ ▣
          - status:
            - generic: 等待你领出第一手牌
            - generic: 轮到你领出
          - generic [ref=e54]: 地主 · 20 张
        - generic [ref=e55]:
          - generic [ref=e56]:
            - generic [ref=e57]: 你的手牌 20
            - generic [ref=e58]:
              - button "提示" [ref=e59] [cursor=pointer]
              - button "出牌" [ref=e60] [cursor=pointer]
          - generic "你的手牌" [ref=e61]:
            - button "3 ♠" [ref=e62] [cursor=pointer]:
              - generic [ref=e63]: "3"
              - text: ♠
            - button "3 ♣" [ref=e64] [cursor=pointer]:
              - generic [ref=e65]: "3"
              - text: ♣
            - button "4 ♠" [ref=e66] [cursor=pointer]:
              - generic [ref=e67]: "4"
              - text: ♠
            - button "5 ♥" [ref=e68] [cursor=pointer]:
              - generic [ref=e69]: "5"
              - text: ♥
            - button "5 ♠" [ref=e70] [cursor=pointer]:
              - generic [ref=e71]: "5"
              - text: ♠
            - button "6 ♣" [ref=e72] [cursor=pointer]:
              - generic [ref=e73]: "6"
              - text: ♣
            - button "9 ♣" [ref=e74] [cursor=pointer]:
              - generic [ref=e75]: "9"
              - text: ♣
            - button "9 ♦" [ref=e76] [cursor=pointer]:
              - generic [ref=e77]: "9"
              - text: ♦
            - button "9 ♠" [ref=e78] [cursor=pointer]:
              - generic [ref=e79]: "9"
              - text: ♠
            - button "10 ♠" [ref=e80] [cursor=pointer]:
              - generic [ref=e81]: "10"
              - text: ♠
            - button "J ♣" [ref=e82] [cursor=pointer]:
              - generic [ref=e83]: J
              - text: ♣
            - button "J ♠" [ref=e84] [cursor=pointer]:
              - generic [ref=e85]: J
              - text: ♠
            - button "J ♥" [ref=e86] [cursor=pointer]:
              - generic [ref=e87]: J
              - text: ♥
            - button "J ♦" [ref=e88] [cursor=pointer]:
              - generic [ref=e89]: J
              - text: ♦
            - button "Q ♣" [ref=e90] [cursor=pointer]:
              - generic [ref=e91]: Q
              - text: ♣
            - button "K ♠" [ref=e92] [cursor=pointer]:
              - generic [ref=e93]: K
              - text: ♠
            - button "K ♣" [ref=e94] [cursor=pointer]:
              - generic [ref=e95]: K
              - text: ♣
            - button "A ♦" [ref=e96] [cursor=pointer]:
              - generic [ref=e97]: A
              - text: ♦
            - button "2 ♠" [ref=e98] [cursor=pointer]:
              - generic [ref=e99]: "2"
              - text: ♠
            - button "SJ" [ref=e100] [cursor=pointer]
      - complementary [ref=e102]:
        - heading "牌局记录" [level=2] [ref=e103]
        - paragraph [ref=e105]: 叫 3 分，领取底牌：3♣ 9♠ J♦。地主先出。
        - paragraph [ref=e107]: 牌局已创建，等待叫分。
  - status: 引导局已创建：先叫 3 分。
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /** Walks the guided first loop until the table is in PLAYING state with the player on turn. */
  4   | async function openTable(page) {
  5   |   await page.addInitScript(() => { window.__DRESSBATTLE_NPC_DELAY = 20; window.__DRESSBATTLE_SEED = 1; });
  6   |   await page.goto('/');
  7   |   await page.getByRole('button', { name: /进入今晚牌局/ }).click();
  8   |   await page.getByRole('button', { name: '跳过入场' }).click();
  9   |   await page.getByRole('button', { name: '叫 3 分' }).click();
  10  |   await expect(page.locator('.table-page')).toBeVisible();
  11  | }
  12  | 
  13  | test('table layout fits the viewport without vertical overflow', async ({ page }) => {
  14  |   await openTable(page);
  15  |   // 760px is the documented floor: below it the felt keeps its 360px minimum and the page
  16  |   // scrolls deliberately instead of crushing the table.
  17  |   for (const viewport of [{ width: 1440, height: 900 }, { width: 1440, height: 800 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
  18  |     await page.setViewportSize(viewport);
  19  |     await page.waitForTimeout(150);
  20  |     const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
> 21  |     expect(overflow, `viewport ${viewport.width}×${viewport.height} should not scroll vertically`).toBeLessThanOrEqual(1);
      |                                                                                                    ^ Error: viewport 1440×900 should not scroll vertically
  22  |   }
  23  | });
  24  | 
  25  | test('the felt never collapses below its readable minimum on short viewports', async ({ page }) => {
  26  |   await openTable(page);
  27  |   await page.setViewportSize({ width: 1280, height: 720 });
  28  |   await page.waitForTimeout(150);
  29  |   const felt = await page.locator('.table-felt').evaluate((node) => Math.round(node.getBoundingClientRect().height));
  30  |   expect(felt).toBeGreaterThanOrEqual(360);
  31  | });
  32  | 
  33  | test('the hand scrolls as one reachable row and every card can be clicked', async ({ page }) => {
  34  |   await page.setViewportSize({ width: 1280, height: 720 });
  35  |   await openTable(page);
  36  |   // The row scrolls rather than clipping: with justify-content:flex-start nothing is stolen
  37  |   // off the left edge the way an overflowing centred flex row would do.
  38  |   await expect.poll(() => page.locator('.hand').evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  39  |   const hand = await page.locator('.hand').evaluate((node) => {
  40  |     const cards = [...node.querySelectorAll('.card')];
  41  |     return { count: cards.length, scrollLeft: node.scrollLeft, firstLeft: cards[0].getBoundingClientRect().left };
  42  |   });
  43  |   // 17 dealt + 3 bottom cards, because bidding 3 makes the player the landlord.
  44  |   expect(hand.count).toBe(20);
  45  |   expect(hand.scrollLeft).toBe(0);
  46  |   // Each card answers its own click — a negative-margin fan must not let a neighbour swallow it.
  47  |   for (const index of [0, 1, 10, hand.count - 1]) {
  48  |     await page.locator('.hand').evaluate((node) => { node.scrollLeft = 0; });
  49  |     const target = page.locator('.hand .card').nth(index);
  50  |     await target.scrollIntoViewIfNeeded();
  51  |     await target.click();
  52  |     await expect(target).toHaveAttribute('aria-pressed', 'true');
  53  |     await target.click();
  54  |     await expect(target).toHaveAttribute('aria-pressed', 'false');
  55  |   }
  56  | });
  57  | 
  58  | test('player can change NPC pacing and it survives a reload', async ({ page }) => {
  59  |   await openTable(page);
  60  |   await expect(page.locator('#speedLabel')).toHaveText('标准');
  61  |   await page.locator('[data-action="toggle-speed"]').click();
  62  |   await expect(page.locator('#speedLabel')).toHaveText('慢速');
  63  |   await page.locator('[data-action="toggle-speed"]').click();
  64  |   await expect(page.locator('#speedLabel')).toHaveText('快速');
  65  |   await page.reload();
  66  |   await expect(page.locator('#speedLabel')).toHaveText('快速');
  67  | });
  68  | 
  69  | test('audio toggle reports its state and is exposed to assistive tech', async ({ page }) => {
  70  |   await openTable(page);
  71  |   const toggle = page.locator('[data-action="toggle-sfx"]');
  72  |   await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  73  |   await toggle.click();
  74  |   await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  75  |   await expect(page.locator('#sfxLabel')).toHaveText('音效关');
  76  | });
  77  | 
  78  | test('settlement performance can be skipped straight to the photo reveal', async ({ page }) => {
  79  |   await page.setViewportSize({ width: 1440, height: 900 });
  80  |   await openTable(page);
  81  |   for (let step = 0; step < 90; step += 1) {
  82  |     if (await page.getByRole('button', { name: '查看变装演出' }).isVisible()) break;
  83  |     if (await page.getByRole('button', { name: '提示' }).isVisible()) {
  84  |       await page.locator('#toast').evaluate((node) => { node.textContent = ''; });
  85  |       await page.getByRole('button', { name: '提示' }).click();
  86  |       await expect(page.locator('#toast')).toContainText(/已标出|当前没有/);
  87  |       if ((await page.locator('#toast').innerText()).includes('已标出')) await page.getByRole('button', { name: '出牌' }).click();
  88  |       else await page.getByRole('button', { name: '不出' }).click();
  89  |     }
  90  |     await page.waitForTimeout(35);
  91  |   }
  92  |   await page.getByRole('button', { name: '查看变装演出' }).click();
  93  |   await expect(page.locator('.dressup-stage')).toBeVisible();
  94  |   await page.getByRole('button', { name: '跳过演出 →' }).click();
  95  |   // Skipping must land on the terminal stage without walking every intermediate one.
  96  |   await expect(page.getByRole('button', { name: '再开一局' })).toBeVisible();
  97  |   await expect(page.getByRole('button', { name: '跳过演出 →' })).toHaveCount(0);
  98  |   // Read the unlocked total from the gallery itself: the server is shared across specs.
  99  |   await page.getByRole('button', { name: '打开写真馆' }).click();
  100 |   await expect(page.locator('.collection-progress b')).toContainText(/[1-6] \/ 6/);
  101 |   await expect(page.locator('.pcard:not(.locked)').first()).toBeVisible();
  102 | });
  103 | 
  104 | test('a filtered gallery of four or fewer cards switches to the featured layout', async ({ page }) => {
  105 |   await page.addInitScript(() => { window.__DRESSBATTLE_NPC_DELAY = 20; window.__DRESSBATTLE_SEED = 1; });
  106 |   await page.goto('/');
  107 |   await page.getByRole('link', { name: '写真馆' }).click();
  108 |   const grid = page.locator('.gallery-grid');
  109 |   await expect(grid).not.toHaveClass(/solo/);
  110 |   await expect(grid.locator('.pcard')).toHaveCount(6);
  111 |   // A per-pal tab halves the pool to three cards, which is what the featured layout is for.
  112 |   await page.getByRole('button', { name: '林星', exact: true }).click();
  113 |   await expect(grid).toHaveClass(/solo/);
  114 |   await expect(grid.locator('.pcard')).toHaveCount(3);
  115 |   await expect(grid.locator('.pcard').first()).toBeVisible();
  116 | });
  117 | 
```