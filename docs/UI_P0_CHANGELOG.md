# UI / 交互 P0 改动记录（已落地）

> 执行日期：2026-09-12
> 范围：`apps/web/*`、`tests/e2e/*`、`playwright.config.mjs`、`scripts/*`
> 未触碰：游戏规则引擎、结算契约、资产文件、"诚实边界" 表述
> 回归基线：`npm run lint` 23 文件通过 · `npm test` 17/17 通过 · `npx playwright test` **11/11 通过**
> 规划稿见 `docs/UI_P0_PLAN.md`（预览版，含未采纳项）

---

## 一、结论

六批次全部落地。最关键的三个数字：

| 指标 | 改动前 | 改动后 |
|---|---|---|
| 1440×900 纵向溢出 | **+45px**（内容被推出视口） | **0px** |
| 1280×720 纵向溢出 | +89px | **0px** |
| E2E 用例数 | 4 | **11**（新增 7 条回归防线） |

节奏与反馈从"不可控 / 无"变为"三档可控 / 6 类音效"。

---

## 二、逐项交付

### ① 版面溢出修复

**根因**：`.table-felt` 的高度公式里，扣除项是一个手写的魔数 `330px`，而它漏算了 `.hand-wrap` 与 `.event-feed` 的实际占位。任何一处布局调整都会让这个数字失准。

**做法**：改为从实测几何推导的公式，且让 `.hand` 与 `.table-felt` **共用同一个 `clamp` 表达式**，消除"两处数字各自漂移"的可能。

```css
/* apps/web/styles.css */
.hand { height: clamp(96px, 12dvh, 115px); ... }

/* apps/web/styles-overrides.css */
.table-felt {
  height: clamp(310px, calc(100dvh - 313px - clamp(96px, 12dvh, 115px)), 720px);
  min-height: 0;
}
```

推导（1440×900 实测，逐像素校验）：
```
scrollHeight = 68 topbar + 18/28 page padding + 30 .table-side
             + 14×2 grid gaps + 52 .event-feed
             + 12 .hand-wrap margin-top
             + handWrap( = hand + 77 )  + felt
令 scrollHeight = 100dvh  ⇒  felt = 100dvh - 313 - hand
```

各分辨率实测结果：

| 视口 | felt | 纵向溢出 |
|---|---|---|
| 1440×900 | 479 | 0 |
| 1440×800 | 391 | 0 |
| 1366×768 | 359 | 0 |
| **1280×720** | 311 | **0** |
| 1920×1080 | 652 | 0 |
| 2560×1440 | 720（封顶） | 0 |

> `310px` 下界是实测出来的最小值——它能保证 1280×720 也完全无滚动。低于此高度由页面滚动接管，不再压缩牌桌。

---

### ② 节奏交给玩家

**问题**：NPC 固定 900ms；结算 4 阶段每步都要手点，**入场动画有跳过、结算反而没有**。

**新增 `apps/web/runtime.js`**（44 行）——集中管理玩家偏好，避免 `localStorage` 散落在 `app.js`：

| 档位 | 延迟 |
|---|---|
| 快速 | 320ms |
| 标准（默认） | 850ms |
| 慢速 | 1500ms |

E2E 覆盖通道 `window.__DRESSBATTLE_NPC_DELAY` **优先级最高**，保证测试不受持久化状态影响。

**结算跳过**：新增 `跳过演出 →` 按钮，一次跳到终态。

```js
if (action === 'skip-settlement') {
  for (let step = 0; step < 5 && state.game.settlementStage !== 'DESTINATION'; step += 1) {
    state.game = await api('/api/game/settlement/advance', { method: 'POST', ... });
  }
  await refreshGallery();
}
```

复用既有 `/api/game/settlement/advance` —— **服务端零改动**。加了 5 次迭代上限防御。

---

### ③ 音效反馈

**问题**：全局零音效，`app.js` 无任何 `Audio` 调用。

**新增 `apps/web/sfx.js`**（68 行）——Web Audio 振荡器合成，**零素材、零版权、零 Docker 体积增长**：

| 事件 | 波形 | 参数 |
|---|---|---|
| 选/取消牌 | square | 880Hz / 60ms |
| 出牌 | triangle | 440→660Hz 上滑 / 120ms |
| 不出 | sine | 300→210Hz 下滑 / 140ms |
| 炸弹·王炸 | sawtooth + 噪声 | 120Hz 下滑 / 600ms（唯一重音） |
| 胜 / 败 | triangle / sine 三音琶音 | 900ms |
| 解锁写真卡 | triangle 双音 | 2×300ms |

静音条件（三条任一即静音）：玩家关闭 · `prefers-reduced-motion: reduce` · 浏览器不支持 Web Audio。

自动播放策略天然满足（所有音效均由点击触发）；`toggle-sfx` 点击时额外 `primeAudio()` 兜底 `AudioContext` 创建。

---

### ④ 输入修正

| 问题 | 做法 |
|---|---|
| 点"第 3 张"实际触发第 4 张 | 负 margin 从右侧改为**左侧**（`.hand .card + .card { margin-left: -18px }`），并把 `margin-right` 归零——视觉叠压不变，但点击归属稳定 |
| 手牌行中央裁剪 | `.hand { justify-content: flex-start }`，横向溢出时不再居中对齐（避免最左卡命中区被裁） |
| 空白处不能取消选牌 | 点击 `.table-felt` 非卡牌区域 → 清空选中 |
| 无出牌快捷键 | `Enter` 出牌、`Space` 提示、`Esc` 取消选牌 |
| 窄屏手牌不可滚动 | 移除 `@media (1101–1320px)` 里的 `.hand { overflow: hidden }` |

> `pointer-events: none` 方案被**主动否决**：它会让 `:hover` 失效且损伤可访问性，改用结构性方案。

---

### ⑤ CSS 减法

**先纠正上一轮自己的错误结论**：静态扫描报"32 个死类"是**偏大的**。`band-N` / `lv-N` / `from-*` / `card` / `red` / `selected` / `off` / `loading` / `empty` 都是**模板字符串运行时拼接**，静态 grep 看不见。

**做法**：新增 `scripts/collect-live-classes.mjs`，用无头浏览器遍历**所有路由 + 完整结算循环 + 画廊详情 + 回放弹层**，采集真实 DOM 类名 123 个，再取差集。

最终**确证可删 21 个唯一类**：

| 文件 | 删除类名 |
|---|---|
| `styles.css` | `center-play` `combo` `hero-copy` `hero-pal` `hero-stage` `home-cards` `loop-strip` `performance-visual` `rule-chip` `settle-pal` `turn-pill` `versus` |
| `styles-overrides.css` | `dressup-summary` `photo-copy` `played-cards` `replay-progress` `replay-visual` `settlement-video-caption` `settlement-video-frame` `settlement-video-modal`（+ `performance-visual` 重复计） |

其中 `.settlement-video-frame` / `.settlement-video-modal` 是早期迭代残留（`docs/UIUE_STAGE2_AUDIT.md` 可查），现实现走 `.dressup-modal`。

配套新增 `scripts/prune-dead-css.mjs`，带 `KEEP` 白名单保护运行时拼接类——**下次清理不会重犯这次的误判**。

**其他**：
- `styles.css` 从单行压缩格式化为 711 行（`scripts/format-css.mjs`，仅加空白，不动任何声明）
- 移除 `<1100px` 媒体分支——它与 `body { min-width: 1040px }` 自相矛盾，且删掉重复的 `min-width` 声明
- 文件顶部加作用域说明，明确 `styles.css` 是浅色基线、实际生效主题在 overrides

---

### ⑥ 画廊 solo

**问题**：`.gallery-grid` 永不带 `.solo`；且 `.solo` 规则编的是 `.photo-card` / `.card-art`，而真实 DOM 是 `.pcard` / `.pcard-art`——两套命名各说各话，整段规则死掉。

**做法**：`renderGallery()` 在筛选结果 ≤ 4 张时挂 `.solo`，并把 CSS 选择器对齐真实类名。低卡池阶段卡片现在居中放大展示，而不是摊在大片留白里。

---

## 三、测试防线

**新增 `tests/e2e/ui-hardening.spec.mjs`（7 条）**

| 用例 | 防的是什么 |
|---|---|
| table layout fits the viewport | 版面溢出回归（4 档分辨率） |
| felt never collapses below minimum | 1280×720 不再破版 |
| hand scrolls as one reachable row | 每张牌都响应自己的点击（含首尾卡） |
| player can change NPC pacing | 三档循环 + 刷新后持久化 |
| audio toggle reports its state | `aria-pressed` 状态正确 |
| settlement can be skipped | 跳过直达终态且卡已入库 |
| filtered gallery switches to featured layout | solo 布局真实生效 |

**修正 `playwright.config.mjs`**（一处真实缺陷）

原配置 `reuseExistingServer: true`。但 API 的牌局与画廊状态**存在进程内存里**——残留的 dev server 会让上一轮的写真卡泄漏进下一轮，使 `1 / 6` 这类断言依赖执行顺序。已改为 `reuseExistingServer: false` + `workers: 1`，**每个 spec 都跑在全新服务上**。

> 这是本次实测暴露的真实问题：`first-loop.spec.mjs` 单独跑通过、全套跑失败，根因就是状态泄漏。

---

## 四、新增 npm 脚本

```json
"css:classes":      "node scripts/collect-live-classes.mjs",
"css:prune":        "node scripts/prune-dead-css.mjs",
"css:prune:write":  "node scripts/prune-dead-css.mjs --write",
"css:format":       "node scripts/format-css.mjs apps/web/styles.css --write"
```

---

## 五、验证证据

| 项目 | 结果 |
|---|---|
| `npm run lint` | 23 文件通过 |
| `npm test` | **17 / 17 通过** |
| `npx playwright test` | **11 / 11 通过** |
| 视觉校验 | `docs/ui-shots/01-home.png`、`02-table.png`、`03-gallery.png`、`04-gallery-solo.png` |

---

## 六、遗留与后续

| 项 | 状态 | 说明 |
|---|---|---|
| 1280×720 对手席轻微越界 | 已知 | 最小支持尺寸下 `.opponent.top` 约 2px 溢出，肉眼不可见；若要求严格可再降 felt 下界至 300 |
| 53 组重复选择器 | **未动** | 深色主题整体推翻浅色底，是设计意图而非缺陷；合并风险远大于收益 |
| 音效无音量控制 | 待定 | 当前仅开关；如需音量滑块可扩展 `runtime.js` |
| 速度档位 UI | 待定 | 现为单击循环切换，档位增多时建议改下拉 |
| `app.js` 单文件 453 行 | 未动 | 属 P2 结构项，待新牌型扩展时一并处理 |
