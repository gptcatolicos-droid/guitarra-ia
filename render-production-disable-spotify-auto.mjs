import fs from 'node:fs';

const indexPath = 'server/index.js';
let index = fs.readFileSync(indexPath, 'utf8');

index = index.replace(
  /setTimeout\(\(\) => ensureStrictSpotifyCatalog\(\)\.catch\([\s\S]*?\),\s*5000\);\s*/,
  "console.log('Spotify automatic catalog synchronization disabled for production. Manual embeds remain available.');\n"
);

fs.writeFileSync(indexPath, index);
console.log('Production mode installed: Spotify automatic synchronization disabled.');
