# 换装斗地主 · UI 硬化改动清单（可复核版）

> 本文档对应本轮六批次改动中**直接可见于页面**的部分，配合 `docs/ui-shots/after-*.png` 截图使用。
> 预览地址：`http://127.0.0.1:4173`（本地服务，`PORT=4173`）

---

## 一、`apps/web/index.html`（1940 B）——唯一结构性改动

在 `.top-token` **之前**插入顶栏偏好控件组。这是本轮唯一新增的 HTML 元素。

```diff
       <nav aria-label="主导航">
         <a href="#/home" data-route="home">大厅</a>…<a href="#/inspector" data-route="inspector">检查器</a>
       </nav>
+      <div class="top-controls" role="group" aria-label="牌局偏好">
+        <button class="ctl-btn" type="button" data-action="toggle-speed" aria-label="切换牌友思考速度"><span id="speedLabel">标准</span><i aria-hidden="true">⏱</i></button>
+        <button class="ctl-btn" type="button" data-action="toggle-sfx" aria-pressed="true" aria-label="音效开关"><span id="sfxLabel">音效开</span><i aria-hidden="true">♪</i></button>
+      </div>
       <div class="top-token" id="tokenBalance">◇ 12 Token</div>
```

**设计说明**

| 项 | 取值 | 理由 |
|---|---|---|
| `role="group"` + `aria-label` | 牌局偏好 | 两个按钮是同类设置项，成组播报 |
| `aria-pressed` | 音效按钮带，速度按钮不带 | 音效是二态开关；速度是三态循环，`aria-pressed` 语义不成立 |
| 图标用 `<i aria-hidden>` | ⏱ / ♪ | 纯装饰，避免读屏重复播报 |
| 相机位置 | `nav` 与 `top-token` 之间 | 左导航·右资产的既有平衡不被破坏 |

> 注：`toggle-sfx` 是**唯一的 `.off` 类来源**，`styles-overrides.css` 中 `.ctl-btn.off` 依赖它。这不是死代码。

---

## 二、新增文件

| 文件 | 大小 | 职责 |
|---|---|---|
| `apps/web/runtime.js` | 1593 B | 玩家偏好集中管理（速度档位、localStorage、env 覆盖） |
| `apps/web/sfx.js` | 3750 B | Web Audio 振荡器合成音效，**零音频素材、零授权面** |

### `runtime.js` 的关键约束

```js
export function npcDelay() {
  const override = Number(window.__DRESSBATTLE_NPC_DELAY);
  if (Number.isFinite(override) && override > 0) return Math.max(16, override);
  return SPEED_STEPS[prefs().speed] ?? SPEED_STEPS.normal;
}
```
**env 覆盖优先于玩家偏好**——E2E 依赖此顺序，改动节奏逻辑时不可颠倒。

---

## 三、布局修复：`styles-overrides.css`（36780 → 34745 B）

### 3.1 牌桌高度改为视口推导（核心修复）

**修复前**：桌面固定高度，1440×900 下溢出 45px，1280×720 下溢出 89px。

```css
/* 修复后 */
.table-felt {
  height: clamp(310px, calc(100dvh - 313px - clamp(96px, 12dvh, 115px)), 720px);
  min-height: 0;
}
```

`313px` 不是魔数，是从 1440×900 实测几何反推的固定开销：

```
scrollHeight = 68  topbar
             + 18/28  page padding
             + 30   .table-side
             + 14×2 grid gaps
             + 52   .event-feed
             + 12   .hand-wrap margin-top
             + handWrap,  其中 handWrap = hand + 77
```

令 `scrollHeight = 100dvh`，得 `felt = 100dvh − 313 − hand`。**`hand` 与 `.hand` 共用同一条 `clamp(96px,12dvh,115px)` 表达式**，因此两者不会因各自缩放而错位。

### 3.2 实测结果（全部溢出为 0）

| Viewport | felt | hand | overflow |
|---|---|---|---|
| 1440×900 | 479px | 108px | **0px** |
| 1440×800 | 391px | — | **0px** |
| 1366×768 | 359px | — | **0px** |
| 1280×720 | 311px | 96px | **0px** |
| 1920×1080 | 652px | — | **0px** |
| 2560×1440 | 720px（封顶） | — | **0px** |

### 3.3 手牌扇面重做

**问题**：最左牌的可点击区域从 x=71 才开始，而行首在 x=57——溢出的居中 flex 行裁掉了它。

```css
.hand { justify-content: flex-start; }        /* 阻止溢出 flex 行重新居中 */
.hand .card { margin-right: 0; }              /* 基础规则里的负 margin 已直接移除 */
.hand .card + .card { margin-left: -18px; }   /* 重叠改由相邻选择器承担 */
```

**曾走过的弯路**：第一版用 `.hand .card b, .hand .card small { pointer-events: none; }`。这个方案被杀掉——它会同时废掉 `:hover` 并损害可访问性。改用结构性负 margin 方案。

---

## 四、可感知的交互增量

| 能力 | 触发 | 实现位置 |
|---|---|---|
| 牌友速度三档 | 顶栏 `⏱` 循环 快速→标准→慢速 | `runtime.js` + `applyPrefs()` |
| 音效开关 | 顶栏 `♪` | `sfx.js`，受 `prefers-reduced-motion` 统一降级 |
| 跳过结算演出 | 结算浮层 `跳过演出 →` | 循环推进 `settlementStage` 至 `DESTINATION` |
| 键盘操作 | `Enter` 出牌 / `Space` 提示 / `Esc` 取消选择 | `keydown`，已用 `matches('button,a,textarea,input,select')` 守卫 |
| 点空白处取消选牌 | 点击 `.table-felt` 空白 | 点击代理 |
| 写真馆单人布局 | 卡片 ≤4 张时加 `.solo` | `renderGallery()` |

**音效配方**（`sfx.js`，全部由振荡器合成，无音频文件）：

| 事件 | 波形 | 频率走向 |
|---|---|---|
| select | square | 880Hz 短促 |
| play | triangle | 440→660Hz |
| pass | sine | 300→210Hz |
| bomb | sawtooth + noise | 120→60Hz + 0.6s 噪声 |
| win | triangle ×3 | C5-E5-G5 琶音 |
| lose | sine ×3 | G4-E4-C4 下行 |
| unlock | triangle ×2 | E4-B5 跳进 |

`AudioContext` 首次创建需用户手势——`primeAudio()` 在首次点击时预热，失败静默降级（不阻塞牌局）。

---

## 五、验证证据

```
npm run verify     → 通过（lint + typecheck + test + build + verify:fixtures）
npm test           → 17/17
npx playwright test → 11/11（4 既有 + 7 新增 ui-hardening）
```

截图真源：`docs/ui-shots/after-*.png`，采集脚本 `tests/shots/after-ui.shot.mjs`、`tests/shots/small-viewport.shot.mjs`。

---

## 六、遗留项（本轮未处理）

| # | 项 | 严重度 | 说明 |
|---|---|---|---|
| 1 | `tr-1789211730/` 残留目录 | 🟢 | 不被 build/server/Docker 读取，无害。修法见下方选项 |
| 2 | 1280×720 下 `.opponent.top` 约 2px 溢出 | 🟢 | 视觉不可辨，未受理 |
| 3 | overrides 53 组同名选择器 | 🟡 | **刻意保留**，不是重复代码，勿"优化" |
| 4 | 音效只有开关、无音量 | 🟡 | 可后续加 slider |
| 5 | `app.js` 仍为 453 行单文件 | 🟡 | 未拆模块 |
| 6 | 规则层缺 三带一/连对/飞机/四带二；叫分仅接受 3；Token 只减不增 | 🔴 | **P0，独立于 UI 工作，未进入本轮范围** |

### `tr-*` 目录的三个处理选项

| 选项 | 做法 | 评价 |
|---|---|---|
| A | 无视 | 可控，但每次跑测试会再生成 |
| B | 在 `playwright.config.mjs` 设 `outputDir` | **推荐**，根治，且不影响现有断言 |
| C | 用 Node 脚本绕过 shell 批量删除守卫删除 | 治标 |

---

## 七、变更文件索引

| 文件 | 变化 |
|---|---|
| `apps/web/index.html` | +4 行顶栏控件组 |
| `apps/web/runtime.js` | 新增 1593 B |
| `apps/web/sfx.js` | 新增 3750 B |
| `apps/web/app.js` | 453 → ~470 行，44903 B |
| `apps/web/styles.css` | 12396 → 12179 B，703 行（已格式化，删 12 死类） |
| `apps/web/styles-overrides.css` | 36780 → 34745 B，385 行（删 9 死类） |
| `tests/e2e/ui-hardening.spec.mjs` | 新增 7 用例 |
| `scripts/collect-live-classes.mjs` | 新增（活体 DOM 采集） |
| `scripts/prune-dead-css.mjs` | 新增（带 KEEP 白名单） |
| `scripts/format-css.mjs` | 新增（纯空白格式化） |
| `playwright.config.mjs` | 重写（`reuseExistingServer:false` + `workers:1`） |
| `package.json` | +`css:classes` / `css:prune` / `css:prune:write` / `css:format` |
