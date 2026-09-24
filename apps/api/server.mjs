import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GameService } from './game-engine.mjs';
import { createOfficialPal } from '../../packages/pal-asset-contract/index.mjs';
import { createMockCandidate } from '../../packages/pal-generation-core/index.mjs';

const root = fileURLToPath(new URL('../web/', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webm': 'video/webm', '.mp4': 'video/mp4' };
const linxingOutfits = [
  { outfitId: 'starry-gown', name: '星夜礼服', dance: '月光步', layerSnapshot: { base: '/assets/pals/linxing-v1.png', outfit: '/assets/pals/outfits/linxing-starry-gown.jpg', effect: '/assets/pals/outfits/linxing-starry-gown-fx.png' } },
  { outfitId: 'rose-waltz', name: '蔷薇圆舞', dance: '蔷薇旋转', layerSnapshot: { base: '/assets/pals/linxing-v1.png', outfit: '/assets/pals/outfits/linxing-rose-waltz.jpg', effect: '/assets/pals/outfits/linxing-rose-waltz-fx.png' } },
  { outfitId: 'dawn-silk', name: '晨曦纱裙', dance: '晨辉步', layerSnapshot: { base: '/assets/pals/linxing-v1.png', outfit: '/assets/pals/outfits/linxing-dawn-silk.jpg', effect: '/assets/pals/outfits/linxing-dawn-silk-fx.png' } }
];
const miaOutfits = [
  { outfitId: 'mint-stage', name: '薄荷舞台装', dance: '彩带律动', layerSnapshot: { base: '/assets/pals/mia-v1.png', outfit: '/assets/pals/outfits/mia-mint-stage.jpg', effect: '/assets/pals/outfits/mia-mint-stage-fx.png' } },
  { outfitId: 'violet-rock', name: '紫电摇滚装', dance: '电流滑步', layerSnapshot: { base: '/assets/pals/mia-v1.png', outfit: '/assets/pals/outfits/mia-violet-rock.jpg', effect: '/assets/pals/outfits/mia-violet-rock-fx.png' } },
  { outfitId: 'sailor-wave', name: '海盐水手服', dance: '浪花摇摆', layerSnapshot: { base: '/assets/pals/mia-v1.png', outfit: '/assets/pals/outfits/mia-sailor-wave.jpg', effect: '/assets/pals/outfits/mia-sailor-wave-fx.png' } }
];
const officialPals = [
  createOfficialPal({ palId: 'pal-linxing', name: '林星', accent: '#ff7aa8', outfit: '星夜礼服', dance: '月光步', portraitRef: '/assets/pals/linxing-v1.png', actionSheetRef: '/assets/pals/linxing-actions-v1.png', entryVideoRef: '/assets/pals/video/linxing-entry-v2.mp4', actionVideoRefs: { A01: '/assets/pals/video/linxing-A01-idle-v1.webm', A02: '/assets/pals/video/linxing-A02-play-v1.webm', A03: '/assets/pals/video/linxing-A03-pass-v1.webm', A04: '/assets/pals/video/linxing-A04-win-v1.webm', A05: '/assets/pals/video/linxing-A05-lose-v1.webm' }, outfits: linxingOutfits, standeeRef: '/assets/pals/linxing-standee.png' }),
  createOfficialPal({ palId: 'pal-mia', name: '米娅', accent: '#7dd3fc', outfit: '薄荷舞台装', dance: '彩带律动', portraitRef: '/assets/pals/mia-v1.png', actionSheetRef: '/assets/pals/mia-actions-v1.png', entryVideoRef: '/assets/pals/video/mia-entry-v1.mp4', actionVideoRefs: { A01: '/assets/pals/video/mia-A01-idle-v1.webm' }, outfits: miaOutfits, standeeRef: '/assets/pals/mia-standee.png' })
];
const game = new GameService({ receiptSecret: process.env.TOKEN_RECEIPT_SECRET, palDialogue: Object.fromEntries(officialPals.map((pal) => [pal.palId, pal.dialoguePack])), palOutfits: { 'pal-linxing': linxingOutfits, 'pal-mia': miaOutfits } });
let latestGameId = null;
let workshop = { versions: [], confirmed: null };

function send(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
async function body(req) { let raw = ''; for await (const chunk of req) raw += chunk; try { return raw ? JSON.parse(raw) : {}; } catch { throw new Error('请求 JSON 无法解析。'); } }
function error(res, message, status = 400) { send(res, status, { error: message }); }
async function api(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/api/game/new') { const data = await body(req); const options = Number.isInteger(data.seed) ? { seed: data.seed } : {}; latestGameId = game.newGame(options).id; return send(res, 201, game.snapshot(game.get(latestGameId))); }
  if (req.method === 'GET' && pathname === '/api/game') return latestGameId ? send(res, 200, game.snapshot(game.get(latestGameId))) : send(res, 200, { game: null });
  if (req.method === 'POST' && pathname === '/api/game/bid') { const data = await body(req); return send(res, 200, game.bid(data.gameId, data.score, data.commandId)); }
  if (req.method === 'GET' && pathname === '/api/game/hint') { const id = new URL(req.url, 'http://local').searchParams.get('gameId'); return send(res, 200, game.hint(id)); }
  if (req.method === 'POST' && pathname === '/api/game/play') { const data = await body(req); return send(res, 200, game.play(data.gameId, data.cards, data.commandId)); }
  if (req.method === 'POST' && pathname === '/api/game/pass') { const data = await body(req); return send(res, 200, game.pass(data.gameId, data.commandId)); }
  if (req.method === 'POST' && pathname === '/api/game/advance-turn') { const data = await body(req); return send(res, 200, game.advanceTurn(data.gameId, data.commandId)); }
  if (req.method === 'POST' && pathname === '/api/game/settlement/advance') { const data = await body(req); return send(res, 200, game.advanceSettlement(data.gameId)); }
  if (req.method === 'GET' && pathname === '/api/pals') return send(res, 200, { official: officialPals, workshop });
  if (req.method === 'POST' && pathname === '/api/pals/generate') { const data = await body(req); const result = createMockCandidate({ prompt: data.prompt, version: workshop.versions.length + 1 }); if (result.status !== 'BLOCKED') workshop.versions.push(result); return send(res, 200, result); }
  if (req.method === 'POST' && pathname === '/api/pals/confirm') { const data = await body(req); const candidate = workshop.versions.find((item) => item.asset?.palId === data.palId); if (!candidate) throw new Error('没有可确认的候选牌友。'); workshop.confirmed = candidate.asset; return send(res, 200, { confirmed: workshop.confirmed }); }
  if (req.method === 'GET' && pathname === '/api/gallery') return send(res, 200, { cards: game.getGallery(), officialPals });
  if (req.method === 'POST' && pathname === '/api/gallery/seen') { const data = await body(req); return send(res, 200, { cards: game.markCardSeen(data.cardId) }); }
  if (req.method === 'GET' && pathname === '/api/inspect') return send(res, 200, { generatorMode: 'mock', moderationMode: 'mock', game: latestGameId ? game.snapshot(game.get(latestGameId)) : null, ledger: game.getLedger(), workshop, officialPals, providerNote: '正式牌友使用项目内 AI 生成肖像、A01-A05 动作表与台词包；UGC 工坊仍是受控 Mock 预设，主动作资源缺失时才使用 L2 备轨。' });
  if (req.method === 'GET' && pathname === '/health') return send(res, 200, { ok: true, mode: 'mock', ruleRuntime: 'local authoritative adapter' });
  return false;
}
export const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(req.url.split('?')[0]);
    if (pathname.startsWith('/api/') || pathname === '/health') { const handled = await api(req, res, pathname); if (handled !== false) return; return error(res, 'API route not found', 404); }
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^[/\\]+/, '');
    const path = normalize(join(root, relative));
    if (!path.startsWith(normalize(root))) return error(res, 'Forbidden', 403);
    const info = await stat(path); if (!info.isFile()) throw new Error('not a file');
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(await readFile(path));
  } catch (err) { error(res, err.message || 'Unexpected server error', 400); }
});
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  server.listen(port, '127.0.0.1', () => console.log(`换装斗地主 MVP: http://127.0.0.1:${port}`));
}
