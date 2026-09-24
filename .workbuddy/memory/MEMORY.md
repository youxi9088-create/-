# 项目约定（换装斗地主 MVP）

## 架构与边界
- 服务端权威：所有胜负/Token 由 `apps/api/game-engine.mjs` 的 `GameService` 裁决，浏览器不得决定结果。命令走 `commandId` 幂等键。
- 契约版本化：`packages/contracts` 为唯一真源（`CONTRACT_VERSION = '1.1.0'`），`validateGameSnapshot` / `validatePalAsset` / `validatePhotoCard` 为门禁。
- 表现降级：L1 视频主轨 → L2 分层/精灵图备轨 → L3 静态。缺主资源时必须 `DEGRADED_READY`，不得阻塞牌局。
- 资产诚实：RLCard/DouZero 未接入、HTTP 非 WebSocket、工坊是受控 Mock——这些"诚实边界"表述**不得抹掉**。

## 样式体系
- `styles.css` = **浅色基线**（结构 + 变量），`styles-overrides.css` = **深色赌场主题**。overrides 刻意重述约 53 组同名选择器，**这是设计意图，不要"优化"掉**。
- 布局高度一律用 `dvh` 推导，**禁止手写魔数扣除项**。参考 `.table-felt` 的写法：让相关元素的尺寸共用同一个 `clamp` 表达式。
- `body { min-width: 1024px }`，桌面单机 MVP，**最小支持 1024×720**，无移动端分支（1024 恰好是 CSS 边界，实测有 30px 滚动；1280×720 起完全干净）。
- **牌桌只有一个坐标系**：座位与出牌锚点全部集中在 `styles-overrides.css` 末尾的 "round 4" 块。`.from-*` 不得再出现独立硬编码 top/left。
- **右侧锚定的元素禁止用百分比宽度**：`.opponent.right` 定位的是盒子右缘，子元素 `width:%` 相对 felt 解析，会撑破盒子把角色翻到桌子另一侧。

## 前端结构
- vanilla JS 单页，无框架。`app.js` 为路由 + 渲染；玩家偏好集中在 `runtime.js`（localStorage）；音效在 `sfx.js`（Web Audio 合成，零素材）。
- E2E 覆盖通道：`window.__DRESSBATTLE_NPC_DELAY`、`window.__DRESSBATTLE_SEED`、`window.__DRESSBATTLE_SKIP_ENTRY`。**改节奏逻辑时必须保留 env 优先级高于玩家偏好**，否则 E2E 会挂。

## 桌面几何调试纪律（本轮教训）
- **禁止试凑 CSS 常量**。先用 headless 脚本 dump 兄弟元素真实宽度 + 容器宽度，再算出百分比。每个非整数常量（如 `52.5px`）必须在注释里写推导过程。
- **`object-position` 会骗过几何断言**：`.pal-standee` 用 `object-position: 56% center` 裁剪 img，img 的 bounding box 比盒子右偏 ~12px。断言"居中"要量盒子，不是 img。
- **绝对定位元素的出牌/气泡落点必须等状态稳定再测**：`.played-stack` 的 owner 类会在 NPC 回合间切换，需 `waitForFunction` 等落定。

## CSS 维护
- 判定死类**必须**用 `npm run css:classes` 采集真实 DOM 类名后取差集，不能静态 grep——大量类名是模板字符串拼接（`band-${n}`、`lv${n}`、`from-${id}`）。
- 清理用 `npm run css:prune`（带 KEEP 白名单），格式化用 `npm run css:format`。

## 测试
- `npm run verify` = lint + typecheck + test + build + verify:fixtures。提交前必跑。
- `npx playwright test` 必须**加 `--output=<临时目录>`**：默认目录会触发沙箱批量删除保护。
- `playwright.config.mjs` 的 `reuseExistingServer: false` 不可改回 true——服务端状态在内存里，复用会导致测试间状态泄漏。
- **`reuseExistingServer: false` 是按文件隔离，不是按用例**：会改服务端状态的用例（如出牌）必须放文件**末尾**并注明原因，否则污染同文件后续用例的断言。
- 独立截图配置 `playwright.shot.config.mjs` 指向 4173，**必须显式写 `testMatch: /.*\.mjs/`**（Playwright 默认只认 `*.spec.*`/`*.test.*`）。采集脚本放 `tests/shots/`。
