import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT_VERSION, validateGameSnapshot, validatePalAsset, validatePhotoCard, validateLayeredAppearance } from '../packages/contracts/index.mjs';

test('game snapshot requires a versioned three-player server contract', () => {
  const valid = { contractVersion: CONTRACT_VERSION, phase: 'PLAYING', seq: 3, playerHand: [], players: [{}, {}, {}], tokenBalance: 0 };
  assert.equal(validateGameSnapshot(valid), valid);
  assert.throws(() => validateGameSnapshot({ ...valid, contractVersion: '0' }), /contractVersion/);
  assert.throws(() => validateGameSnapshot({ ...valid, players: [] }), /three players/);
});

test('visible pal asset cannot omit audit, adult fictional identity or a complete runtime pack', () => {
  const actions = Object.fromEntries(['A01', 'A02', 'A03', 'A04', 'A05'].map((key) => [key, { action: key }]));
  const dialogue = Object.fromEntries(['idle', 'play', 'pass', 'win', 'lose'].map((key) => [key, [key]]));
  const asset = { contractVersion: CONTRACT_VERSION, palId: 'p', readiness: 'READY', auditRecordId: 'audit-1', identity: { adultAppearance: true, fictional: true }, appearance: { portraitRef: 'asset://portrait' }, actionPack: actions, dialoguePack: dialogue, fallback: { actionLevel: 'L2' } };
  assert.equal(validatePalAsset(asset), asset);
  assert.throws(() => validatePalAsset({ ...asset, auditRecordId: '' }), /audited/);
  assert.throws(() => validatePalAsset({ ...asset, identity: { adultAppearance: false, fictional: true } }), /adult fictional/);
  assert.throws(() => validatePalAsset({ ...asset, actionPack: {} }), /five-state action pack/);
});

test('layered appearance requires base and outfit layers; model refs are optional slots', () => {
  assert.equal(validateLayeredAppearance({ base: 'b', outfit: 'o' }).base, 'b');
  assert.throws(() => validateLayeredAppearance({ base: '', outfit: 'o' }), /base layer/);
  assert.throws(() => validateLayeredAppearance({ base: 'b' }), /outfit layer/);
  const actions = Object.fromEntries(['A01', 'A02', 'A03', 'A04', 'A05'].map((key) => [key, { action: key }]));
  const dialogue = Object.fromEntries(['idle', 'play', 'pass', 'win', 'lose'].map((key) => [key, [key]]));
  const asset = { contractVersion: CONTRACT_VERSION, palId: 'p', readiness: 'READY', auditRecordId: 'audit-1', identity: { adultAppearance: true, fictional: true }, appearance: { portraitRef: 'asset://portrait', live2dRef: 'asset://model.model3.json', layers: { base: 'b', outfit: 'o' }, outfitLibrary: [{ outfitId: 'x', name: 'x', dance: 'x', layerSnapshot: { base: 'b', outfit: 'o' } }] }, actionPack: actions, dialoguePack: dialogue, fallback: { actionLevel: 'L2' } };
  assert.equal(validatePalAsset(asset), asset);
  assert.throws(() => validatePalAsset({ ...asset, appearance: { ...asset.appearance, layers: { base: 'b' } } }), /outfit layer/);
});

test('photo card contract locks serial, rarity, upgrade level and audit', () => {
  const card = { cardId: 'pal-linxing:starry-gown', palId: 'pal-linxing', outfitId: 'starry-gown', outfitName: '星夜礼服', dance: '月光步', layerSnapshot: { base: 'b', outfit: 'o' }, serialNo: 1, rarity: 'first', upgradeLevel: 1, seen: false, unlockedAt: '2026-09-12T00:00:00.000Z', auditRecordId: 'audit-1' };
  assert.equal(validatePhotoCard(card), card);
  assert.throws(() => validatePhotoCard({ ...card, serialNo: 0 }), /serial number/);
  assert.throws(() => validatePhotoCard({ ...card, rarity: 'legendary' }), /rarity/);
  assert.throws(() => validatePhotoCard({ ...card, upgradeLevel: 6 }), /upgrade level/);
  assert.throws(() => validatePhotoCard({ ...card, auditRecordId: '' }), /audit record/);
});
