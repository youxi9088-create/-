import { SETTLEMENT_STAGES, MAX_UPGRADE_LEVEL, validatePhotoCard } from '../contracts/index.mjs';

export const PERFORMANCE_CONTRACT_VERSION = '1.1.0';

const DETERMINISTIC_TIME = '1970-01-01T00:00:00.000Z';

const defaultOutfit = (palId) => ({
  outfitId: 'default-stage',
  name: palId === 'pal-linxing' ? '星夜礼服' : '薄荷舞台装',
  dance: palId === 'pal-linxing' ? '月光步' : '彩带律动',
  layerSnapshot: { base: `preset://${palId}/portrait-v1`, outfit: `preset://${palId}/portrait-v1` }
});

const normalizeRecords = (alreadyUnlocked) => (alreadyUnlocked || []).map((entry) => (typeof entry === 'string' ? { cardId: entry } : entry));

export function planSettlement({ gameId, winnerId, loserPalIds, multiplier, alreadyUnlocked = [], outfitLibrary = {}, gameStats = {}, unlockedAt = DETERMINISTIC_TIME }) {
  const losingPal = loserPalIds[0] || null;
  const records = normalizeRecords(alreadyUnlocked);
  let card = null;
  let cardId = null;
  let isFirstUnlock = false;
  let upgradeLevel = 0;
  let outfitName = null;
  let danceName = null;

  if (losingPal) {
    const outfits = (outfitLibrary[losingPal]?.length ? outfitLibrary[losingPal] : [defaultOutfit(losingPal)]);
    const palRecords = records.filter((record) => record.palId === losingPal);
    const unlockedOutfitIds = new Set(palRecords.map((record) => record.outfitId));
    const fresh = outfits.find((entry) => !unlockedOutfitIds.has(entry.outfitId));
    const chosen = fresh || outfits[palRecords.length % outfits.length];
    isFirstUnlock = Boolean(fresh);
    cardId = `${losingPal}:${chosen.outfitId}`;
    const existing = records.find((record) => record.cardId === cardId);
    upgradeLevel = isFirstUnlock ? 1 : Math.min((existing?.upgradeLevel || 1) + 1, MAX_UPGRADE_LEVEL);
    outfitName = chosen.name;
    danceName = chosen.dance;
    card = validatePhotoCard({
      cardId,
      palId: losingPal,
      outfitId: chosen.outfitId,
      outfitName: chosen.name,
      dance: chosen.dance,
      layerSnapshot: chosen.layerSnapshot,
      serialNo: existing?.serialNo || records.length + 1,
      rarity: isFirstUnlock ? 'first' : 'normal',
      upgradeLevel,
      seen: false,
      unlockedAt,
      auditRecordId: chosen.auditRecordId || `audit-official-${losingPal}-v1`,
      gameStats: {
        multiplier,
        rounds: gameStats.rounds ?? null,
        lastCombo: gameStats.lastCombo ?? null
      }
    });
  }

  return {
    contractVersion: PERFORMANCE_CONTRACT_VERSION,
    traceId: `perf-${gameId}`,
    idempotencyKey: `settle-${gameId}`,
    winnerId,
    multiplier,
    tokenDelta: winnerId === 'player' ? 0 : -Math.max(1, multiplier),
    loserPalId: losingPal,
    outfit: outfitName,
    dance: danceName,
    cardId,
    isFirstUnlock,
    upgradeLevel,
    card,
    performanceRef: losingPal ? `preset://${losingPal}/dance-skeletal-v1` : null,
    stages: SETTLEMENT_STAGES
  };
}

export function nextSettlementStage(stage) {
  const index = SETTLEMENT_STAGES.indexOf(stage);
  return SETTLEMENT_STAGES[Math.min(index + 1, SETTLEMENT_STAGES.length - 1)];
}
