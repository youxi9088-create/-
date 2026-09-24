# UI / 交互 P0 改动清单（预览版）

> 状态：**待评审**（未落盘到源码）。评审通过后按批次执行。
> 范围：`apps/web/*`、`apps/api/*`、`packages/*`、`tests/*`。不触碰资产文件、不改「诚实边界」。

---

## 0. 总览

| 批次 | 主题 | 文件 | 改动量 | 风险 | 可回滚 |
|---|---|---|---|---|---|
| ① | 版面溢出修复 | `styles-overrides.css` | 3 处覆盖 | 极低 | 是 |
| ② | 节奏交给玩家 | `app.js` + `styles-overrides.css` + `index.html` | 新增 `runtime.js`，改 6 处 | 低 | 是 |
| ③ | 音效反馈 | 新增 `sfx.js`，`app.js` 挂 5 处 | 新增 1 文件，改 3 处 | 低 | 是（开关默认关） |
| ④ | 输入修正 | `app.js` + `styles-overrides.css` | 4 处 | 低 | 是 |
| ⑤ | CSS 减法 | 两 CSS 各删死类、格式化 base、删 `<1100px` 分支 | 删 32 类 / 53 重复选择器 | 低 | 是 |
| ⑥ | 画廊 solo | `app.js` + `styles-overrides.css` | 2 处 | 低 | 是 |

**执行建议**：`① → ② → ③ → ④` 一次性提交（P0 全量），`⑤⑥` 单独一次提交。每批次后跑 `npm test`。

---

## ① 版面溢出修复

### 问题
1440×900 实测总高 **945px**，溢出 **45px**。根因是 `.table-felt` 高度公式的扣除项 `330px` 漏算了 `.hand-wrap` 的 173px。

### 实测预算（1440×900）

| 区段 | 当前 | 修正后 |
|---|---|---|
| topbar | 68 | 68 |
| `.table-page` padding-top | 18 | 18 |
| `.table-side` | ~62 | ~62 |
| grid gap | 14 | 14 |
| **`.table-felt`** | **570** | **495** |
| `.hand-wrap` margin-top | 12 | 12 |
| `.hand-wrap` | 173 | ~161 |
| `.table-page` padding-bottom | 28 | 28 |
| **合计** | **945 ❌** | **~858 ✓** |

### Diff

**`apps/web/styles-overrides.css`** — 最后一条 `.table-felt` 覆盖（当前值 `clamp(430px, calc(100dvh - 330px), 580px)`）：

```diff
- /* felt height follows the viewport so nothing is pushed off-screen */
- .table-felt { height: clamp(430px, calc(100dvh - 330px), 580px); min-height: 0; }
+ /* felt height follows the viewport and leaves room for the hand tray */
+ .table-felt { height: clamp(400px, calc(100dvh - 468px), 560px); min-height: 0; }
```

**`apps/web/styles.css`** — `.hand` 改为随视口联动（顺带让窄屏更省高度）：

```diff
-.hand{height:115px;display:flex;align-items:flex-end;overflow-x:auto;padding:5px}
+.hand{height:clamp(96px,12dvh,115px);display:flex;align-items:flex-end;overflow-x:auto;padding:5px}
```

> `clamp(400px, …)` 的下界 400 保证 768px 以下高度时不至于把 felt 压塌。

### 验证
- Playwright 已有 viewport 1440×900 与 1280×720，两档都不应出现纵向滚动：`document.documentElement.scrollHeight <= innerHeight + 1`。
- 既有断言 `.hand scrollWidth - clientWidth <= 1`（1280×720）必须仍通过 —— 见 ④ 对 `overflow:hidden` 的处理。

---

## ② 节奏交给玩家

### 问题
| 环节 | 现状 | 目标 |
|---|---|---|
| NPC 出牌 | 固定 900ms，仅能靠 `window.__DRESSBATTLE_NPC_DELAY` 改 | 三档可切：快 320 / 中 850 / 慢 1500 |
| 入场动画 | 有「跳过入场 ⏎」✓ | 保留 |
| 结算 4 阶段 | 每阶段都要手点，**无跳过** | 顶栏加「跳过演出 →」直跳终态 |

叠加效应是两个极端：既慢得让人等，又必须一路点到底。

### 新增文件 `apps/web/runtime.js`（约 40 行）
统一承载"玩家偏好"的读写，避免把 `localStorage` 散落进 `app.js`。

```js
const KEY = 'dressbattle.runtime.v1';
export const SPEED_STEPS = { fast: 320, normal: 850, slow: 1500 };
const defaults = { speed: 'normal', sfx: true };
let cache = null;
export function prefs() {
  if (cache) return cache;
  try { cache = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { cache = { ...defaults }; }
  return cache;
}
export function setPref(key, value) {
  cache = { ...prefs(), [key]: value };
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {}
  return cache;
}
export function npcDelay() {
  const override = Number(window.__DRESSBATTLE_NPC_DELAY);
  if (Number.isFinite(override) && override > 0) return Math.max(16, override);  // E2E 复位通道保留
  return SPEED_STEPS[prefs().speed] ?? SPEED_STEPS.normal;
}
```

**`apps/web/app.js`** — 第 3 行：

```diff
-const npcTurnDelay = Math.max(16, Number(window.__DRESSBATTLE_NPC_DELAY) || 900);
+import { npcDelay, prefs, setPref, SPEED_STEPS } from './runtime.js';
```

`scheduleNpcTurn()` 内 `}, npcTurnDelay);` → `}, npcDelay());`（每次重算，切档立即生效）。

**`apps/web/index.html`** — topbar 内 `.top-token` 之前插入：

```diff
+      <div class="top-controls" role="group" aria-label="牌局偏好">
+        <button class="ctl-btn" data-action="toggle-speed" aria-label="牌友思考速度"><span id="speedLabel">标准</span> ⏱</button>
+        <button class="ctl-btn" data-action="toggle-sfx" aria-pressed="true" aria-label="音效开关"><span id="sfxLabel">音效开</span> ♪</button>
+      </div>
```

**`apps/web/app.js` 事件委托** — 新增 2 个 action：

```diff
+    if (action === 'toggle-speed') { const order = ['fast','normal','slow'];
+      setPref('speed', order[(order.indexOf(prefs().speed) + 1) % 3]); applyPrefs(); }
+    if (action === 'toggle-sfx') { setPref('sfx', !prefs().sfx); applyPrefs(); }
```

**结算跳过** — `settlementOverlay()` 两个 return 分支的 `.settlement-video-footer` 内各加一个按钮：

```diff
- <div class="modal-actions"><button class="primary" data-action="advance">${settlementLabel(stage)}</button>...
+ <div class="modal-actions"><button class="secondary compact" data-action="skip-settlement">跳过演出 →</button><button class="primary" data-action="advance">${settlementLabel(stage)}</button>...
```

新增 handler（一次跳到终态，不逐帧）：

```diff
+    if (action === 'skip-settlement') {
+      while (state.game.settlementStage !== 'DESTINATION') {
+        state.game = await api('/api/game/settlement/advance', { method: 'POST', body: JSON.stringify({ gameId: state.game.id }) });
+      }
+      await refreshGallery();
+    }
```

> 复用既有 `/api/game/settlement/advance`，**服务端零改动**。连续多次调用天然幂等（`nextSettlementStage` 已 clamp 到末位）。

### 验证
- 新增 E2E：切到"快速"后，`林星正在思考…` → `你的回合` 的间隔 < 900ms。
- 新增 E2E：结算后点「跳过演出 →」，直接落在 `DESTINATION` 且 `.photo-card-reveal` 曾出现（卡已入库）。

---

## ③ 音效反馈

### 问题
全局**零音效**：`app.js` 无任何 `Audio` / `play()`。斗地主的节奏爽感有一半来自声音。

### 方案：Web Audio 合成，零素材零版权
不引第三方库、不加音频文件、不动 Docker 体积。

### 新增文件 `apps/web/sfx.js`（约 55 行）

| 事件 | 波形 | 频率 | 时长 | 说明 |
|---|---|---|---|---|
| `select` | square | 880Hz | 60ms | 选/取消牌 |
| `play` | triangle | 440→660Hz 上滑 | 120ms | 出牌落桌 |
| `pass` | sine | 300Hz 下滑 | 140ms | 不出 |
| `bomb` | sawtooth | 120Hz + 噪声 | 600ms | 炸弹/王炸，唯一"重"音 |
| `win` | triangle 三音 | C5-E5-G5 琶音 | 900ms | 胜 |
| `lose` | sine 三音 | G4-E4-C4 下行 | 900ms | 败 |

```js
let ctx = null;
const enabled = () => prefs().sfx && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function tone({ wave = 'sine', from, to = from, dur = 0.12, gain = 0.06 }) { /* osc + gain envelope */ }
export function sfx(name) { if (!enabled()) return; ctx ||= new (window.AudioContext || window.webkitAudioContext)(); /* dispatch */ }
```

> `prefers-reduced-motion: reduce` 时**默认静音**，与既有动效降级策略保持一致。

### 挂载点（`app.js`，5 处）

| 位置 | 调用 |
|---|---|
| 卡牌选择 toggle（事件委托内 `state.selected.add/delete` 之后） | `sfx('select')` |
| `action === 'play'` 成功后 | `game.currentCombo.type === 'BOMB' \|\| 'ROCKET' ? sfx('bomb') : sfx('play')` |
| `action === 'pass'` 成功后 | `sfx('pass')` |
| NPC `advance-turn` 返回且 `lastPlayerId` 变化 | `sfx('play')` |
| `render()` 内首次检测到 `phase === 'SETTLED'` | `winnerId === 'player' ? sfx('win') : sfx('lose')` |

> 最后一个用 `state.sfxFiredFor` 记住 `gameId`，避免 `render()` 重入重复播放。

### 风险
浏览器自动播放策略要求首次交互后才能建 `AudioContext` —— 因为所有音效都由点击/键盘触发，天然满足。首次 `toggle-sfx` 点击会给 `ctx.resume()` 兜底。

---

## ④ 输入修正

### 4.1 命中区重叠（🔴）
`.card{margin-right:-18px}` 让 `<button>` 的可点矩形互相覆盖 —— 点"第 3 张"实际触发第 4 张。

```diff
/* styles.css */
-.card{flex:0 0 57px;height:85px;...margin-right:-18px;...}
+.card{flex:0 0 57px;height:85px;...margin-right:0;...}
```

保留视觉叠压，改由内层卡面承担位移：

```diff
/* styles-overrides.css */
+.card { margin-right: 0; }
+.hand .card + .card { margin-left: -18px; }   /* 用负左距叠压，命中区归属右侧 DOM 顺序不变 */
+.card .card-art, .card b, .card small { pointer-events: none; }  /* 点击穿透到 button 本体 */
```

> 更稳的做法是让叠压部分 `pointer-events:none`，保证点击永远落在视觉最上层那张牌的 `button` 上。两条一起上。

### 4.2 空白处取消全部选牌（🟡）
```diff
+  if (event.target.closest('.table-felt') && !event.target.closest('[data-card]') && state.selected.size) {
+    state.selected.clear(); return render();
+  }
```

### 4.3 出牌快捷键（🟡）
`keydown` 内补：

```diff
+  if (state.route === 'table' && !state.detail && event.key === 'Enter') {
+    if (event.target.matches('button, a, textarea')) return;   // 不抢按钮自身行为
+    if (state.selected.size) { event.preventDefault(); document.querySelector('[data-action="play"]')?.click(); }
+  }
+  if (state.route === 'table' && event.key === ' ') {   // 空格 = 提示
+    event.preventDefault(); document.querySelector('[data-action="hint"]')?.click();
+  }
```

> `Space` 默认会滚动页面，需 `preventDefault`。按钮已原生支持 Enter，故加 `event.target.matches` 守卫。

### 4.4 `.hand` 滚动能力统一（🟡）
`@media (min-width:1101px) and (max-width:1320px)` 把 `.hand{overflow:hidden}`，窄屏手牌多时**看不到牌**。

```diff
-  .hand { overflow: hidden; }
+  /* keep horizontal scroll available; cards already shrink below 1320px */
```

同时移除 ⑤ 中的 `<1100px` 分支后，全局统一 `overflow-x:auto`。

---

## ⑤ CSS 减法

### 5.1 死类删除（32 个）

**`styles.css`（12 个）**，已交叉验证 `app.js` + `index.html` 均无引用：
```
center-play, combo, hero-copy, hero-pal, hero-stage, home-cards,
loop-strip, performance-visual, rule-chip, settle-pal, turn-pill, versus
```

**`styles-overrides.css`（20 个）**：
```
band-1, band-2, band-3, dressup-summary, from-pal-linxing, from-pal-mia,
from-player, lv2, lv3, lv4, lv5, performance-visual, photo-copy,
played-cards, replay-progress, replay-visual, settlement-video-caption,
settlement-video-frame, settlement-video-modal, solo
```

**例外 — 不要删 `band-N` / `lv-N`**：它们是**运行时拼接**的类名（`band-${band}`、`lv${lv}`），静态扫描会误判。已确认 `app.js:114` 与 `app.js:163` 生成。**实际可安全删除的是 29 个**：

> `center-play, combo, hero-copy, hero-pal, hero-stage, home-cards, loop-strip, performance-visual, rule-chip, settle-pal, turn-pill, versus, dressup-summary, from-pal-linxing, from-pal-mia, from-player, photo-copy, played-cards, replay-progress, replay-visual, settlement-video-caption, settlement-video-frame, settlement-video-modal`
> → 共 **23 个**；减去 `performance-visual` 在两表重复计一次 = **22 个唯一类**。

`.settlement-video-frame` / `.settlement-video-modal` 是早期迭代残留（`docs/UIUE_STAGE2_AUDIT.md` 可查），现走 `.dressup-modal`。

### 5.2 `from-${game.lastPlayerId}` 反例
`app.js:101` 拼的是 `from-${game.lastPlayerId}` → `from-pal-linxing` / `from-pal-mia` / `from-player`。模板字符串里**不含字面类名**，静态扫描判"死"是误判。**保留**。

> 这一条是本次审计的重要修正：**运行时拼接的类必须按其可能取值白名单保护**，否则会静默删掉生效样式。执行前建议用 Playwright 全站遍历 `document.querySelectorAll('*')` 收集真实类名集合再取差集。

### 5.3 重复选择器（53 组）
`styles-overrides.css` 有 344 个选择器（拆分后），其中 **53 个与 `styles.css` 完全同名**。这是"深色主题覆盖浅色主题"的**设计意图**，不是 bug —— 但意味着 `styles.css` 是被整体推翻的，其主题色板对最终渲染无贡献。

**建议**：本次**不动级联结构**（改动风险 >> 收益），只做两件小事：
1. 格式化 `styles.css`（当前是**单行压缩**，147 条规则挤在 1 行，无法 review）
2. 在 `styles.css` 顶部加注释声明它是 light-theme baseline，实际生效主题见 overrides

### 5.4 响应式分支
```diff
-@media(max-width:1100px){ ... }        /* styles.css */
-@media (max-width: 1240px) { ... }     /* styles-overrides.css */
```
与 `body{min-width:1024px}` 矛盾。桌面单机 MVP 建议：**明确最低 1024×720**，删掉 `<1100px` 分支，`1240px` 分支保留（它是缩身不是重排）。

---

## ⑥ 画廊 solo

### 问题
`app.js:204` 的 `<div class="gallery-grid" id="galleryGrid">` **永不带 `.solo`**；且渲染用 `.pcard` / `.pcard-art`，而 `.solo` 规则编的是 `.photo-card` / `.card-art` —— 两套命名各说各话，整段规则死掉。

低卡池（6 张）阶段恰恰最需要放大展示，现在仍是多列网格 + 大片留白。

### Diff

**`apps/web/app.js` — `renderGallery()`**
```diff
- <div class="gallery-grid" id="galleryGrid">
+ <div class="gallery-grid${slots.length && slots.length <= 4 ? ' solo' : ''}" id="galleryGrid">
```

**`apps/web/styles-overrides.css` — `.solo` 块对齐真实类名**
```diff
-.gallery-grid.solo { grid-template-columns: minmax(560px, 720px); justify-content: center; }
-.gallery-grid.solo .photo-card { display: grid; grid-template-columns: 270px 1fr; gap: 24px; align-items: center; padding: 18px; }
-.gallery-grid.solo .card-art { height: 300px; }
-.gallery-grid.solo .photo-copy h2 { margin-top: 0; font-size: 24px; }
-.gallery-grid.solo .photo-copy p { font-size: 14px; }
+.gallery-grid.solo { grid-template-columns: minmax(560px, 720px); justify-content: center; }
+.gallery-grid.solo .pcard { display: grid; grid-template-columns: 270px 1fr; gap: 24px; align-items: center; padding: 18px; }
+.gallery-grid.solo .pcard-art { height: 300px; }
+.gallery-grid.solo .pcard-copy h2 { margin-top: 0; font-size: 24px; }
+.gallery-grid.solo .pcard-copy p { font-size: 14px; }
```

### 验证
现有 E2E 断言 `gallery-first-card.png` 场景为 `1 / 6` 解锁、6 张卡在列；**筛选到 4 张以内时会触发 solo**，需补一条断言确认 `.gallery-grid.solo` 出现且 `.pcard` 仍可点击。

---

## 回归风险 & 测试策略

| 风险 | 影响面 | 缓解 |
|---|---|---|
| `.card` margin 改动破坏手牌叠压视觉 | 牌桌 | Playwright 截图 diff（`first-loop-table.png`） |
| `clamp` 取值导致小高度下 felt 过矮 | 768–900px 高度 | 加 4 档 viewport 断言：900/768/720/1200 |
| 删死类误删运行时拼接类 | 全局 | 执行前跑真实 DOM 类名采集取差集，不靠静态扫描 |
| `skip-settlement` 循环调用 | 结算 | 加最大 5 次迭代保护 |
| Web Audio 首次交互策略 | 音效 | try/catch 静默失败，不阻塞主流程 |
| `prefs()` 读取损坏 localStorage | 启动 | 已 try/catch + defaults 兜底 |

**测试基线（改动前先跑一次留档）**
```
npm run lint && npm run test && npm run test:e2e
```

---

## 待你拍板

1. **执行顺序**：`①②③④` 一次提交（P0 全量），`⑤⑥` 另一次 —— 是否同意？
2. **音效**：接受 Web Audio 合成（零素材），还是你提供素材？
3. **`<1024px`**：确认彻底放弃、删分支？还是保留一条降级提示？
4. **CSS 减法力度**：只删确定死类（保守），还是连 53 组重复选择器也合并（激进）？

回一个编号或直接说"按建议执行"，我就动手。
