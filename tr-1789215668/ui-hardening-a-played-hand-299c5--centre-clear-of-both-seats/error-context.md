# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-hardening.spec.mjs >> a played hand lands between its owner and the table centre, clear of both seats
- Location: tests\e2e\ui-hardening.spec.mjs:126:1

# Error details

```
Error: played stack must not overlap linxing

expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
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
        - paragraph [ref=e25]: 桌面有待压制的牌型；可以出更大的同类牌，或选择“不出”。
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
              - generic "林星，成年虚构 AI 牌友，星夜礼服，出牌动作" [ref=e37]
              - generic [ref=e38]:
                - strong [ref=e39]: 林星
                - generic [ref=e40]: AI 虚构成年
            - generic [ref=e41]:
              - generic [ref=e42]: 农民
              - generic [ref=e43]: 16 张
            - generic [ref=e44]: ▣ ▣ ▣
            - paragraph [ref=e45]: 这张牌，交给夜色。
          - generic [ref=e46]:
            - generic [ref=e47]:
              - img "米娅，成年虚构 AI 牌友，薄荷舞台装" [ref=e48]
              - generic [ref=e49]:
                - strong [ref=e50]: 米娅
                - generic [ref=e51]: AI 虚构成年
            - generic [ref=e52]:
              - generic [ref=e53]: 农民
              - generic [ref=e54]: 16 张
            - generic [ref=e55]: ▣ ▣ ▣
            - paragraph [ref=e56]: 这手牌我来接。
          - status:
            - generic:
              - paragraph: 桌面牌型 · 单张
              - generic:
                - img "桌面牌 5♦":
                  - generic: "5"
                  - generic: ♦
              - generic: 米娅已出
            - generic: 轮到你 · 选择压制或不出
          - generic [ref=e57]: 地主 · 19 张
        - generic [ref=e58]:
          - generic [ref=e59]:
            - generic [ref=e60]: 你的手牌 19
            - generic [ref=e61]:
              - button "提示" [ref=e62] [cursor=pointer]
              - button "不出" [ref=e63] [cursor=pointer]
              - button "出牌" [ref=e64] [cursor=pointer]
          - generic "你的手牌" [ref=e65]:
            - button "3 ♣" [ref=e66] [cursor=pointer]:
              - generic [ref=e67]: "3"
              - text: ♣
            - button "4 ♠" [ref=e68] [cursor=pointer]:
              - generic [ref=e69]: "4"
              - text: ♠
            - button "5 ♥" [ref=e70] [cursor=pointer]:
              - generic [ref=e71]: "5"
              - text: ♥
            - button "5 ♠" [ref=e72] [cursor=pointer]:
              - generic [ref=e73]: "5"
              - text: ♠
            - button "6 ♣" [ref=e74] [cursor=pointer]:
              - generic [ref=e75]: "6"
              - text: ♣
            - button "9 ♣" [ref=e76] [cursor=pointer]:
              - generic [ref=e77]: "9"
              - text: ♣
            - button "9 ♦" [ref=e78] [cursor=pointer]:
              - generic [ref=e79]: "9"
              - text: ♦
            - button "9 ♠" [ref=e80] [cursor=pointer]:
              - generic [ref=e81]: "9"
              - text: ♠
            - button "10 ♠" [ref=e82] [cursor=pointer]:
              - generic [ref=e83]: "10"
              - text: ♠
            - button "J ♣" [ref=e84] [cursor=pointer]:
              - generic [ref=e85]: J
              - text: ♣
            - button "J ♠" [ref=e86] [cursor=pointer]:
              - generic [ref=e87]: J
              - text: ♠
            - button "J ♥" [ref=e88] [cursor=pointer]:
              - generic [ref=e89]: J
              - text: ♥
            - button "J ♦" [ref=e90] [cursor=pointer]:
              - generic [ref=e91]: J
              - text: ♦
            - button "Q ♣" [ref=e92] [cursor=pointer]:
              - generic [ref=e93]: Q
              - text: ♣
            - button "K ♠" [ref=e94] [cursor=pointer]:
              - generic [ref=e95]: K
              - text: ♠
            - button "K ♣" [ref=e96] [cursor=pointer]:
              - generic [ref=e97]: K
              - text: ♣
            - button "A ♦" [ref=e98] [cursor=pointer]:
              - generic [ref=e99]: A
              - text: ♦
            - button "2 ♠" [ref=e100] [cursor=pointer]:
              - generic [ref=e101]: "2"
              - text: ♠
            - button "SJ" [ref=e102] [cursor=pointer]
      - complementary [ref=e104]:
        - heading "牌局记录" [level=2] [ref=e105]
        - paragraph [ref=e107]: 米娅压制：5♦。这手牌我来接。
        - paragraph [ref=e109]: 林星压制：4♣。这张牌，交给夜色。
        - paragraph [ref=e111]: 你出牌：3♠。出得漂亮！
        - paragraph [ref=e113]: 叫 3 分，领取底牌：3♣ 9♠ J♦。地主先出。
  - status: 引导局已创建：先叫 3 分。
```

# Test source

```ts
  57  |     await expect(target).toHaveAttribute('aria-pressed', 'true');
  58  |     await target.click();
  59  |     await expect(target).toHaveAttribute('aria-pressed', 'false');
  60  |   }
  61  | });
  62  | 
  63  | test('player can change NPC pacing and it survives a reload', async ({ page }) => {
  64  |   await openTable(page);
  65  |   await expect(page.locator('#speedLabel')).toHaveText('标准');
  66  |   await page.locator('[data-action="toggle-speed"]').click();
  67  |   await expect(page.locator('#speedLabel')).toHaveText('慢速');
  68  |   await page.locator('[data-action="toggle-speed"]').click();
  69  |   await expect(page.locator('#speedLabel')).toHaveText('快速');
  70  |   await page.reload();
  71  |   await expect(page.locator('#speedLabel')).toHaveText('快速');
  72  | });
  73  | 
  74  | test('audio toggle reports its state and is exposed to assistive tech', async ({ page }) => {
  75  |   await openTable(page);
  76  |   const toggle = page.locator('[data-action="toggle-sfx"]');
  77  |   await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  78  |   await toggle.click();
  79  |   await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  80  |   await expect(page.locator('#sfxLabel')).toHaveText('音效关');
  81  | });
  82  | 
  83  | test('settlement performance can be skipped straight to the photo reveal', async ({ page }) => {
  84  |   await page.setViewportSize({ width: 1440, height: 900 });
  85  |   await openTable(page);
  86  |   for (let step = 0; step < 90; step += 1) {
  87  |     if (await page.getByRole('button', { name: '查看变装演出' }).isVisible()) break;
  88  |     if (await page.getByRole('button', { name: '提示' }).isVisible()) {
  89  |       await page.locator('#toast').evaluate((node) => { node.textContent = ''; });
  90  |       await page.getByRole('button', { name: '提示' }).click();
  91  |       await expect(page.locator('#toast')).toContainText(/已标出|当前没有/);
  92  |       if ((await page.locator('#toast').innerText()).includes('已标出')) await page.getByRole('button', { name: '出牌' }).click();
  93  |       else await page.getByRole('button', { name: '不出' }).click();
  94  |     }
  95  |     await page.waitForTimeout(35);
  96  |   }
  97  |   await page.getByRole('button', { name: '查看变装演出' }).click();
  98  |   await expect(page.locator('.dressup-stage')).toBeVisible();
  99  |   await page.getByRole('button', { name: '跳过演出 →' }).click();
  100 |   // Skipping must land on the terminal stage without walking every intermediate one.
  101 |   await expect(page.getByRole('button', { name: '再开一局' })).toBeVisible();
  102 |   await expect(page.getByRole('button', { name: '跳过演出 →' })).toHaveCount(0);
  103 |   // Read the unlocked total from the gallery itself: the server is shared across specs.
  104 |   await page.getByRole('button', { name: '打开写真馆' }).click();
  105 |   await expect(page.locator('.collection-progress b')).toContainText(/[1-6] \/ 6/);
  106 |   await expect(page.locator('.pcard:not(.locked)').first()).toBeVisible();
  107 | });
  108 | 
  109 | test('a filtered gallery of four or fewer cards switches to the featured layout', async ({ page }) => {
  110 |   await page.addInitScript(() => { window.__DRESSBATTLE_NPC_DELAY = 20; window.__DRESSBATTLE_SEED = 1; });
  111 |   await page.goto('/');
  112 |   await page.getByRole('link', { name: '写真馆' }).click();
  113 |   const grid = page.locator('.gallery-grid');
  114 |   await expect(grid).not.toHaveClass(/solo/);
  115 |   await expect(grid.locator('.pcard')).toHaveCount(6);
  116 |   // A per-pal tab halves the pool to three cards, which is what the featured layout is for.
  117 |   await page.getByRole('button', { name: '林星', exact: true }).click();
  118 |   await expect(grid).toHaveClass(/solo/);
  119 |   await expect(grid.locator('.pcard')).toHaveCount(3);
  120 |   await expect(grid.locator('.pcard').first()).toBeVisible();
  121 | });
  122 | 
  123 | // Kept last on purpose: this test plays a card, which mutates the in-memory game the server
  124 | // shares across specs in the same file. Running it earlier shortened the hand for the
  125 | // hit-target test above and made that assertion order-dependent.
  126 | test('a played hand lands between its owner and the table centre, clear of both seats', async ({ page }) => {
  127 |   await openTable(page);
  128 |   await page.setViewportSize({ width: 1440, height: 900 });
  129 |   await page.waitForTimeout(150);
  130 |   // Lead with one card so a played stack exists, then let the NPC turns resolve.
  131 |   await page.locator('.hand .card').first().click();
  132 |   await page.getByRole('button', { name: '出牌' }).click();
  133 |   await expect(page.locator('.played-stack')).toBeVisible({ timeout: 10_000 });
  134 | 
  135 |   const geo = await page.evaluate(() => {
  136 |     const felt = document.querySelector('.table-felt').getBoundingClientRect();
  137 |     const box = (sel) => {
  138 |       const el = document.querySelector(sel);
  139 |       if (!el) return null;
  140 |       const r = el.getBoundingClientRect();
  141 |       return { x: r.left - felt.left, right: r.right - felt.left, y: r.top - felt.top, bottom: r.bottom - felt.top, w: r.width };
  142 |     };
  143 |     return {
  144 |       feltW: Math.round(felt.width),
  145 |       stack: box('.played-stack'),
  146 |       linxing: box('.opponent.top .pal-standee'),
  147 |       mia: box('.opponent.right .pal-standee'),
  148 |       // label / owner row must sit inside the stack box, not float away from it
  149 |       label: box('.played-stack > p'),
  150 |       owner: box('.played-stack > b')
  151 |     };
  152 |   });
  153 | 
  154 |   // The stack must not overlap either character. This is the regression guard for the bug
  155 |   // where mia's cards were anchored at a fixed 63% of the felt and landed on linxing.
  156 |   const overlaps = (a, b) => a && b && a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom;
> 157 |   expect(overlaps(geo.stack, geo.linxing), 'played stack must not overlap linxing').toBe(false);
      |                                                                                     ^ Error: played stack must not overlap linxing
  158 |   expect(overlaps(geo.stack, geo.mia), 'played stack must not overlap mia').toBe(false);
  159 | 
  160 |   // Both label rows must stay within the stack's own box so the three parts read as one unit.
  161 |   expect(geo.label.y, 'type label must sit inside the stack').toBeGreaterThanOrEqual(geo.stack.y - 2);
  162 |   expect(geo.label.bottom, 'type label must sit inside the stack').toBeLessThanOrEqual(geo.stack.bottom + 2);
  163 |   expect(geo.owner.bottom, 'owner row must sit inside the stack').toBeLessThanOrEqual(geo.stack.bottom + 2);
  164 | });
  165 | 
```