export const CONTRACT_VERSION = '1.1.0';

export const PAL_IDS = ['pal-linxing', 'pal-mia'];
export const SETTLEMENT_STAGES = ['RESULT', 'PERFORMANCE', 'PHOTO_REVEAL', 'DESTINATION'];
export const APPEARANCE_LEVELS = ['L1', 'L2', 'L3'];
export const CARD_RARITIES = ['first', 'normal'];
export const MAX_UPGRADE_LEVEL = 5;

export function assert(condition, message) {
  if (!condition) throw new Error(`Contract violation: ${message}`);
}

export function validateGameSnapshot(snapshot) {
  assert(snapshot?.contractVersion === CONTRACT_VERSION, 'game snapshot contractVersion');
  assert(['BIDDING', 'PLAYING', 'SETTLED'].includes(snapshot.phase), 'game phase');
  assert(Array.isArray(snapshot.playerHand), 'player hand');
  assert(Array.isArray(snapshot.players) && snapshot.players.length === 3, 'three players');
  assert(Number.isInteger(snapshot.seq) && snapshot.seq >= 0, 'sequence');
  assert(typeof snapshot.tokenBalance === 'number' && snapshot.tokenBalance >= 0, 'non-negative token balance');
  return snapshot;
}

const optionalRef = (value) => value === undefined || value === null || (typeof value === 'string' && value.length > 0);

export function validateLayeredAppearance(layers) {
  assert(typeof layers?.base === 'string' && layers.base.length > 0, 'layered appearance base layer');
  assert(typeof layers?.outfit === 'string' && layers.outfit.length > 0, 'layered appearance outfit layer');
  assert(optionalRef(layers.hair), 'layered appearance hair layer');
  assert(optionalRef(layers.accessory), 'layered appearance accessory layer');
  assert(optionalRef(layers.effect), 'layered appearance effect layer');
  return layers;
}

export function validateOutfitEntry(entry) {
  assert(typeof entry?.outfitId === 'string' && entry.outfitId.length > 0, 'outfit id');
  assert(typeof entry?.name === 'string' && entry.name.length > 0, 'outfit name');
  assert(typeof entry?.dance === 'string' && entry.dance.length > 0, 'outfit dance');
  validateLayeredAppearance(entry.layerSnapshot);
  return entry;
}

export function validatePalAsset(asset) {
  assert(asset?.contractVersion === CONTRACT_VERSION, 'pal asset contractVersion');
  assert(typeof asset.palId === 'string' && asset.palId.length > 0, 'palId');
  assert(['READY', 'DEGRADED_READY', 'BLOCKED'].includes(asset.readiness), 'asset readiness');
  assert(asset.auditRecordId?.startsWith('audit-'), 'audited visible asset');
  assert(asset.identity?.adultAppearance === true && asset.identity?.fictional === true, 'adult fictional identity');
  assert(typeof asset.appearance?.portraitRef === 'string' && asset.appearance.portraitRef.length > 0, 'portrait asset reference');
  assert(optionalRef(asset.appearance?.live2dRef), 'live2d model reference');
  assert(optionalRef(asset.appearance?.vrmRef), 'vrm model reference');
  assert(optionalRef(asset.appearance?.standeeRef), 'transparent standee reference');
  if (asset.appearance?.layers) validateLayeredAppearance(asset.appearance.layers);
  if (asset.appearance?.outfitLibrary) {
    assert(Array.isArray(asset.appearance.outfitLibrary) && asset.appearance.outfitLibrary.length > 0, 'outfit library entries');
    asset.appearance.outfitLibrary.forEach(validateOutfitEntry);
  }
  assert(typeof asset.actionPack === 'object' && ['A01', 'A02', 'A03', 'A04', 'A05'].every((key) => asset.actionPack[key]), 'five-state action pack');
  assert(typeof asset.dialoguePack === 'object' && ['idle', 'play', 'pass', 'win', 'lose'].every((key) => Array.isArray(asset.dialoguePack[key]) && asset.dialoguePack[key].length > 0), 'five-state dialogue pack');
  assert(asset.fallback?.actionLevel === 'L2' || asset.fallback?.actionLevel === 'L3', 'fallback action level');
  return asset;
}

export function validatePhotoCard(card) {
  assert(typeof card?.cardId === 'string' && card.cardId.length > 0, 'photo card id');
  assert(typeof card?.palId === 'string' && card.palId.length > 0, 'photo card palId');
  assert(typeof card?.outfitId === 'string' && card.outfitId.length > 0, 'photo card outfitId');
  assert(typeof card?.outfitName === 'string' && card.outfitName.length > 0, 'photo card outfit name');
  assert(typeof card?.dance === 'string' && card.dance.length > 0, 'photo card dance');
  validateLayeredAppearance(card.layerSnapshot);
  assert(Number.isInteger(card.serialNo) && card.serialNo >= 1, 'photo card serial number');
  assert(CARD_RARITIES.includes(card.rarity), 'photo card rarity');
  assert(Number.isInteger(card.upgradeLevel) && card.upgradeLevel >= 1 && card.upgradeLevel <= MAX_UPGRADE_LEVEL, 'photo card upgrade level');
  assert(typeof card.seen === 'boolean', 'photo card seen flag');
  assert(typeof card.unlockedAt === 'string' && card.unlockedAt.length > 0, 'photo card unlock time');
  assert(card.auditRecordId?.startsWith('audit-'), 'photo card audit record');
  return card;
}

export function canonical(value) { return JSON.stringify(value, Object.keys(value).sort()); }
