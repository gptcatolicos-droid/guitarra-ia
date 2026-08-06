import fs from 'node:fs';

const indexPath = 'server/index.js';
let index = fs.readFileSync(indexPath, 'utf8');

index = index.replace(
  "import { ensureStrictSpotifyCatalog } from './spotify-sync.js';",
  "import { ensureStrictSpotifyCatalog, syncSpotifyCatalogBatch } from './spotify-sync.js';"
);

const marker = "console.log('Spotify automatic catalog synchronization disabled for production. Manual embeds remain available.');";
if (index.includes(marker) && !index.includes('SPOTIFY_SMOKE_TEST_RESULT')) {
  index = index.replace(
    marker,
    `${marker}\nsetTimeout(async () => {\n  try {\n    const result = await syncSpotifyCatalogBatch({ batchSize: 5, retryNotFound: false });\n    console.log('SPOTIFY_SMOKE_TEST_RESULT', result);\n  } catch (error) {\n    console.error('SPOTIFY_SMOKE_TEST_FATAL', error?.message || error);\n  }\n}, 8000);`
  );
}

fs.writeFileSync(indexPath, index);
console.log('Spotify smoke test installed: one strict batch of 5 songs.');
