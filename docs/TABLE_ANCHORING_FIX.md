# 牌桌出牌落点定位修复 · 交付记录

> 问题：AI 出牌"拍的位置都很奇怪"——牌悬在另一名角色身上，牌型标签/牌面/已出标签三处分离。
> 方案：用户选定 **A —— 出牌落点跟随出牌者**，落在该玩家与桌面中心之间。

---

## 一、根因（实测确认，非推断）

「位置奇怪」不是审美问题，是**三套互不知晓的定位坐标系**：

| # | 缺陷 | 证据 |
|---|---|---|
| 1 | 座位与出牌锚点无共享坐标系 | `.opponent.*` 用百分比挂边；`.from-*` 是完全独立的硬编码 |
| 2 | 顶部出牌锚点写死在过小的容器里 | `.from-pal-linxing { top: 296px }` 而 felt 只有 310px |
| 3 | 气泡挂在座位 flex 行的末位 | `left: calc(100% + 8px)` 量的是整行宽度，不是立绘 |
| 4 | 出牌区层级压过角色 | `.play-stage { z-index: 4 }` > 座位 `z-index: 2`，牌是画在人身上 |
| 5 | 顶部座位没真正居中 | `.opponent.top` 居中的是 flex 行，角色偏左 |

第 5 条是隐藏最深的：`.opponent.top` 的 flex 行 = 立绘 + 角色标签 + 背面牌，实测 **341px**，
其中立绘只占 236px。`translateX(-50%)` 居中整行，导致角色偏左 52.5px。

---

## 二、关键实测数据（1440×900，felt 1325px）

| 元素 | 实测占位 | 中心 |
|---|---|---|
| 林星立绘 | x556–792 | 674 |
| 米娅立绘 | x979–1215 | 1097 |
| 两者间隙 | x792–979 | **885.5** ← 米娅出牌应落此处 |
| 桌面中心 | — | 662.5 |

`.opponent.top` 行组成：**341px = 立绘236 + gap12 + 角色chip76 + gap12 + 背面牌5**

---

## 三、改动

全部集中在 `apps/web/styles-overrides.css` 末尾的 **"round 4: one shared table coordinate system"** 块，作为唯一真源。

### 3.1 顶部座位真正居中

```css
.opponent.top { top: 40px; transform: translateX(calc(-50% + 52.5px)); }
```
`52.5 = (76 + 12 + 5 + 12) / 2`——行内立绘之后所有兄弟元素宽度之和的一半。

> ⚠️ **不要手调这个数**。背面牌 `▣ ▣ ▣` 的实测宽度只有 5px（某些字体度量下），
> 试凑必然过头。本项目实测试过 72px，直接把角色推到中线右侧并与出牌栈相撞。

### 3.2 出牌锚点跟随出牌者

```css
.from-pal-linxing { top: calc(50% - var(--seat-inset) + 4%); left: calc(50% + 52.5px); }
.from-pal-mia     { top: calc(50% - 6%); left: calc(50% + 17%); }
.from-player      { top: calc(50% + 18%); left: 30%; }
```
- 米娅 `17%`：落在两角色间隙中点（885.5 = 中心 + 17% × 1325），两侧各留 ~37px 余量
- 玩家 `30%`：原 `40%` 会让栈盒（112px 宽）压到林星左缘 556；30% 落在 x341–453，完全避开

### 3.3 层级修正

```css
.play-stage  { z-index: 1; }   /* 低于座位，牌不再画在脸上 */
.played-stack{ z-index: 3; }   /* 但牌本身仍盖住桌面 */
```

### 3.4 气泡挂到立绘

```css
.opponent .pal-standee { position: relative; }
.opponent.top .pal-bubble { top: auto; bottom: -34px; left: 50%; transform: translateX(-50%); }
```
顶部座位的气泡改为**垂在头部下方**（朝向桌面中心），与其出牌落点同侧，一眼可辨"谁在说话"。

### 3.5 短视口适配 `@media (max-height: 780px)`

```css
.opponent .pal-standee { width: 176px; height: 220px; }
.opponent .pal-standee.cutout { width: 192px; height: 240px; }
.table-felt { height: clamp(300px, calc(100dvh - 313px - clamp(96px, 12dvh, 115px)), 720px); }
.turn-dock { top: auto; bottom: 6px; left: 25%; }
```

---

## 四、六档视口实测

| Viewport | felt | 滚动 | 出牌栈重叠 | 结果 |
|---|---|---|---|---|
| 1024×720 | 942×311 | +30px | 米娅 | 🟡 边界退化 |
| **1280×720** | 1178×311 | **0** | **无** | ✅ **PASS** |
| **1366×768** | 1257×359 | **0** | **无** | ✅ **PASS** |
| **1440×900** | 1325×449 | **0** | **无** | ✅ **PASS** |
| 1920×1080 | 1326×622 | 0 | 无 | 🟡 居中差 12px |
| **2560×1440** | 1275×720 | **0** | **无** | ✅ **PASS** |

- **1024×720** 恰是 `body { min-width: 1024px }` 的左边界，此时 felt 仅 942px，而两个座位占 384px + 出牌栈 112px，物理上放不下。**1280×720 是文档化的最小支持尺寸**，完全干净。
- **1920×1080** 的 12px 偏差源于 `.pal-standee` 的 `object-position: 56% center`——img 的 bounding box 比盒子右偏 12px。**盒子本身是居中的**，属断言量错对象，非布局缺陷。

---

## 五、验证

```
npm run verify      → 全绿（lint + typecheck + test + build + verify:fixtures）
npm test            → 17/17
npx playwright test → 12/12（原 11 + 新增锚点回归 1）
```

### 新增回归守卫

`tests/e2e/ui-hardening.spec.mjs` 末条 *"a played hand lands between its owner and the table centre, clear of both seats"*：

- 断言出牌栈不与任一角色盒重叠（**这条直接锁死了本轮 bug**）
- 断言牌型标签 / 已出标签都在栈盒内，三部分读作一个整体
- **必须放文件末尾**：该用例会出牌，而 `reuseExistingServer: false` 是**按文件**隔离服务端，放前面会让后续用例的手牌数从 20 变 17

### 新增诊断脚本（`tests/shots/`）

| 文件 | 用途 |
|---|---|
| `table-invariants.shot.mjs` | 六档视口不变式扫描（滚动/重叠/越界/居中） |
| `measure-top-seat.shot.mjs` | dump 顶部座位行组成，用于推导 `52.5px` |
| `diagnose-felt.shot.mjs` | 逐项 dump felt 高度推导链 |
| `verify-seats.shot.mjs` | 单场景座位与出牌栈几何 |
| `final-anchor.shot.mjs` | 采集最终视觉证据 |

---

## 六、遗留

| # | 项 | 严重度 | 说明 |
|---|---|---|---|
| 1 | 1024×720 仍有 30px 滚动 | 🟡 | CSS 左边界，非文档化最小尺寸；再压需牺牲角色尺寸，不划算 |
| 2 | 1920×1080 断言 12px 偏差 | 🟢 | `object-position` 测量假象，视觉无问题 |
| 3 | 米娅气泡与牌面垂直间距偏大 | 🟡 | 功能正确，纯观感，可再调 |
| 4 | `tr-*` 临时目录 | 🟢 | 待选 A/B/C 处理，**B（加 `outputDir`）为推荐根治方案** |
| 5 | 规则层缺三带一/连对/飞机/四带二；Token 只减不增 | 🔴 | **P0，独立于本次 UI 工作** |
