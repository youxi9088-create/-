import { npcDelay, prefs, SPEED_LABEL, cycleSpeed, setPref } from './runtime.js';
import { sfx, primeAudio } from './sfx.js';

const validRoutes = new Set(['home', 'table', 'workshop', 'gallery', 'inspector']);
const routeFromHash = () => validRoutes.has(location.hash.replace(/^#\//, '')) ? location.hash.replace(/^#\//, '') : 'home';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = {
  route: routeFromHash(), game: null, selected: new Set(), workshop: null, workshopError: '',
  replay: null, entry: false, npcTimer: null,
  pals: [], palIndex: {}, galleryCards: [], galleryTab: 'all', galleryQuick: null,
  detail: null, flownFor: null, sfxFiredFor: null
};
const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const api = async (path, options = {}) => {
  const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || '请求失败');
  return payload;
};
const commandId = () => crypto.randomUUID();
function notice(message, bad = false) { toast.textContent = message; toast.className = `toast show${bad ? ' bad' : ''}`; clearTimeout(notice.timer); notice.timer = setTimeout(() => { toast.className = 'toast'; }, 3200); }
function escape(text = '') { return String(text).replace(/[&<>"']/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[s])); }
function updateToken() { document.querySelector('#tokenBalance').textContent = `◇ ${state.game?.tokenBalance ?? 12} Token`; }
function applyPrefs() {
  const current = prefs();
  const speedLabel = document.querySelector('#speedLabel');
  if (speedLabel) speedLabel.textContent = SPEED_LABEL[current.speed] || '标准';
  const sfxButton = document.querySelector('[data-action="toggle-sfx"]');
  if (sfxButton) {
    sfxButton.setAttribute('aria-pressed', String(current.sfx));
    sfxButton.classList.toggle('off', !current.sfx);
  }
  const sfxLabel = document.querySelector('#sfxLabel');
  if (sfxLabel) sfxLabel.textContent = current.sfx ? '音效开' : '音效关';
  document.documentElement.dataset.speed = current.speed;
}
function rank(card) { return card.replace(/[♣♦♥♠]/g, ''); }
function suit(card) { return card.match(/[♣♦♥♠]/)?.[0] || ''; }
function card(card, selected = false, disabled = false) { const red = /[♦♥]/.test(card); return `<button class="card ${red ? 'red' : ''} ${selected ? 'selected' : ''}" data-card="${card}" aria-pressed="${selected}"${disabled ? ' disabled aria-disabled="true"' : ''}><b>${rank(card)}</b><small>${suit(card)}</small></button>`; }
function tableCard(value) { const red = /[♦♥]/.test(value); return `<div class="table-card ${red ? 'red' : ''}" role="img" aria-label="桌面牌 ${value}"><b>${rank(value)}</b><small>${suit(value)}</small></div>`; }

/* ---------- pal assets & layered appearance ---------- */
const palName = (palId) => state.palIndex[palId]?.identity?.name || ({ player: '你' })[palId] || palId;
const silhouetteRef = (palId, outfitId) => `./assets/pals/outfits/${palId.replace('pal-', '')}-${outfitId}-silhouette.jpg`;
function latestOutfitFor(palId) {
  const pal = state.palIndex[palId];
  const library = pal?.appearance?.outfitLibrary || [];
  const unlocked = state.galleryCards.filter((entry) => entry.palId === palId);
  const latest = unlocked[unlocked.length - 1];
  return library.find((entry) => entry.outfitId === latest?.outfitId) || library[0] || null;
}
const actionFrame = { A01: ['0%', '0%'], A02: ['50%', '0%'], A03: ['100%', '0%'], A04: ['0%', '100%'], A05: ['50%', '100%'] };
function palStandee(palId, variant = '', action = null) {
  const pal = state.palIndex[palId];
  if (!pal) return '';
  const name = pal.identity.name;
  const alt = `${name}，成年虚构 AI 牌友，${pal.appearance.outfit}`;
  const outfit = latestOutfitFor(palId);
  const layers = outfit?.layerSnapshot || pal.appearance.layers;
  const standeeRef = pal.appearance.standeeRef;
  const idle = !action || action === 'A01';
  const frame = idle ? null : actionFrame[action];
  const label = ({ A01: '待机', A02: '出牌', A03: '过牌', A04: '胜利', A05: '失败' })[action];
  const videoRef = idle ? null : pal.actionPack?.[action]?.videoRef;
  const videoMotion = videoRef ? `<video class="action-video" autoplay muted playsinline preload="metadata" aria-label="${alt}，${label}动作"><source src="${videoRef}" type="video/webm" /></video>` : '';
  const spriteMotion = !videoRef && frame ? `<span class="action-sprite" role="img" aria-label="${alt}，${label}动作" style="--action-sheet:url('${pal.appearance.actionSheetRef}');--frame-x:${frame[0]};--frame-y:${frame[1]}"></span>` : '';
  if (standeeRef) {
    return `<div class="pal-avatar pal-standee cutout ${palId} ${variant} ${videoRef ? 'with-video' : ''}" data-pal="${palId}">
    <img class="layer layer-base" src="${standeeRef}" width="600" height="750" alt="${alt}" />
    ${videoMotion}<div class="pal-caption"><strong>${name}</strong><i>AI 虚构成年</i></div></div>`;
  }
  return `<div class="pal-avatar pal-standee ${palId} ${variant} ${videoRef ? 'with-video' : frame ? 'with-action' : ''}" data-pal="${palId}">
    <img class="layer layer-base" src="${layers.base}" width="600" height="800" alt="${frame ? '' : alt}" aria-hidden="${Boolean(frame)}" />
    ${layers.outfit && layers.outfit !== layers.base ? `<img class="layer layer-outfit" src="${layers.outfit}" width="600" height="800" alt="" aria-hidden="true" />` : ''}
    ${videoMotion || spriteMotion}<div class="pal-caption"><strong>${name}</strong><i>AI 虚构成年</i></div></div>`;
}
function eventText(event) {
  const name = palName(event.playerId) || '牌局';
  if (event.type === 'PLAY_ACCEPTED') return `${name}出牌：${(event.cards || []).join(' ')}。${event.dialogue || ''}`;
  if (event.type === 'PAL_ACTION' && event.decision === 'PLAY') return `${name}压制：${(event.cards || []).join(' ')}。${event.dialogue || ''}`;
  if (event.type === 'PAL_ACTION' && event.decision === 'PASS') return `${name}不出。${event.dialogue || ''}`;
  if (event.type === 'PLAYER_PASS') return '你选择不出。';
  return event.dialogue || event.message || event.type;
}
function entryCinematic() { return `<section class="entry-cinematic" role="dialog" aria-modal="true" aria-labelledby="entry-title"><video data-entry-primary data-entry-seg autoplay muted playsinline preload="auto" aria-hidden="true"><source src="./assets/pals/video/linxing-entry-v2.mp4" type="video/mp4" /></video><video data-entry-seg muted playsinline preload="auto" aria-hidden="true"><source src="./assets/pals/video/mia-entry-v1.mp4" type="video/mp4" /></video><p class="entry-kicker">今夜入席</p><div class="entry-caption" data-entry-caption><b>林星</b><span>夜色牌手 · 已就位</span></div><h2 id="entry-title" class="sr-only">两位 AI 牌友依次入场</h2><button class="entry-skip" data-action="close-entry">跳过入场 ⏎</button></section>`; }

/* ---------- home ---------- */
function renderHome() {
  app.innerHTML = `<section class="lounge-home">
    <div class="lounge-scrim" aria-hidden="true"></div><p class="lounge-kicker">DRESSBATTLE CLUB · SOLO TABLE</p>
    <div class="lounge-character left">${palStandee('pal-linxing', 'lounge-pal')}</div><div class="lounge-character right">${palStandee('pal-mia', 'lounge-pal')}</div>
    <div class="lounge-copy"><p class="eyebrow">今晚的牌局 · 两位 AI 牌友已入席</p><h1>月光落桌，<br/><span>以牌会友。</span></h1><p>单机经典斗地主。观察她们的动作、台词与出牌，赢下一局，看一场现场换装演出，把定格的写真卡收入卡册。</p><div class="hero-actions"><button class="primary lounge-cta" data-action="start">进入今晚牌局 <span>→</span></button><button class="secondary lounge-secondary" data-route="workshop">创建虚构牌友</button></div><p class="guard">纯虚构成年角色 · 无现金价值 · Token 不可交易或押注</p></div>
    <div class="lounge-brief"><div><b>01</b><span>服务端权威判定</span></div><div><b>02</b><span>逐位 AI 回合</span></div><div><b>03</b><span>现场换装与写真收集</span></div></div>
  </section>`;
}

/* ---------- table ---------- */
function renderTable() {
  const game = state.game;
  if (!game) { app.innerHTML = `<section class="empty"><h1>牌桌还没开局</h1><p>先在大厅创建一局引导牌，体验完整的首次收藏路径。</p><button class="primary" data-action="start">创建牌局</button></section>`; return; }
  const bidding = game.phase === 'BIDDING';
  const settled = game.phase === 'SETTLED';
  const players = Object.fromEntries(game.players.map((p) => [p.id, p]));
  const activePlayer = players[game.turn];
  const statusTitle = bidding ? '叫分决定地主' : settled ? '本局已结算' : game.turn === 'player' ? '你的回合' : `${activePlayer.name}的回合`;
  const statusCopy = bidding ? '本局预设为你叫 3 分，确认后由你先出牌。' : settled ? '胜负已由服务端写入结算轨迹。' : game.turn === 'player' ? (game.currentCombo && game.lastPlayerId !== 'player' ? '桌面有待压制的牌型；可以出更大的同类牌，或选择“不出”。' : '现在由你领出一手牌；“提示”会标出可出的合法牌型。') : `${activePlayer.name}正在根据桌面牌型思考，完成后才轮到下一位。`;
  const latestAction = (palId) => game.events.slice().reverse().find((event) => event.type === 'PAL_ACTION' && event.playerId === palId)?.action || 'A01';
  const palBubble = (palId) => { const event = game.events.slice().reverse().find((item) => item.type === 'PAL_ACTION' && item.playerId === palId); return event ? `<p class="pal-bubble">${escape(event.dialogue || '')}</p>` : ''; };
  app.innerHTML = `<section class="table-page">
    <aside class="table-side"><div class="round-tag">引导牌局 · 第 1 局</div><h1>${statusTitle}</h1><p>${statusCopy}</p></aside>
    <section class="table-board">
      <div class="table-felt"><div class="match-hud"><span>第 1 局 / BO3</span><b>地主 ×${game.multiplier}</b><span>${settled ? '本局结算' : game.turn === 'player' ? '轮到你' : `${activePlayer.name}回合`}</span></div><div class="felt-label">DRESSBATTLE <small>MOONLIT TABLE</small></div>
        <div class="opponent top">${palStandee('pal-linxing', '', latestAction('pal-linxing'))}<div><b>${players['pal-linxing'].role || '等待叫分'}</b><span>${players['pal-linxing'].count} 张</span></div><div class="back-cards">▣ ▣ ▣</div>${palBubble('pal-linxing')}</div>
        <div class="opponent right">${palStandee('pal-mia', '', latestAction('pal-mia'))}<div><b>${players['pal-mia'].role || '等待叫分'}</b><span>${players['pal-mia'].count} 张</span></div><div class="back-cards">▣ ▣ ▣</div>${palBubble('pal-mia')}</div>
        <div class="play-stage" role="status" aria-live="polite">${game.currentCombo ? `<div class="played-stack from-${game.lastPlayerId}"><p>桌面牌型 · ${game.currentCombo.label}</p><div class="table-card-fan">${(game.currentCards || []).map(tableCard).join('')}</div><b>${players[game.lastPlayerId]?.name || '未知'}已出</b></div>` : `<div class="lead-marker">${game.turn === 'player' ? '等待你领出第一手牌' : `${activePlayer.name}等待领出`}</div>`}<div class="turn-dock ${game.turn === 'player' ? 'active' : ''}">${settled ? '结算中' : game.turn === 'player' ? (game.currentCombo && game.lastPlayerId !== 'player' ? '轮到你 · 选择压制或不出' : '轮到你领出') : `${activePlayer.name}思考中…`}</div></div>
        <div class="self-seat"><span>${players.player.role || '你'} · ${players.player.count} 张</span></div>
      </div>
      <div class="hand-wrap"><div class="hand-header"><span>你的手牌 <b>${game.playerHand.length}</b></span><div>${bidding ? `<button class="primary compact" data-action="bid">叫 3 分</button>` : settled ? (game.settlementStage === 'RESULT' ? `<button class="primary compact" data-action="advance">${game.settlement?.card ? settlementLabel(game.settlementStage) : '查看结算'}</button>` : '<span class="settlement-progress">结算演出进行中</span>') : game.turn !== 'player' ? `<span class="turn-wait" aria-live="polite">${activePlayer.name}正在思考…</span>` : `<button class="secondary compact" data-action="hint">提示</button>${game.currentCombo && game.lastPlayerId !== 'player' ? '<button class="secondary compact" data-action="pass">不出</button>' : ''}<button class="primary compact" data-action="play">出牌</button>`}</div></div><div class="hand" aria-label="你的手牌">${game.playerHand.map((item) => card(item, state.selected.has(item), bidding || settled || game.turn !== 'player')).join('')}</div></div>
    </section>
    <aside class="event-feed"><h2>牌局记录</h2>${game.events.slice().reverse().slice(0, 4).map((event) => `<div class="event"><p>${escape(eventText(event))}</p></div>`).join('')}</aside>
  </section>${state.entry ? entryCinematic() : ''}${settled ? settlementOverlay(game) : ''}`;
}

/* ---------- settlement: live dress-up performance ---------- */
function settlementLabel(stage) { return ({ RESULT: '查看变装演出', PERFORMANCE: '揭晓写真卡', PHOTO_REVEAL: '前往写真馆', DESTINATION: '再开一局' })[stage] || '继续'; }
function dressupFigure(cardRecord, { autoplay = true } = {}) {
  const layers = cardRecord.layerSnapshot;
  const bands = [1, 2, 3].map((band) => `<img class="layer layer-outfit band band-${band}" src="${layers.outfit}" width="600" height="800" alt="" aria-hidden="true" style="--band:${band}" />`).join('');
  return `<figure class="dressup-figure ${autoplay && !reducedMotion() ? 'autoplay' : 'assembled'}">
    <img class="layer layer-base" src="${layers.base}" width="600" height="800" alt="${escape(cardRecord.outfitName)}着装前的角色" />
    ${bands}
    ${layers.effect ? `<img class="layer layer-fx" src="${layers.effect}" width="600" height="800" alt="" aria-hidden="true" />` : ''}
  </figure>`;
}
function settlementPerformanceBody(cardRecord) {
  const pack = state.palIndex[cardRecord.palId]?.actionPack || {};
  const action = ['A05', 'A04', 'A01'].find((a) => pack[a]?.videoRef);
  const videoRef = action ? pack[action].videoRef : null;
  if (!videoRef || reducedMotion()) return dressupFigure(cardRecord);
  return `<video class="settlement-action-video" data-settlement-video autoplay muted playsinline preload="auto" aria-label="${escape(palName(cardRecord.palId))}换装演出"><source src="${videoRef}" type="video/webm" /></video>`;
}
function settlementOverlay(game) {
  const s = game.settlement; const stage = game.settlementStage; const visible = stage !== 'RESULT';
  const eyebrow = ({ RESULT: '胜负已分', PERFORMANCE: '舞台演出', PHOTO_REVEAL: '写真卡', DESTINATION: '散场' })[stage] || stage;
  const cardRecord = s.card;
  if (!cardRecord) {
    const title = stage === 'RESULT' ? '这一局惜败' : '下一局等你开场';
    const winnerPal = state.palIndex[s.winnerId];
    const winnerName = winnerPal ? winnerPal.identity.name : '牌友';
    const winVideo = stage === 'PERFORMANCE' && !reducedMotion() ? (winnerPal?.actionPack?.A04?.videoRef || winnerPal?.actionPack?.A01?.videoRef || null) : null;
    const stageClass = winVideo ? 'dressup-stage' : 'dressup-stage plain';
    const stageBody = winVideo ? `<video class="settlement-action-video" autoplay muted playsinline preload="auto" aria-label="${escape(winnerName)}守住舞台"><source src="${winVideo}" type="video/webm" /></video>` : '';
    const summary = stage === 'RESULT' ? `倍率 ×${s.multiplier}。${winnerName}守住了舞台，重开一局再挑战。` : `「${winnerName}」保住了自己的服装。Token 已由服务端账本结算。`;
    return `<section class="settlement ${visible ? 'show' : ''}" role="dialog" aria-modal="true" aria-labelledby="settlement-title"><div class="settlement-card dressup-modal"><div class="${stageClass}"><div class="dressup-spotlight" aria-hidden="true"></div>${stageBody}<div class="settlement-stage-head"><p class="eyebrow">${eyebrow}</p><h2 id="settlement-title">${title}</h2></div><div class="settlement-video-footer"><p class="settlement-video-description">${summary}</p><div class="modal-actions">${visible ? '<button class="secondary compact" data-action="skip-settlement">跳过演出 →</button>' : ''}<button class="primary" data-action="restart">再开一局</button><button class="secondary" data-route="gallery">打开写真馆</button></div></div></div></div></section>`;
  }
  const name = palName(cardRecord.palId);
  const isUpgrade = !s.isFirstUnlock;
  const title = stage === 'RESULT' ? '你赢下了这一局'
    : stage === 'PERFORMANCE' ? `${name}现场换上「${cardRecord.outfitName}」`
    : stage === 'PHOTO_REVEAL' ? (isUpgrade ? `写真卡升级 · Lv.${cardRecord.upgradeLevel}` : '首次收藏已解锁')
    : '下一局等你开场';
  const summary = stage === 'RESULT' ? `倍率 ×${s.multiplier}。败方牌友将现场换装，定格画面收入写真馆。`
    : stage === 'PERFORMANCE' ? `「${cardRecord.outfitName} × ${cardRecord.dance}」正在登台。`
    : stage === 'PHOTO_REVEAL' ? (isUpgrade ? `「${cardRecord.outfitName}」再次解锁，卡面升至 Lv.${cardRecord.upgradeLevel}。` : `「${cardRecord.outfitName} × ${cardRecord.dance}」已写入写真馆 No.${String(cardRecord.serialNo).padStart(3, '0')}。`)
    : '重开引导局，或查看已收集的写真。';
  const stageBody = stage === 'PHOTO_REVEAL' || stage === 'DESTINATION'
    ? `<div class="photo-card-reveal" data-card="${cardRecord.cardId}">${photoCardArt(cardRecord, { large: true })}</div>`
    : stage === 'PERFORMANCE' ? settlementPerformanceBody(cardRecord)
    : dressupFigure(cardRecord);
  return `<section class="settlement ${visible ? 'show' : ''}" role="dialog" aria-modal="true" aria-labelledby="settlement-title"><div class="settlement-card dressup-modal"><div class="dressup-stage"><div class="dressup-spotlight" aria-hidden="true"></div>${stageBody}<div class="settlement-stage-head"><p class="eyebrow">${eyebrow}</p><h2 id="settlement-title">${title}</h2></div><div class="settlement-video-footer"><p class="settlement-video-description">${summary}</p><div class="modal-actions">${stage !== 'DESTINATION' ? '<button class="secondary compact" data-action="skip-settlement">跳过演出 →</button>' : ''}<button class="primary" data-action="advance">${settlementLabel(stage)}</button>${stage === 'DESTINATION' ? '<button class="secondary" data-route="gallery">打开写真馆</button>' : ''}</div></div></div></div></section>`;
}

/* ---------- photo cards ---------- */
function photoCardArt(cardRecord, { large = false } = {}) {
  const layers = cardRecord.layerSnapshot;
  const lv = Math.min(cardRecord.upgradeLevel || 1, 5);
  return `<div class="pcard-art lv${lv} ${cardRecord.rarity === 'first' ? 'first' : ''}" data-lv="${lv}">
    <img class="layer layer-outfit" src="${layers.outfit}" width="600" height="800" alt="${escape(cardRecord.outfitName)}写真卡面" ${large ? '' : 'loading="lazy"'} />
    ${layers.effect ? `<img class="layer layer-fx" src="${layers.effect}" width="600" height="800" alt="" aria-hidden="true" />` : ''}
    <span class="pcard-frame" aria-hidden="true"></span>
    <span class="pcard-serial">No.${String(cardRecord.serialNo).padStart(3, '0')}</span>
    ${lv > 1 ? `<span class="pcard-lv">Lv.${lv}</span>` : ''}
  </div>`;
}
const totalOutfits = () => state.pals.reduce((sum, pal) => sum + (pal.appearance?.outfitLibrary?.length || 0), 0);
const collectionPoints = () => state.galleryCards.reduce((sum, entry) => sum + (entry.upgradeLevel || 1), 0);
function gallerySlots() {
  const slots = [];
  for (const pal of state.pals) {
    for (const outfit of pal.appearance?.outfitLibrary || []) {
      const cardId = `${pal.palId}:${outfit.outfitId}`;
      const record = state.galleryCards.find((entry) => entry.cardId === cardId);
      slots.push({ pal, outfit, cardId, record });
    }
  }
  return slots;
}
function filteredSlots() {
  return gallerySlots().filter(({ pal, record }) => {
    if (state.galleryTab !== 'all' && pal.palId !== state.galleryTab) return false;
    if (state.galleryQuick === 'new') return record && !record.seen;
    if (state.galleryQuick === 'first') return record?.rarity === 'first';
    if (state.galleryQuick === 'missing') return !record;
    return true;
  });
}
function renderGallery() {
  const unlocked = state.galleryCards.length;
  const total = totalOutfits();
  const points = collectionPoints();
  const tab = (id, label) => `<button class="chip ${state.galleryTab === id ? 'active' : ''}" data-action="gallery-tab" data-tab="${id}" aria-pressed="${state.galleryTab === id}">${label}</button>`;
  const quick = (id, label) => `<button class="chip ${state.galleryQuick === id ? 'active' : ''}" data-action="gallery-quick" data-quick="${id}" aria-pressed="${state.galleryQuick === id}">${label}</button>`;
  const slots = filteredSlots();
  app.innerHTML = `<section class="gallery">
    <div class="gallery-head"><div><p class="eyebrow">COLLECTION · LIVE DRESS-UP</p><h1>写真馆</h1><p>每张卡都是一场现场换装演出的定格。重复解锁同一服装会让卡面升级，纯视觉、无数值。</p></div>
      <div class="collection-progress" role="status"><b>${unlocked} / ${total}</b><span>已解锁写真卡</span><div class="progress-track"><i style="width:${total ? Math.round(unlocked / total * 100) : 0}%"></i></div><span class="points">收藏点 ◆ ${points}</span></div></div>
    <div class="gallery-filters">${tab('all', '全部')}${tab('pal-linxing', '林星')}${tab('pal-mia', '米娅')}<span class="filter-gap"></span>${quick('new', '新！')}${quick('first', '金框')}${quick('missing', '缺失')}</div>
    <div class="gallery-grid${slots.length && slots.length <= 4 ? ' solo' : ''}" id="galleryGrid">${slots.length ? slots.map(gallerySlot).join('') : '<div class="empty-line">当前筛选下没有写真卡。</div>'}</div>
  </section>${state.detail ? detailOverlay() : ''}${state.replay ? replayOverlay(state.replay) : ''}`;
}
function gallerySlot({ pal, outfit, cardId, record }) {
  const name = pal.identity.name;
  if (!record) {
    return `<article class="pcard locked" data-card="${cardId}" tabindex="0" role="button" aria-label="未解锁：${escape(outfit.name)}，赢下${name}解锁">
      <div class="pcard-art locked-art"><img src="${silhouetteRef(pal.palId, outfit.outfitId)}" width="600" height="800" alt="" aria-hidden="true" loading="lazy" /><span class="pcard-frame" aria-hidden="true"></span><span class="pcard-serial">No.???</span></div>
      <div class="pcard-copy"><h2>？？？</h2><p>赢下${name}解锁</p></div></article>`;
  }
  return `<article class="pcard ${record.seen ? '' : 'is-new'}" data-card="${cardId}" tabindex="0" role="button" aria-label="写真卡：${escape(record.outfitName)} × ${escape(record.dance)}，${record.rarity === 'first' ? '初回限定' : '常规'}，等级 ${record.upgradeLevel}">
    ${photoCardArt(record)}${record.seen ? '' : '<span class="pcard-new" aria-hidden="true">新！</span>'}
    <div class="pcard-copy"><h2>${escape(record.outfitName)}</h2><p>${escape(name)} · ${escape(record.dance)}</p></div></article>`;
}

/* ---------- card detail ---------- */
function unlockedCardsInView() { return filteredSlots().filter((slot) => slot.record).map((slot) => slot.record); }
function detailOverlay() {
  const cards = unlockedCardsInView();
  const index = cards.findIndex((entry) => entry.cardId === state.detail);
  const record = cards[index] || state.galleryCards.find((entry) => entry.cardId === state.detail);
  if (!record) return '';
  const name = palName(record.palId);
  const stats = record.gameStats || {};
  const unlockedAt = record.unlockedAt && !record.unlockedAt.startsWith('1970') ? new Date(record.unlockedAt).toLocaleString('zh-CN') : '引导局首胜';
  return `<section class="card-detail" role="dialog" aria-modal="true" aria-labelledby="detail-title">
    <button class="detail-nav prev" data-action="detail-prev" aria-label="上一张" ${cards.length > 1 ? '' : 'disabled'}>‹</button>
    <div class="detail-card">${photoCardArt(record, { large: true })}</div>
    <div class="detail-info"><p class="eyebrow">${record.rarity === 'first' ? '✦ 初回限定' : '写真卡'} · Lv.${record.upgradeLevel}</p><h2 id="detail-title">${escape(record.outfitName)} × ${escape(record.dance)}</h2>
      <dl><div><dt>牌友</dt><dd>${escape(name)}</dd></div><div><dt>编号</dt><dd>No.${String(record.serialNo).padStart(3, '0')}</dd></div><div><dt>获得</dt><dd>${escape(unlockedAt)}</dd></div><div><dt>那一局</dt><dd>倍率 ×${stats.multiplier ?? '—'} · ${stats.rounds ?? '—'} 轮 · 终手 ${escape(stats.lastCombo || '—')}</dd></div><div><dt>审核</dt><dd>${escape(record.auditRecordId)}</dd></div></dl>
      <div class="detail-actions"><button class="primary compact" data-action="replay-card" data-card="${record.cardId}">回放换装演出</button><button class="secondary compact" data-action="export-card" data-card="${record.cardId}">导出卡面 PNG</button><button class="secondary compact" data-action="close-detail">关闭</button></div>
      <p class="detail-hint">← → 切换相邻写真卡 · Esc 关闭</p></div>
    <button class="detail-nav next" data-action="detail-next" aria-label="下一张" ${cards.length > 1 ? '' : 'disabled'}>›</button>
  </section>`;
}
function stepDetail(direction) {
  const cards = unlockedCardsInView();
  if (cards.length < 2) return;
  const index = cards.findIndex((entry) => entry.cardId === state.detail);
  const next = cards[(index + direction + cards.length) % cards.length];
  state.detail = next.cardId;
}

/* ---------- replay & export ---------- */
function replayOverlay(replay) {
  return `<section class="replay-overlay" role="dialog" aria-modal="true" aria-labelledby="replay-title"><div class="replay-card dressup-replay"><div class="dressup-stage inline">${dressupFigure(replay)}</div><div class="replay-head"><p class="eyebrow">换装演出 · 回放</p><h2 id="replay-title">${escape(replay.name)} · ${escape(replay.outfitName)}</h2></div><div class="replay-footer"><p>回放不会影响已收藏的写真卡。</p></div><button class="secondary replay-close" data-action="close-replay">关闭回放</button></div></section>`;
}
const loadImage = (src) => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
async function exportCardPng(record) {
  const canvas = document.createElement('canvas');
  canvas.width = 600; canvas.height = 800;
  const ctx = canvas.getContext('2d');
  const layers = record.layerSnapshot;
  const outfit = await loadImage(layers.outfit);
  ctx.drawImage(outfit, 0, 0, 600, 800);
  if (layers.effect) ctx.drawImage(await loadImage(layers.effect), 0, 0, 600, 800);
  ctx.strokeStyle = record.rarity === 'first' ? '#f5d78c' : '#c9b8df';
  ctx.lineWidth = 10; ctx.strokeRect(5, 5, 590, 790);
  ctx.fillStyle = 'rgba(5,8,15,.72)'; ctx.fillRect(0, 690, 600, 110);
  ctx.fillStyle = '#fff8e9'; ctx.font = '700 30px sans-serif'; ctx.fillText(`${record.outfitName} × ${record.dance}`, 24, 736);
  ctx.font = '600 20px sans-serif'; ctx.fillStyle = '#eed49b';
  ctx.fillText(`No.${String(record.serialNo).padStart(3, '0')} · Lv.${record.upgradeLevel} · ${palName(record.palId)}`, 24, 770);
  const link = document.createElement('a');
  link.download = `${record.cardId.replace(':', '-')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/* ---------- workshop & inspector (unchanged scope) ---------- */
function renderWorkshop() {
  const history = state.workshop?.versions || [];
  app.innerHTML = `<section class="workshop"><div class="workshop-intro"><p class="eyebrow">MOCK PROVIDER · POLICY GATES ON</p><h1>牌友工坊</h1><p>把一句话转成可上桌的纯虚构成年牌友。此 MVP 使用可追溯的 Mock 预设，不调用真实图像、视频或台词模型。</p><ul><li>PL-1：输入完整性</li><li>PL-7：成年、虚构、非真人与服装边界</li><li>缺少主资源时：DEGRADED_READY + L2 备轨</li></ul></div><form class="generator" id="generator"><label for="prompt">描述你的成年虚构牌友</label><textarea id="prompt" name="pal-prompt" autocomplete="off" aria-describedby="prompt-note prompt-error" aria-invalid="${Boolean(state.workshopError)}" minlength="6" required placeholder="例如：一位复古优雅的成年虚构魔术师，喜欢舞台灯光与蓝紫配色…"></textarea><p class="form-note" id="prompt-note">禁止真人、名人、照片上传、年龄模糊或越界服装描述。</p><p class="field-error" id="prompt-error" role="alert">${escape(state.workshopError)}</p><button class="primary" type="submit">生成 Mock 候选 <span aria-hidden="true">→</span></button></form><section class="version-chain"><h2>版本链</h2>${history.length ? history.slice().reverse().map((entry) => `<article class="candidate"><div class="candidate-portrait" aria-hidden="true">✦</div><div><b>${escape(entry.asset.identity.name)}</b><p>${escape(entry.intent.style)} · ${entry.status}</p><small>${escape(entry.asset.auditRecordId)} · ${escape(entry.asset.fallback.reason)}</small></div><button class="secondary compact" data-action="confirm" data-pal="${entry.asset.palId}">确认建档</button></article>`).join('') : '<div class="empty-line">尚无候选。成功生成后可在此确认并保留版本轨迹。</div>'}</section></section>`;
}
function renderInspector() {
  app.innerHTML = `<section class="inspector"><div><p class="eyebrow">INTERNAL QA · READ ONLY</p><h1>运行检查器</h1><p>用于核对 Contract、降级、Token 账本和审核链路；不是面向玩家的功能。</p></div><pre id="inspectOutput">正在读取本地运行时…</pre></section>`;
  api('/api/inspect').then((data) => { document.querySelector('#inspectOutput').textContent = JSON.stringify(data, null, 2); }).catch((err) => notice(err.message, true));
}

/* ---------- flow control ---------- */
function scheduleNpcTurn() {
  const needsNpcTurn = state.route === 'table' && state.game?.phase === 'PLAYING' && state.game.turn !== 'player';
  if (!needsNpcTurn) { clearTimeout(state.npcTimer); state.npcTimer = null; return; }
  if (state.npcTimer) return;
  state.npcTimer = window.setTimeout(async () => {
    state.npcTimer = null;
    try {
      state.game = await api('/api/game/advance-turn', { method: 'POST', body: JSON.stringify({ gameId: state.game.id, commandId: commandId() }) });
      const last = state.game.events.slice().reverse().find((item) => item.type === 'PAL_ACTION');
      if (last) sfx(last.decision === 'PLAY' ? 'play' : 'pass');
      render();
    }
    catch (err) { notice(`牌友回合未完成：${err.message}`, true); }
  }, npcDelay());
}
function render() {
  updateToken();
  applyPrefs();
  document.querySelectorAll('nav a').forEach((link) => { const active = link.dataset.route === state.route; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
  ({ home: renderHome, table: renderTable, workshop: renderWorkshop, gallery: renderGallery, inspector: renderInspector }[state.route] || renderHome)();
  scheduleNpcTurn();
  updateGalleryBadge();
  if (state.game?.phase === 'SETTLED' && state.game?.settlement && state.sfxFiredFor !== state.game.id) {
    state.sfxFiredFor = state.game.id;
    sfx(state.game.settlement.winnerId === 'player' ? 'win' : 'lose');
  }
  if (state.game?.phase === 'SETTLED' && state.game.settlementStage === 'PHOTO_REVEAL' && state.game.settlement?.card) flyCardOnce(state.game);
  if (state.entry) requestAnimationFrame(() => {
    document.querySelector('[data-action="close-entry"]')?.focus();
    const segs = Array.from(document.querySelectorAll('[data-entry-seg]'));
    const caption = document.querySelector('[data-entry-caption]');
    const captions = ['<b>林星</b><span>夜色牌手 · 已就位</span>', '<b>米娅</b><span>薄荷主场 · 已就位</span>'];
    const closeEntry = () => { state.entry = false; render(); };
    segs.forEach((video, index) => {
      video.addEventListener('ended', () => {
        const next = segs[index + 1];
        if (!next) { closeEntry(); return; }
        next.classList.add('show');
        if (caption && captions[index + 1]) caption.innerHTML = captions[index + 1];
        next.play().catch(closeEntry);
      }, { once: true });
      video.addEventListener('error', () => { const next = segs[index + 1]; if (next) { next.classList.add('show'); if (caption && captions[index + 1]) caption.innerHTML = captions[index + 1]; next.play().catch(closeEntry); } else closeEntry(); }, { once: true });
    });
    segs[0]?.play().catch(() => {});
  });
  else if (state.detail) requestAnimationFrame(() => document.querySelector('[data-action="close-detail"]')?.focus());
  else if (state.replay) requestAnimationFrame(() => document.querySelector('[data-action="close-replay"]')?.focus());
  else if (state.game?.settlementStage && state.game.settlementStage !== 'RESULT') requestAnimationFrame(() => document.querySelector('.settlement .primary')?.focus());
  if (state.game?.settlementStage === 'PERFORMANCE') requestAnimationFrame(() => {
    const settleVideo = document.querySelector('[data-settlement-video]');
    if (!settleVideo) return;
    const cardRecord = state.game.settlement?.card;
    const swapToDressup = () => {
      if (!cardRecord || !settleVideo.isConnected) return;
      settleVideo.insertAdjacentHTML('afterend', dressupFigure(cardRecord));
      settleVideo.remove();
    };
    settleVideo.addEventListener('ended', swapToDressup, { once: true });
    settleVideo.addEventListener('error', swapToDressup, { once: true });
  });
}
function updateGalleryBadge() {
  const link = document.querySelector('nav a[data-route="gallery"]');
  if (!link) return;
  const unseen = state.galleryCards.filter((entry) => !entry.seen).length;
  link.classList.toggle('has-badge', unseen > 0);
  link.dataset.badge = unseen || '';
}
function flyCardOnce(game) {
  const key = `${game.id}:${game.settlement.card.cardId}:${game.settlement.card.upgradeLevel}`;
  if (state.flownFor === key || reducedMotion()) { state.flownFor = key; return; }
  state.flownFor = key;
  requestAnimationFrame(() => {
    const source = document.querySelector('.photo-card-reveal .pcard-art');
    const target = document.querySelector('nav a[data-route="gallery"]');
    if (!source || !target) return;
    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const ghost = source.cloneNode(true);
    ghost.className = `${source.className} fly-ghost`;
    Object.assign(ghost.style, { position: 'fixed', left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, margin: 0, zIndex: 90, pointerEvents: 'none' });
    document.body.appendChild(ghost);
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.6}px) scale(.42) rotate(-6deg)`, opacity: .95, offset: .55 },
      { transform: `translate(${dx}px,${dy}px) scale(.08)`, opacity: .2 }
    ], { duration: 1100, easing: 'cubic-bezier(.3,.7,.3,1)' }).onfinish = () => { ghost.remove(); target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 420 }); };
  });
}
async function refreshGallery() { const payload = await api('/api/gallery'); state.galleryCards = payload.cards || []; }
async function markSeen(cardId) {
  const record = state.galleryCards.find((entry) => entry.cardId === cardId);
  if (!record || record.seen) return;
  record.seen = true;
  try { await api('/api/gallery/seen', { method: 'POST', body: JSON.stringify({ cardId }) }); } catch { record.seen = false; }
  updateGalleryBadge();
}
async function start() { const seed = Number(window.__DRESSBATTLE_SEED); state.game = await api('/api/game/new', { method: 'POST', body: Number.isInteger(seed) && seed > 0 ? JSON.stringify({ seed }) : '{}' }); state.selected.clear(); state.entry = !window.__DRESSBATTLE_SKIP_ENTRY; state.flownFor = null; state.route = 'table'; if (location.hash !== '#/table') location.hash = '/table'; render(); notice('引导局已创建：先叫 3 分。'); }
async function navigate(route, { updateHash = true } = {}) {
  state.route = route;
  if (route !== 'gallery') { state.detail = null; state.replay = null; }
  if (updateHash && location.hash !== `#/${route}`) location.hash = `/${route}`;
  if (route === 'table' && !state.game) { const payload = await api('/api/game'); state.game = payload.game ?? payload; }
  if (route === 'workshop') { const payload = await api('/api/pals'); state.workshop = payload.workshop; }
  if (route === 'gallery') await refreshGallery();
  render();
}

/* ---------- events ---------- */
document.addEventListener('click', async (event) => {
  const route = event.target.closest('[data-route]')?.dataset.route; if (route) { event.preventDefault(); return navigate(route); }
  const actionNode = event.target.closest('[data-action]');
  if (!actionNode) {
    const cardNode = event.target.closest('[data-card]');
    if (cardNode && state.game?.phase === 'PLAYING' && state.route === 'table') { const value = cardNode.dataset.card; state.selected.has(value) ? state.selected.delete(value) : state.selected.add(value); sfx('select'); return render(); }
    if (state.route === 'table' && state.selected.size && event.target.closest('.table-felt')) { state.selected.clear(); sfx('pass'); return render(); }
    return;
  }
  try {
    const action = actionNode.dataset.action;
    if (action === 'toggle-speed') { cycleSpeed(); applyPrefs(); const label = SPEED_LABEL[prefs().speed]; notice(`牌友思考速度：${label}`); return; }
    if (action === 'toggle-sfx') { setPref('sfx', !prefs().sfx); applyPrefs(); primeAudio(); sfx('select'); notice(prefs().sfx ? '音效已开启。' : '音效已关闭。'); return; }
    if (action === 'start' || action === 'restart') return start();
    if (action === 'bid') state.game = await api('/api/game/bid', { method: 'POST', body: JSON.stringify({ gameId: state.game.id, score: 3, commandId: commandId() }) });
    if (action === 'hint') { const hint = await api(`/api/game/hint?gameId=${state.game.id}`); state.selected = new Set(hint.cards); notice(hint.message); }
    if (action === 'play') { state.game = await api('/api/game/play', { method: 'POST', body: JSON.stringify({ gameId: state.game.id, cards: [...state.selected], commandId: commandId() }) }); state.selected.clear(); const combo = state.game.currentCombo; sfx(combo?.type === 'BOMB' || combo?.type === 'ROCKET' ? 'bomb' : 'play'); }
    if (action === 'pass') { state.game = await api('/api/game/pass', { method: 'POST', body: JSON.stringify({ gameId: state.game.id, commandId: commandId() }) }); state.selected.clear(); sfx('pass'); }
    if (action === 'advance') {
      if (state.game.settlementStage === 'DESTINATION') return start();
      state.game = await api('/api/game/settlement/advance', { method: 'POST', body: JSON.stringify({ gameId: state.game.id }) });
      if (['PHOTO_REVEAL', 'DESTINATION'].includes(state.game.settlementStage)) await refreshGallery();
      if (state.game.settlementStage === 'PHOTO_REVEAL' && state.game.settlement?.card) sfx('unlock');
    }
    if (action === 'skip-settlement') {
      for (let step = 0; step < 5 && state.game.settlementStage !== 'DESTINATION'; step += 1) {
        state.game = await api('/api/game/settlement/advance', { method: 'POST', body: JSON.stringify({ gameId: state.game.id }) });
      }
      await refreshGallery();
      notice('已跳过演出。写真卡已收入写真馆。');
    }
    if (action === 'confirm') { const result = await api('/api/pals/confirm', { method: 'POST', body: JSON.stringify({ palId: actionNode.dataset.pal }) }); notice(`${result.confirmed.identity.name} 已建档，可作为后续上桌资源。`); state.workshop = (await api('/api/pals')).workshop; }
    if (action === 'gallery-tab') state.galleryTab = actionNode.dataset.tab;
    if (action === 'gallery-quick') state.galleryQuick = state.galleryQuick === actionNode.dataset.quick ? null : actionNode.dataset.quick;
    if (action === 'close-detail') state.detail = null;
    if (action === 'detail-prev') stepDetail(-1);
    if (action === 'detail-next') stepDetail(1);
    if (action === 'replay-card') { const record = state.galleryCards.find((entry) => entry.cardId === actionNode.dataset.card); if (record) state.replay = { ...record, name: palName(record.palId) }; }
    if (action === 'export-card') { const record = state.galleryCards.find((entry) => entry.cardId === actionNode.dataset.card); if (record) { await exportCardPng(record); notice('卡面 PNG 已导出。'); } }
    if (action === 'close-replay') state.replay = null;
    if (action === 'close-entry') state.entry = false;
    render();
  } catch (err) { notice(err.message, true); }
});
document.addEventListener('click', (event) => {
  const slot = event.target.closest('.pcard[data-card]');
  if (!slot || state.route !== 'gallery' || state.detail) return;
  const record = state.galleryCards.find((entry) => entry.cardId === slot.dataset.card);
  if (record) { state.detail = record.cardId; markSeen(record.cardId); render(); }
  else { slot.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); notice('还未解锁：赢下对应牌友，把这场换装演出带回写真馆。'); }
});
document.addEventListener('mouseover', (event) => {
  const slot = event.target.closest('.pcard.is-new[data-card]');
  if (!slot || state.route !== 'gallery') return;
  slot.classList.remove('is-new');
  slot.querySelector('.pcard-new')?.remove();
  markSeen(slot.dataset.card);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.matches?.('.pcard[data-card]')) { event.target.click(); }
  if (state.detail) {
    if (event.key === 'ArrowLeft') { stepDetail(-1); render(); }
    if (event.key === 'ArrowRight') { stepDetail(1); render(); }
    if (event.key === 'Escape') { state.detail = null; render(); }
  } else if (event.key === 'Escape' && state.replay) { state.replay = null; render(); }
  else if (state.route === 'table' && state.game?.phase === 'PLAYING' && state.game.turn === 'player') {
    const onControl = event.target.matches?.('button, a, textarea, input, select');
    if (event.key === 'Enter' && !onControl && state.selected.size) {
      event.preventDefault();
      document.querySelector('[data-action="play"]')?.click();
    }
    if (event.key === ' ' && !onControl) {
      event.preventDefault();
      document.querySelector('[data-action="hint"]')?.click();
    }
    if (event.key === 'Escape' && state.selected.size) { state.selected.clear(); sfx('pass'); render(); }
  }
});
document.addEventListener('submit', async (event) => { if (event.target.id !== 'generator') return; event.preventDefault(); try { const result = await api('/api/pals/generate', { method: 'POST', body: JSON.stringify({ prompt: document.querySelector('#prompt').value }) }); if (result.status === 'BLOCKED') { state.workshopError = `${result.gate}：${result.reason}`; notice(state.workshopError, true); } else { state.workshopError = ''; notice('候选已通过 Mock 编排，处于 DEGRADED_READY。'); state.workshop = (await api('/api/pals')).workshop; } render(); if (state.workshopError) document.querySelector('#prompt')?.focus(); } catch (err) { state.workshopError = err.message; notice(err.message, true); render(); document.querySelector('#prompt')?.focus(); } });
window.addEventListener('hashchange', () => navigate(routeFromHash(), { updateHash: false }));

/* ---------- boot ---------- */
async function boot() {
  applyPrefs();
  try {
    const payload = await api('/api/pals');
    state.pals = payload.official || [];
    state.palIndex = Object.fromEntries(state.pals.map((pal) => [pal.palId, pal]));
    state.workshop = payload.workshop;
    await refreshGallery();
  } catch (err) { notice(`资产合同加载失败：${err.message}`, true); }
  await navigate(state.route, { updateHash: false });
}
boot().catch((err) => { notice(err.message, true); render(); });
