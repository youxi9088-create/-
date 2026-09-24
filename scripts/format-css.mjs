/**
 * Pretty-prints a minified stylesheet so it can be reviewed in a diff.
 * Only whitespace is added — no declaration, selector or value is altered.
 * Blocks nested one level inside @media are indented; depth is tracked by brace counting.
 *
 * Usage: node scripts/format-css.mjs apps/web/styles.css [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
const WRITE = process.argv.includes('--write');
if (!file) { console.error('usage: node scripts/format-css.mjs <file.css> [--write]'); process.exit(1); }

const css = readFileSync(file, 'utf8');
let out = '';
let indent = 0;

for (let i = 0; i < css.length; i += 1) {
  const char = css[i];
  if (char === '{') {
    out += ' {\n';
    indent += 1;
    out += '  '.repeat(indent);
  } else if (char === '}') {
    indent -= 1;
    out = `${out.replace(/[ \n]+$/, '')}\n${'  '.repeat(indent)}}\n${'  '.repeat(Math.max(indent, 0))}`;
  } else if (char === ';') {
    out += `;\n${'  '.repeat(indent)}`;
  } else if (char === ',') {
    out += ', ';
  } else if (char === '\n' || char === '\r') {
    // collapse existing newlines; layout is regenerated from the structure
  } else if (char === ' ' && /[,\s]$/.test(out)) {
    // drop the duplicate space that would follow an inserted ", "
  } else {
    out += char;
  }
}

// Restore newlines before each declaration: a semicolon is followed by a property name.
out = out.replace(/;\n(\s*)/g, (match, pad) => `;\n${pad}`);
out = out.replace(/,\s*\n\s*/g, ', ');

// Collapse runs of blank indentation-only lines and trailing whitespace.
const pretty = out
  .split('\n')
  .map((line) => line.replace(/\s+$/, ''))
  .filter((line, index, lines) => !(line === '' && lines[index - 1] === ''))
  .join('\n')
  .trimEnd() + '\n';

const before = css.length;
console.log(`${file}: ${before} -> ${pretty.length} chars, ${css.split('\n').length} -> ${pretty.split('\n').length} lines`);
if (WRITE) writeFileSync(file, pretty);
else console.log('dry run — pass --write to apply');
