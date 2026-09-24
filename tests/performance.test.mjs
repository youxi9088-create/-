import test from 'node:test';
import assert from 'node:assert/strict';
import { planSettlement, nextSettlementStage } from '../packages/performance-core/index.mjs';

const library = {
  'pal-linxing': [
    { outfitId: 'starry-gown', name: '星夜礼服', dance: '月光步', layerSnapshot: { base: 'b', outfit: 'o1', effect: 'f1' } },
    { outfitId: 'rose-waltz', name: '蔷薇圆舞', dance: '蔷薇旋转', layerSnapshot: { base: 'b', outfit: 'o2', effect: 'f2' } },
    { outfitId: 'dawn-silk', name: '晨曦纱裙', dance: '晨辉步', layerSnapshot: { base: 'b', outfit: 'o3', effect: 'f3' } }
  ]
};
const win = (gameId, alreadyUnlocked = []) => ({ gameId, winnerId: 'player', loserPalIds: ['pal-linxing'], multiplier: 3, alreadyUnlocked, outfitLibrary: library });

test('settlement is deterministic and first unlock follows the outfit library order', () => {
  const first = planSettlement(win('g1'));
  const second = planSettlement(win('g1'));
  assert.deepEqual(first, second);
  assert.equal(first.isFirstUnlock, true);
  assert.equal(first.card.outfitId, 'starry-gown');
  assert.equal(first.card.rarity, 'first');
  assert.equal(first.card.upgradeLevel, 1);
  assert.equal(first.card.serialNo, 1);
  assert.equal(nextSettlementStage('PERFORMANCE'), 'PHOTO_REVEAL');
});

test('each win unlocks the next outfit, then repeats upgrade the same card', () => {
  const one = planSettlement(win('g1'));
  const two = planSettlement(win('g2', [one.card]));
  assert.equal(two.card.outfitId, 'rose-waltz');
  assert.equal(two.card.serialNo, 2);
  const three = planSettlement(win('g3', [one.card, two.card]));
  assert.equal(three.card.outfitId, 'dawn-silk');
  const fourth = planSettlement(win('g4', [one.card, two.card, three.card]));
  assert.equal(fourth.isFirstUnlock, false);
  assert.equal(fourth.card.rarity, 'normal');
  assert.equal(fourth.card.upgradeLevel, 2);
  assert.equal(fourth.card.serialNo, 1, 'upgrade keeps the original serial number');
  const fifth = planSettlement(win('g5', [one.card, two.card, three.card, fourth.card]));
  assert.equal(fifth.card.outfitId, 'rose-waltz');
  assert.equal(fifth.card.upgradeLevel, 2);
});

test('losing player gets no photo card and token delta stays negative', () => {
  const lost = planSettlement({ gameId: 'g6', winnerId: 'pal-linxing', loserPalIds: [], multiplier: 3, outfitLibrary: library });
  assert.equal(lost.card, null);
  assert.equal(lost.cardId, null);
  assert.equal(lost.tokenDelta, -3);
});

test('photo card carries audited identity, layer snapshot and game stats', () => {
  const result = planSettlement({ ...win('g7'), gameStats: { rounds: 4, lastCombo: '顺子' }, unlockedAt: '2026-09-12T06:00:00.000Z' });
  assert.match(result.card.auditRecordId, /^audit-/);
  assert.equal(result.card.layerSnapshot.outfit, 'o1');
  assert.equal(result.card.gameStats.rounds, 4);
  assert.equal(result.card.gameStats.lastCombo, '顺子');
  assert.equal(result.card.unlockedAt, '2026-09-12T06:00:00.000Z');
  assert.equal(result.card.seen, false);
});
