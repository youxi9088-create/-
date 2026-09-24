import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { CONTRACT_VERSION, validateGameSnapshot } from '../../packages/contracts/index.mjs';
import { planSettlement, nextSettlementStage } from '../../packages/performance-core/index.mjs';

const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', 'SJ', 'BJ'];
const VALUE = Object.fromEntries(RANKS.map((rank, index) => [rank, index + 3]));
const suits = ['♣', '♦', '♥', '♠'];
const turnOrder = ['player', 'pal-linxing', 'pal-mia'];

export function rankOf(card) { return card.replace(/[♣♦♥♠]/g, ''); }
export function cardValue(card) { return VALUE[rankOf(card)]; }
export function sortCards(cards) { return [...cards].sort((a, b) => cardValue(a) - cardValue(b)); }

export function classify(cards) {
  const sorted = sortCards(cards);
  if (!sorted.length) return null;
  const values = sorted.map(cardValue);
  const same = values.every((value) => value === values[0]);
  if (sorted.length === 2 && new Set(sorted.map(rankOf)).size === 2 && sorted.every((card) => ['SJ', 'BJ'].includes(rankOf(card)))) return { type: 'ROCKET', value: 99, length: 2, label: '王炸' };
  if (same && sorted.length === 1) return { type: 'SINGLE', value: values[0], length: 1, label: '单张' };
  if (same && sorted.length === 2) return { type: 'PAIR', value: values[0], length: 2, label: '对子' };
  if (same && sorted.length === 3) return { type: 'TRIPLE', value: values[0], length: 3, label: '三张' };
  if (same && sorted.length === 4) return { type: 'BOMB', value: values[0], length: 4, label: '炸弹' };
  const unique = [...new Set(values)];
  if (sorted.length >= 5 && unique.length === sorted.length && Math.max(...values) < VALUE['2'] && unique.every((value, index) => index === 0 || value === unique[index - 1] + 1)) return { type: 'STRAIGHT', value: Math.max(...values), length: sorted.length, label: '顺子' };
  return null;
}

export function canBeat(candidate, current) {
  if (!candidate) return false;
  if (!current) return true;
  if (candidate.type === 'ROCKET') return true;
  if (current.type === 'ROCKET') return false;
  if (candidate.type === 'BOMB' && current.type !== 'BOMB') return true;
  return candidate.type === current.type && candidate.length === current.length && candidate.value > current.value;
}

function candidateMoves(hand) {
  const byRank = new Map();
  for (const card of sortCards(hand)) {
    const cards = byRank.get(rankOf(card)) || [];
    cards.push(card);
    byRank.set(rankOf(card), cards);
  }
  const moves = [];
  for (const cards of byRank.values()) {
    moves.push([cards[0]]);
    if (cards.length >= 2) moves.push(cards.slice(0, 2));
    if (cards.length >= 3) moves.push(cards.slice(0, 3));
    if (cards.length >= 4) moves.push(cards.slice(0, 4));
  }
  const straightRanks = RANKS.filter((rank) => rank !== '2' && rank !== 'SJ' && rank !== 'BJ' && byRank.has(rank));
  for (let start = 0; start < straightRanks.length; start += 1) {
    for (let end = start + 5; end <= straightRanks.length; end += 1) {
      const ranks = straightRanks.slice(start, end);
      if (ranks.every((rank, index) => index === 0 || VALUE[rank] === VALUE[ranks[index - 1]] + 1)) moves.push(ranks.map((rank) => byRank.get(rank)[0]));
      else break;
    }
  }
  if (byRank.has('SJ') && byRank.has('BJ')) moves.push([byRank.get('SJ')[0], byRank.get('BJ')[0]]);
  return moves.map((cards) => ({ cards, combo: classify(cards) })).filter((move) => move.combo);
}

function nextTurn(id) { return turnOrder[(turnOrder.indexOf(id) + 1) % turnOrder.length]; }
function playerFor(game, id) { return game.players.find((player) => player.id === id); }
function moveScore(move) { return (move.combo.type === 'BOMB' ? 10_000 : move.combo.type === 'ROCKET' ? 20_000 : 0) + move.combo.value * 100 + move.combo.length; }

function fullDeck() { return RANKS.flatMap((rank) => rank === 'SJ' || rank === 'BJ' ? [rank] : suits.map((suit) => `${rank}${suit}`)); }
function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}
export function shuffledDeck(seed = randomBytes(4).readUInt32BE(0)) {
  const deck = fullDeck();
  const next = seededRandom(seed);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapAt = Math.floor(next() * (index + 1));
    [deck[index], deck[swapAt]] = [deck[swapAt], deck[index]];
  }
  return deck;
}
function dealCards(seed) {
  const deck = shuffledDeck(seed);
  return {
    playerHand: sortCards(deck.slice(0, 17)),
    npcHands: { 'pal-linxing': sortCards(deck.slice(17, 34)), 'pal-mia': sortCards(deck.slice(34, 51)) },
    bottomCards: sortCards(deck.slice(51))
  };
}

export class GameService {
  constructor({ receiptSecret = 'development-only-change-before-production', palDialogue = {}, palOutfits = {} } = {}) {
    this.receiptSecret = receiptSecret;
    this.palDialogue = palDialogue;
    this.palOutfits = palOutfits;
    this.games = new Map();
    this.gallery = new Map();
    this.ledger = [];
  }
  newGame({ seed = randomBytes(4).readUInt32BE(0) } = {}) {
    const id = randomUUID();
    const dealt = dealCards(seed);
    const game = {
      id, dealSeed: seed >>> 0, phase: 'BIDDING', seq: 0, playerHand: dealt.playerHand, bottomCards: dealt.bottomCards,
      players: [
        { id: 'player', name: '你', role: null, count: 17 },
        { id: 'pal-linxing', name: '林星', role: null, count: 17 },
        { id: 'pal-mia', name: '米娅', role: null, count: 17 }
      ],
      npcHands: dealt.npcHands,
      turn: 'player', currentCombo: null, currentCards: [], lastPlayerId: null, passCount: 0, eventLog: [], commandCache: new Map(),
      settlement: null, settlementStage: null, tokenBalance: 12, multiplier: 1
    };
    this.games.set(id, game);
    this.emit(game, 'GAME_CREATED', { message: '牌局已创建，等待叫分。', dealRef: `deal-${game.dealSeed.toString(16).padStart(8, '0')}` });
    return this.snapshot(game);
  }
  bid(gameId, score, commandId) {
    return this.idempotent(gameId, commandId, (game) => {
      if (game.phase !== 'BIDDING') throw new Error('当前不在叫分阶段。');
      if (Number(score) !== 3) throw new Error('MVP 引导局请叫 3 分，立即开始。');
      game.phase = 'PLAYING'; game.multiplier = 3;
      game.playerHand = sortCards([...game.playerHand, ...game.bottomCards]);
      game.players[0].count = game.playerHand.length;
      game.players.forEach((player) => { player.role = player.id === 'player' ? '地主' : '农民'; });
      this.emit(game, 'BID_RESOLVED', { bidder: 'player', score: 3, bottomCards: game.bottomCards, dialogue: `叫 3 分，领取底牌：${game.bottomCards.join(' ')}。地主先出。` });
      return this.snapshot(game);
    });
  }
  hint(gameId) {
    const game = this.get(gameId);
    if (game.phase !== 'PLAYING' || game.turn !== 'player') throw new Error('请等待当前牌友完成回合。');
    const legal = candidateMoves(game.playerHand).filter((move) => canBeat(move.combo, game.currentCombo)).sort((a, b) => moveScore(a) - moveScore(b))[0];
    return legal
      ? { cards: legal.cards, combo: legal.combo, message: `已标出可出的${legal.combo.label}。` }
      : { cards: [], combo: null, message: '当前没有可压制的牌，可选择“不出”。' };
  }
  play(gameId, cards, commandId) {
    return this.idempotent(gameId, commandId, (game) => {
      if (game.phase !== 'PLAYING') throw new Error('牌局尚未开始或已结算。');
      if (game.turn !== 'player') throw new Error('尚未轮到你出牌。');
      if (!Array.isArray(cards) || !cards.length || !cards.every((card) => game.playerHand.includes(card))) throw new Error('请选择自己手中的牌。');
      const combo = classify(cards);
      if (!combo) throw new Error('这不是合法牌型。可用“提示”查看引导局推荐。');
      if (!canBeat(combo, game.currentCombo)) throw new Error('当前牌型无法压过上一手。');
      game.playerHand = game.playerHand.filter((card) => !cards.includes(card));
      game.players[0].count = game.playerHand.length;
      game.currentCombo = combo; game.currentCards = cards; game.lastPlayerId = 'player'; game.passCount = 0;
      this.emit(game, 'PLAY_ACCEPTED', { playerId: 'player', cards, combo, dialogue: '出得漂亮！' });
      if (!game.playerHand.length) this.settle(game, 'player'); else game.turn = nextTurn('player');
      return this.snapshot(game);
    });
  }
  pass(gameId, commandId) {
    return this.idempotent(gameId, commandId, (game) => {
      if (game.phase !== 'PLAYING' || game.turn !== 'player') throw new Error('尚未轮到你选择不出。');
      if (!game.currentCombo || game.lastPlayerId === 'player') throw new Error('本轮由你领出，需要先出一手牌。');
      this.emit(game, 'PLAYER_PASS', { playerId: 'player', dialogue: '这手不跟。' });
      this.completePass(game, 'player');
      return this.snapshot(game);
    });
  }
  advanceTurn(gameId, commandId) {
    return this.idempotent(gameId, commandId, (game) => {
      if (game.phase !== 'PLAYING' || game.turn === 'player') throw new Error('当前不需要推进牌友回合。');
      const pal = game.turn;
      const hand = game.npcHands[pal];
      const move = candidateMoves(hand).filter((candidate) => canBeat(candidate.combo, game.currentCombo)).sort((a, b) => moveScore(a) - moveScore(b))[0];
      if (!move) {
        const dialogue = this.palDialogue[pal]?.pass?.[0] || '这手先观察。';
        this.emit(game, 'PAL_ACTION', { playerId: pal, action: 'A03', dialogue, presentation: 'L1', decision: 'PASS' });
        this.completePass(game, pal);
        return this.snapshot(game);
      }
      game.npcHands[pal] = hand.filter((card) => !move.cards.includes(card));
      playerFor(game, pal).count = game.npcHands[pal].length;
      game.currentCombo = move.combo; game.currentCards = move.cards; game.lastPlayerId = pal; game.passCount = 0;
      this.emit(game, 'PAL_ACTION', { playerId: pal, action: 'A02', cards: move.cards, combo: move.combo, dialogue: this.palDialogue[pal]?.play?.[0] || '这一手，我来接。', presentation: 'L1', decision: 'PLAY' });
      if (!game.npcHands[pal].length) this.settle(game, pal); else game.turn = nextTurn(pal);
      return this.snapshot(game);
    });
  }
  completePass(game, playerId) {
    const leader = game.lastPlayerId;
    game.passCount += 1;
    if (game.passCount < 2) { game.turn = nextTurn(playerId); return; }
    game.currentCombo = null; game.currentCards = []; game.lastPlayerId = null; game.passCount = 0; game.turn = leader;
    this.emit(game, 'ROUND_RESET', { message: `${playerFor(game, leader).name} 获得新一轮领出权。`, leaderId: leader });
  }
  settle(game, winnerId) {
    if (game.phase === 'SETTLED') return;
    game.phase = 'SETTLED';
    const loserPalIds = winnerId === 'player' ? ['pal-linxing', 'pal-mia'] : [];
    const unlocked = this.gallery.get('player') || [];
    const rounds = game.eventLog.filter((event) => event.type === 'ROUND_RESET').length + 1;
    game.settlement = planSettlement({
      gameId: game.id, winnerId, loserPalIds, multiplier: game.multiplier,
      alreadyUnlocked: unlocked, outfitLibrary: this.palOutfits,
      gameStats: { rounds, lastCombo: game.currentCombo?.label || null },
      unlockedAt: new Date().toISOString()
    });
    game.settlementStage = 'RESULT';
    if (game.settlement.tokenDelta < 0) this.recordLedger(game, game.settlement.tokenDelta);
    if (game.settlement.card) {
      const cards = [...unlocked];
      const index = cards.findIndex((entry) => entry.cardId === game.settlement.card.cardId);
      if (index >= 0) cards[index] = { ...game.settlement.card, serialNo: cards[index].serialNo };
      else cards.push(game.settlement.card);
      this.gallery.set('player', cards);
    }
    this.emit(game, 'ROUND_SETTLED', { settlement: game.settlement, message: '牌局结束，进入结算演出。' });
  }
  advanceSettlement(gameId) {
    const game = this.get(gameId);
    if (!game.settlement) throw new Error('尚未进入结算。');
    game.settlementStage = nextSettlementStage(game.settlementStage);
    this.emit(game, 'SETTLEMENT_STAGE', { stage: game.settlementStage });
    return this.snapshot(game);
  }
  snapshot(game) {
    return validateGameSnapshot({
      contractVersion: CONTRACT_VERSION, id: game.id, phase: game.phase, seq: game.seq, playerHand: game.playerHand,
      players: game.players.map(({ id, name, role, count }) => ({ id, name, role, count })), turn: game.turn, lastPlayerId: game.lastPlayerId,
      currentCombo: game.currentCombo, currentCards: game.currentCards, events: game.eventLog.slice(-14), settlement: game.settlement, settlementStage: game.settlementStage,
      tokenBalance: game.tokenBalance, multiplier: game.multiplier
    });
  }
  recordLedger(game, delta) {
    game.tokenBalance = Math.max(0, game.tokenBalance + delta);
    const receipt = { id: `receipt-${game.id}`, gameId: game.id, delta, balance: game.tokenBalance, issuedAt: new Date().toISOString() };
    receipt.signature = createHmac('sha256', this.receiptSecret).update(JSON.stringify(receipt)).digest('hex');
    this.ledger.push(receipt); return receipt;
  }
  emit(game, type, payload) { game.seq += 1; game.eventLog.push({ seq: game.seq, type, at: new Date().toISOString(), ...payload }); }
  get(id) { const game = this.games.get(id); if (!game) throw new Error('找不到牌局，请重新开始。'); return game; }
  idempotent(gameId, commandId, fn) { const game = this.get(gameId); if (!commandId) throw new Error('命令缺少幂等键。'); if (game.commandCache.has(commandId)) return game.commandCache.get(commandId); const result = fn(game); game.commandCache.set(commandId, result); return result; }
  getGallery() { return this.gallery.get('player') || []; }
  markCardSeen(cardId) {
    const cards = this.getGallery().map((entry) => (entry.cardId === cardId ? { ...entry, seen: true } : entry));
    this.gallery.set('player', cards);
    return cards;
  }
  getLedger() { return this.ledger; }
}
