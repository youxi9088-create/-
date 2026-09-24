# Asset licenses and provenance

## 官方牌友肖像样本（阶段二）

| 资源 | 用途 | 来源与版本 | 约束 |
| --- | --- | --- | --- |
| `apps/web/assets/pals/linxing-v1.png` | 林星：大厅、牌桌、结算、写真卡 | 2026-09-08，Codex 内建 ImageGen，项目专用生成 | 成年虚构角色；全身着安全服装；无文字、无真人参考、无外部品牌。 |
| `apps/web/assets/pals/mia-v1.png` | 米娅：大厅、牌桌 | 2026-09-08，Codex 内建 ImageGen，项目专用生成 | 成年虚构角色；全身着安全服装；无文字、无真人参考、无外部品牌。 |
| `apps/web/assets/pals/linxing-actions-v1.png` | 林星 A01-A05：待机、出牌、过牌、胜利、失败 | 2026-09-08，Codex 内建 ImageGen，以项目内林星形象为参考生成 | 六格动作表；成年虚构角色；无文字、无真人参考、无外部品牌。 |
| `apps/web/assets/pals/mia-actions-v1.png` | 米娅 A01-A05：待机、出牌、过牌、胜利、失败 | 2026-09-08，Codex 内建 ImageGen，原创成年虚构职业舞台角色 | 六格动作表；深色舞台底；无文字、无真人参考、无外部品牌。 |
| `apps/web/assets/club-night-v2.png` | 大厅与牌桌的月夜会所场景底图 | 2026-09-08，Codex 内建 ImageGen，项目专用生成并二次移除筹码、硬币、扑克牌与饮品元素 | 无人物、无文字、无品牌；仅承载虚构的非交易型桌游会所氛围。 |
| `apps/web/assets/pals/video/linxing-*.webm` | 林星 A01–A05：待机、出牌、过牌、胜利、失败 | 用户提供：`角色五态包/linxing`，2026-09-08 直接拷贝接入 | 原始 VP9 WebM；MVP 按用户指示直接使用，不作抠像或转码。 |
| `apps/web/assets/pals/video/mia-A01-idle-v1.webm` | 米娅 A01 待机 | 用户提供：`角色五态包/mia`，2026-09-08 直接拷贝接入 | 原始 VP9 WebM；A02–A05 暂保留动作表回退。 |
| `apps/web/assets/pals/video/*-entry-v1.mp4` | 林星、米娅入局出场演出 | 用户提供：`角色五态包/*/*出场.mp4`，2026-09-08 直接拷贝接入 | 原始 H.264 MP4；仅在“进入今晚牌局”后播放，可跳过。 |

所有资源均明确标识为 AI 虚构内容；正式牌友在可见运行时使用稳定文件路径和 `audit-official-*-v1` 记录。林星的五态 WebM 通过 A01–A05 运行时合同接入牌桌、结算与写真馆回放；米娅仅提供 A01 WebM，其余状态保留动作表回退。

在接入真实 Provider 或商业素材前，必须记录：素材 ID、来源、许可、审核记录、角色版本、地区限制和回退资源。未记录的资产不得进入可见 Runtime。
