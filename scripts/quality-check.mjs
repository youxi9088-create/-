import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const files = [];
function walk(folder) { for (const name of readdirSync(folder)) { const path = join(folder, name); if (statSync(path).isDirectory()) walk(path); else if (name.endsWith('.js') || name.endsWith('.mjs')) files.push(path); } }
['apps', 'packages', 'scripts', 'tests'].forEach(walk);
for (const file of files) { const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' }); if (result.status) { process.stderr.write(result.stderr); process.exit(result.status); } }
console.log(`Syntax and module-scope check passed: ${files.length} files.`);
