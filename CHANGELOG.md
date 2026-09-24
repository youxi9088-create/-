# Changelog

## 0.1.0 — 2026-09-08

- 新增版本化 `GameSnapshot`、`PalAsset`、结算与生成 Contract。
- 新增本地服务端权威引导局：叫分、合法牌型校验、命令幂等、事件序列、结算和恢复快照。
- 新增两位成年虚构官方牌友、L1/L2 表现降级、静态台词包、预设变装备轨和写真卡解锁。
- 新增 Mock 牌友工坊、政策门、审核记录、版本链和 Inspector。
- 新增 Node/Playwright 验证与游戏 MVP 证据台账。

## Migration

无旧持久化数据。本版本 Contract 为 `1.0.0`；后续持久化接入必须在读取旧 Snapshot/PalAsset 前做显式 migration，不能以未校验 JSON 绕过 Contract。
