import { CONTRACT_VERSION, validatePalAsset } from '../contracts/index.mjs';

const blocked = [/\b(?:celebrity|star|actor)\b/i, /明星|名人|真人|照片|未成年|学生制服|裸露|色情|情色/];
export function validateIntent(prompt) {
  const text = String(prompt || '').trim();
  if (text.length < 6) return { ok: false, gate: 'PL-1', reason: '描述至少需要 6 个字符。' };
  if (blocked.some((rule) => rule.test(text))) return { ok: false, gate: 'PL-7', reason: '仅支持成年外观的纯虚构角色，且不接受真人、名人或越界描述。' };
  return { ok: true, value: { sourceText: text, adultAppearance: true, fictional: true, style: pickStyle(text) } };
}
function pickStyle(text) { return /复古|优雅/.test(text) ? '复古优雅' : /运动/.test(text) ? '运动明快' : '舞台轻奢'; }

export function createMockCandidate({ prompt, version = 1 }) {
  const intent = validateIntent(prompt);
  if (!intent.ok) return { status: 'BLOCKED', ...intent };
  const suffix = Math.abs([...prompt].reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % 9999;
  const asset = validatePalAsset({
    contractVersion: CONTRACT_VERSION,
    palId: `pal-user-${suffix}`,
    version,
    readiness: 'DEGRADED_READY',
    auditRecordId: `audit-mock-${suffix}-v${version}`,
    identity: { name: `牌友 ${String(suffix).padStart(4, '0')}`, fictional: true, adultAppearance: true, aiLabel: 'AI 虚构角色（Mock 预设）' },
    appearance: { accent: '#8e69ff', outfit: `${intent.value.style}套装`, dance: '预设节拍', portraitRef: 'preset://mock/portrait', actionSheetRef: 'preset://mock/actions' },
    actionPack: { A01: { action: 'idle', sheetRef: 'preset://mock/actions', frame: [0, 0] }, A02: { action: 'play', sheetRef: 'preset://mock/actions', frame: [1, 0] }, A03: { action: 'pass', sheetRef: 'preset://mock/actions', frame: [2, 0] }, A04: { action: 'win', sheetRef: 'preset://mock/actions', frame: [0, 1] }, A05: { action: 'lose', sheetRef: 'preset://mock/actions', frame: [1, 1] } },
    dialoguePack: { idle: ['我准备好了。'], play: ['这一手交给我。'], pass: ['先观察一下。'], win: ['节奏不错。'], lose: ['下一轮继续。'] },
    performance: { mainTrack: null, fallbackTrack: 'preset://mock/dance-skeletal' },
    fallback: { actionLevel: 'L2', reason: '真实 Provider 未配置，已应用已审预设资产。' }
  });
  return { status: 'DEGRADED_READY', intent: intent.value, asset, trace: ['PalIntent', 'mock portrait', 'policy audit', 'preset action pack', 'fallback performance'] };
}
