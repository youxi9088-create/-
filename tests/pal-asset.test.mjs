import test from 'node:test';
import assert from 'node:assert/strict';
import { createOfficialPal, selectPresentation, selectAppearancePresentation } from '../packages/pal-asset-contract/index.mjs';

const outfits = [
  { outfitId: 'starry-gown', name: '星夜礼服', dance: '月光步', layerSnapshot: { base: '/b.png', outfit: '/o1.jpg', effect: '/f1.png' } },
  { outfitId: 'rose-waltz', name: '蔷薇圆舞', dance: '蔷薇旋转', layerSnapshot: { base: '/b.png', outfit: '/o2.jpg', effect: '/f2.png' } }
];

test('official pal has audited fallback, action selection and direct video references', () => {
  const pal = createOfficialPal({
    palId: 'pal-test', name: '测试', accent: '#fff', outfit: '礼服', dance: '舞步',
    entryVideoRef: '/assets/pals/video/test-entry.mp4',
    actionVideoRefs: { A01: '/assets/pals/video/test-idle.webm', A02: '/assets/pals/video/test-play.webm' }
  });
  assert.equal(selectPresentation(pal, 'A02').level, 'L1');
  assert.equal(selectPresentation(pal, 'A10').level, 'L2');
  assert.equal(pal.appearance.entryVideoRef, '/assets/pals/video/test-entry.mp4');
  assert.equal(pal.actionPack.A01.videoRef, '/assets/pals/video/test-idle.webm');
  assert.equal(pal.actionPack.A02.videoRef, '/assets/pals/video/test-play.webm');
});

test('outfit library is validated and the first outfit becomes the default layered appearance', () => {
  const pal = createOfficialPal({ palId: 'pal-test', name: '测试', accent: '#fff', outfit: '礼服', dance: '舞步', outfits });
  assert.equal(pal.appearance.outfitLibrary.length, 2);
  assert.equal(pal.appearance.layers.outfit, '/o1.jpg');
  assert.throws(() => createOfficialPal({ palId: 'pal-bad', name: '坏', accent: '#fff', outfit: 'x', dance: 'x', outfits: [{ outfitId: '', name: 'x', dance: 'x', layerSnapshot: { base: 'b', outfit: 'o' } }] }), /outfit id/);
});

test('appearance presentation degrades live2d/vrm → layered → static', () => {
  const layered = createOfficialPal({ palId: 'pal-test', name: '测试', accent: '#fff', outfit: '礼服', dance: '舞步', outfits });
  assert.deepEqual(selectAppearancePresentation(layered), { level: 'L2', kind: 'layered', ref: layered.appearance.layers });
  const live2d = createOfficialPal({ palId: 'pal-test', name: '测试', accent: '#fff', outfit: '礼服', dance: '舞步', outfits, live2dRef: '/model.model3.json' });
  assert.equal(selectAppearancePresentation(live2d).level, 'L1');
  assert.equal(selectAppearancePresentation(live2d).kind, 'live2d');
  const vrm = createOfficialPal({ palId: 'pal-test', name: '测试', accent: '#fff', outfit: '礼服', dance: '舞步', outfits, vrmRef: '/model.vrm' });
  assert.equal(selectAppearancePresentation(vrm).kind, 'vrm');
  const plain = createOfficialPal({ palId: 'pal-test', name: '测试', accent: '#fff', outfit: '礼服', dance: '舞步' });
  assert.equal(plain.appearance.layers.outfit, plain.appearance.portraitRef);
  assert.equal(selectAppearancePresentation(plain).level, 'L2', 'portrait doubles as base+outfit layer fallback');
});
