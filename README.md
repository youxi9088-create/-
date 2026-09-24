# 换装斗地主 MVP

本项目根据《变装斗地主 MVP—Agent 实现技术设计文档 V1.1》交付一个可在本机试玩的、无外部 AI 密钥依赖的产品切片。它是 Web PC 单机 NPC 斗地主；角色均为明确的成年外观纯虚构角色，Token 没有现金、转赠、兑换或押注价值。

## 启动

```powershell
cd 'E:\AI改编游戏\换装斗地主'
npm install
npm run dev
```

打开 `http://127.0.0.1:4173`。进入“开始首局”后按：叫 3 分 → 提示 → 出牌（六次）→ 查看变装演出 → 揭晓写真卡 → 前往写真馆，即可走完首次闭环。

## 已实现的可玩路径

- 大厅 → 叫分 → 服务端校验合法出牌 → 两名官方牌友的静态台词/动作反馈 → 胜负结算。
- 结算四阶段：胜负 → 败方变装演出 → 首次服装×舞蹈翻卡 → 写真馆/再开一局。
- 两名官方牌友：林星、米娅；均有身份、审核记录、动作包、台词包、预设备轨和 L2 降级。
- Token 余额仅由本地权威服务更新；结算记录带 HMAC 签名的 receipt，客户端不能提交 Token、胜负或牌型。
- 牌友工坊：一句话 → PalIntent 安全门 → Mock 候选 → audit record → `DEGRADED_READY` 可确认资产。真实模型未配置时明确降级，不会阻塞上桌。
- 检查器：只读查看最新 GameSnapshot、事件序列、账本、工坊版本、审核和 Provider 降级状态。

## 架构边界

```text
Browser UI
  → local HTTP command boundary
  → GameService / RuleEngineAdapter boundary
  → GameSnapshot + GameEvent contract

Pal generation prompt
  → intent gate → mock preset → audit + fallback
  → PalAsset contract → runtime presentation

Round settle
  → performance-core deterministic plan
  → receipt / photo unlock / L2 fallback replay
```

长期核心资产均独立于页面与路由：

- `packages/contracts`：版本化 Snapshot 和 PalAsset 合同。
- `packages/pal-asset-contract`：官方牌友资产与动作降级选择。
- `packages/performance-core`：确定性结算、演出轨迹与首次解锁。
- `packages/pal-generation-core`：输入策略门、Mock 编排与候选资产。

## 验证

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run verify:fixtures
npm run test:e2e
```

`test:e2e` 覆盖大厅 → 牌桌 → 结算 → 备轨演出 → 翻卡 → 写真馆的真实浏览器路径。规则测试含 100 次单张比较回归、非法牌拒绝与幂等重复命令检查。

## 诚实的当前边界

- 本地 `GameService` 是可玩的服务端权威引导 Runtime；RLCard/DouZero 未安装，因此尚未完成其兼容矩阵或真实 NPC 策略接入。业务接口已隔离在 RuleEngineAdapter 边界。
- 当前使用 HTTP 命令/快照恢复而非 WebSocket、Redis/PostgreSQL 或对象存储；这些是上线演进项，不能视为已验收。
- 真实 LLM/图像/视频/审核 Provider、主轨视频、Docker 生产验证和真实四浏览器兼容验证均未配置。Mock/预设失败回退可被本地测试。
- 当前引导局是确定性牌局，目的是让首次体验稳定复现；完整 100+ 含飞机/四带二/春天的规则库回归、1000 局随机模拟、性能 P95 和公网部署仍是下一门禁。

详细的需求、结论、不回归基线和阶段证据见 [docs/MVP_EVIDENCE.md](docs/MVP_EVIDENCE.md)。
