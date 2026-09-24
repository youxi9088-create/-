import { classify, canBeat } from '../apps/api/game-engine.mjs';
import { createMockCandidate } from '../packages/pal-generation-core/index.mjs';
const fixtures = [
  [['3♣'], 'SINGLE'], [['3♣', '3♦'], 'PAIR'], [['Q♣', 'Q♦', 'Q♥'], 'TRIPLE'], [['7♣', '7♦', '7♥', '7♠'], 'BOMB'], [['3♣', '4♣', '5♣', '6♣', '7♣'], 'STRAIGHT']
];
for (const [cards, type] of fixtures) if (classify(cards)?.type !== type) throw new Error(`Fixture failed: ${type}`);
if (!canBeat(classify(['7♣', '7♦', '7♥', '7♠']), classify(['A♣']))) throw new Error('Bomb regression failed');
if (createMockCandidate({ prompt: '模仿某位明星' }).status !== 'BLOCKED') throw new Error('Safety fixture failed');
console.log(`Fixture verification passed: ${fixtures.length} card types + safety gates.`);
