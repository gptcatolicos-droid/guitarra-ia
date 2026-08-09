import fs from 'node:fs';

const target = 'server/index.js';
let src = fs.readFileSync(target, 'utf8');

// Several historical migration patches can inject the same top-level helper.
// Keep the LAST declaration (the newest patch in the build pipeline) and rename
// older declarations so Node can parse the module without changing current routes.
const names = [
  'syncSpotifyCatalogBatch',
  'syncSpotifyForSong',
  'spotifyArtist',
];

let changed = false;
for (const name of names) {
  const re = new RegExp(`async\\s+function\\s+${name}\\s*\\(`, 'g');
  const matches = [...src.matchAll(re)];
  if (matches.length <= 1) continue;

  // Work backwards through all but the final declaration so indexes stay valid.
  for (let i = matches.length - 2; i >= 0; i -= 1) {
    const match = matches[i];
    const start = match.index;
    const matched = match[0];
    const replacement = matched.replace(
      new RegExp(`function\\s+${name}`),
      `function ${name}Legacy${i + 1}`,
    );
    src = src.slice(0, start) + replacement + src.slice(start + matched.length);
    changed = true;
  }
  console.log(`[dedupe] ${name}: ${matches.length} declarations -> kept newest`);
}

fs.writeFileSync(target, src, 'utf8');
console.log(changed ? 'Runtime duplicate declarations repaired.' : 'No runtime duplicates found.');
