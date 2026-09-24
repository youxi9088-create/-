/**
 * Remove CSS rules whose selectors reference classes that are provably dead.
 *
 * A class is considered dead only when it is BOTH:
 *   1. absent from the live DOM (captured across every route, the settlement loop,
 *      the gallery detail and the replay overlay by scripts/collect-live-classes.mjs), and
 *   2. absent from app.js / index.html as a literal string.
 *
 * Classes built by string concatenation at runtime — `from-${lastPlayerId}`, `band-${n}`,
 * `lv${n}`, `card`, `red`, `selected`, `off`, `loading`, `empty` — are never in the DOM
 * snapshot for every branch, so they are listed in KEEP regardless.
 *
 * Usage: node scripts/prune-dead-css.mjs [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const WRITE = process.argv.includes('--write');

const DEAD = new Set([
  // styles.css
  'center-play', 'combo', 'hero-copy', 'hero-pal', 'hero-stage', 'home-cards',
  'loop-strip', 'performance-visual', 'rule-chip', 'settle-pal', 'turn-pill', 'versus',
  // styles-overrides.css
  'dressup-summary', 'photo-copy', 'played-cards', 'replay-progress', 'replay-visual',
  'settlement-video-caption', 'settlement-video-frame', 'settlement-video-modal'
]);

/** Never prune, even if unseen in the snapshot: built by concatenation or toggled by props. */
const KEEP = new Set([
  'card', 'card-art', 'red', 'selected', 'loading', 'empty', 'off',
  'lv2', 'lv3', 'lv4', 'lv5', 'from-pal-linxing', 'from-pal-mia', 'from-player',
  'solo', 'band-1', 'band-2', 'band-3'
]);

const classRefs = (selector) => {
  const out = [];
  const re = /\.(-?[A-Za-z_][\w-]*)/g;
  let match;
  while ((match = re.exec(selector))) out.push(match[1]);
  return out;
};

/** True when EVERY class the selector depends on is dead (i.e. the rule can never match). */
const isDeadRule = (selector) => {
  const refs = classRefs(selector);
  if (!refs.length) return false;
  if (refs.some((name) => KEEP.has(name))) return false;
  return refs.every((name) => DEAD.has(name));
};

/** Splits a stylesheet into top-level blocks, keeping @media wrappers intact. */
function splitTopLevel(css) {
  const blocks = [];
  let depth = 0;
  let start = 0;
  let inComment = false;
  for (let i = 0; i < css.length; i += 1) {
    const two = css.slice(i, i + 2);
    if (!inComment && two === '/*') { inComment = true; i += 1; continue; }
    if (inComment && two === '*/') { inComment = false; i += 1; continue; }
    if (inComment) continue;
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) { blocks.push(css.slice(start, i + 1)); start = i + 1; }
    }
  }
  if (start < css.length) blocks.push(css.slice(start));
  return blocks;
}

const headerOf = (block) => block.slice(0, block.indexOf('{'));
const isMedia = (block) => headerOf(block).trim().startsWith('@media');

/** Prunes inside a media block by recursing one level; drops the block if it empties out. */
function pruneMedia(block) {
  const open = block.indexOf('{');
  const close = block.lastIndexOf('}');
  const wrapper = block.slice(0, open + 1);
  const body = block.slice(open + 1, close);
  const kept = splitTopLevel(body).filter((rule) => !isDeadRule(headerOf(rule)));
  if (!kept.length) return '';
  return `${wrapper}${kept.join('')}}`;
}

for (const file of ['apps/web/styles.css', 'apps/web/styles-overrides.css']) {
  const css = readFileSync(file, 'utf8');
  const before = css.length;
  const out = [];
  let removed = 0;

  for (const block of splitTopLevel(css)) {
    if (isMedia(block)) {
      const pruned = pruneMedia(block);
      if (!pruned) { removed += 1; continue; }
      if (pruned !== block) removed += 1;
      out.push(pruned);
      continue;
    }
    if (!headerOf(block).includes('{') && !block.includes('{')) { out.push(block); continue; }
    if (isDeadRule(headerOf(block))) { removed += 1; continue; }
    out.push(block);
  }

  const result = out.join('');
  console.log(`${file}: ${removed} dead block(s), ${before} -> ${result.length} chars`);
  if (WRITE) writeFileSync(file, result);
}
if (!WRITE) console.log('\ndry run — pass --write to apply');
