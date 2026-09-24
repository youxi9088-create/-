import test from 'node:test';
import assert from 'node:assert/strict';
import { GameService, classify, canBeat, rankOf, shuffledDeck } from '../apps/api/game-engine.mjs';

test('rule classifier recognizes MVP core card types and bomb precedence', () => {
  assert.equal(classify(['3♣'])?.type, 'SINGLE');
  assert.equal(classify(['3♣', '3♦'])?.type, 'PAIR');
  assert.equal(classify(['3♣', '3♦', '3♥'])?.type, 'TRIPLE');
  assert.equal(classify(['3♣', '3♦', '3♥', '3♠'])?.type, 'BOMB');
  assert.equal(classify(['3♣', '4♣', '5♣', '6♣', '7♣'])?.type, 'STRAIGHT');
  assert.equal(classify(['10♣', 'J♣', 'Q♣', 'K♣', 'A♣', '2♣']), null);
  assert.equal(canBeat(classify(['7♣', '7♦', '7♥', '7♠']), classify(['A♣'])), true);
});
test('100 generated single comparisons retain strict ordering', () => {
  const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  for (let index = 0; index < 100; index += 1) { const low = ranks[index % (ranks.length - 1)]; const high = ranks[(index % (ranks.length - 1)) + 1]; assert.equal(canBeat(classify([`${high}♣`]), classify([`${low}♣`])), true); }
});
test('each deal is a complete shuffled deck and the landlord receives bottom cards after bidding', () => {
  const firstDeck = shuffledDeck(1);
  const secondDeck = shuffledDeck(2);
  assert.equal(firstDeck.length, 54);
  assert.equal(new Set(firstDeck).size, 54);
  assert.notDeepEqual(firstDeck, secondDeck);
  const service = new GameService();
  const first = service.newGame({ seed: 1 });
  const second = service.newGame({ seed: 2 });
  assert.equal(first.playerHand.length, 17);
  assert.equal(new Set(first.playerHand).size, 17);
  assert.notDeepEqual(first.playerHand, second.playerHand);
  const afterBid = service.bid(first.id, 3, 'deal-bid');
  assert.equal(afterBid.playerHand.length, 20);
  assert.equal(afterBid.players.find((player) => player.id === 'player').count, 20);
  assert.equal(afterBid.events.at(-1).type, 'BID_RESOLVED');
  assert.equal(afterBid.events.at(-1).bottomCards.length, 3);
});
test('authoritative game resolves visible NPC turns instead of resetting both opponents to pass', () => {
  const service = new GameService(); const created = service.newGame({ seed: 42 });
  assert.throws(() => service.play(created.id, [created.playerHand[0]], 'before-bid'), /尚未开始/);
  let game = service.bid(created.id, 3, 'bid-1'); assert.equal(game.phase, 'PLAYING');
  const firstCard = game.playerHand[0];
  const differentRankCard = game.playerHand.find((card) => rankOf(card) !== rankOf(firstCard));
  assert.throws(() => service.play(created.id, [firstCard, differentRankCard], 'bad-shape'), /合法牌型/);
  const hint = service.hint(created.id);
  game = service.play(created.id, hint.cards, 'play-1');
  assert.equal(game.turn, 'pal-linxing'); assert.equal(game.currentCombo.label, hint.combo.label);
  game = service.advanceTurn(created.id, 'pal-turn-1');
  assert.equal(game.events.at(-1).type, 'PAL_ACTION');
  assert.match(game.events.at(-1).decision, /PLAY|PASS/);
  assert.equal(game.turn, 'pal-mia');
  game = service.advanceTurn(created.id, 'pal-turn-2');
  assert.equal(game.events.at(-1).type, 'PAL_ACTION'); assert.equal(game.turn, 'player');
  if (game.currentCombo && game.lastPlayerId !== 'player') {
    const pass = service.pass(created.id, 'player-pass'); assert.equal(pass.events.at(-1).type, 'PLAYER_PASS');
    const duplicate = service.pass(created.id, 'player-pass'); assert.equal(duplicate.seq, pass.seq);
  }
});
