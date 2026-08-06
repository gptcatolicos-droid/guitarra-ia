import fs from 'node:fs';

const path = 'render-iconic-guitars-batch3.mjs';
if (!fs.existsSync(path)) throw new Error(`${path} not found`);

const source = fs.readFileSync(path, 'utf8');
const marker = 'const seed =';
const index = source.indexOf(marker);
if (index < 0) throw new Error('Batch 3 seed marker not found');

const head = source.slice(0, index);
let tail = source.slice(index);
// Inside the generated server seed, item.* must remain runtime interpolation.
// Escape it so the build patch itself does not evaluate an undefined top-level item.
tail = tail.replaceAll('${item.', '\\${item.');

fs.writeFileSync(path, head + tail);
console.log('Iconic guitar batch 3 interpolation repaired.');
