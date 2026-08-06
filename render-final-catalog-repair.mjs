import fs from 'node:fs';

// Repair the generated key detector with a conservative, valid expression.
const keyModule = 'server/song-key-artist-image-repair.js';
let keySource = fs.readFileSync(keyModule, 'utf8');
keySource = keySource.replace(
  /const chordRegex = new RegExp\([^\n]+\);/,
  "const chordRegex = /(?:^|\\s|\\[|\\()([A-G](?:#|b)?(?:m|maj|min|sus|dim|aug|add)?\\d{0,2}(?:\\/[A-G](?:#|b)?)?)(?=$|\\s|\\]|\\)|[|,;:\\-])/i;"
);
fs.writeFileSync(keyModule, keySource);

// Make automatic Spotify assignment deliberately strict and run pending songs
// in the background after the service is healthy.
const spotifyModule = 'server/spotify-sync.js';
let spotify = fs.readFileSync(spotifyModule, 'utf8');
spotify = spotify.replace(
  "const safe = best.score >= 0.82 && best.titleScore >= 0.82 && (best.artistScore >= 0.58 || !song.artist_name);",
  "const safe = best.score >= 0.93 && best.titleScore >= 0.95 && (best.artistScore >= 0.90 || !song.artist_name);"
);

if (!spotify.includes('export async function ensureStrictSpotifyCatalog')) {
  spotify += `\n\nexport async function ensureStrictSpotifyCatalog() {\n  let totalProcessed = 0;\n  let totalMatched = 0;\n  let totalReview = 0;\n  let totalNotFound = 0;\n  let totalFailed = 0;\n  for (let cycle = 0; cycle < 160; cycle++) {\n    const result = await syncSpotifyCatalogBatch({ batchSize: 20, retryNotFound: true });\n    totalProcessed += Number(result.processed || 0);\n    totalMatched += Number(result.matched || 0);\n    totalReview += Number(result.review || 0);\n    totalNotFound += Number(result.notFound || 0);\n    totalFailed += Number(result.failed || 0);\n    console.log('SPOTIFY_STRICT_SYNC_BATCH', { cycle: cycle + 1, ...result });\n    if (!result.hasMore || !result.processed) break;\n    await new Promise((resolve) => setTimeout(resolve, 500));\n  }\n  const stats = await pool.query(\`SELECT\n    COUNT(*)::int AS total,\n    COUNT(*) FILTER (WHERE COALESCE(data->>'spotify_embed','') <> '' OR COALESCE(data->>'spotify_embed_url','') <> '')::int AS with_embed,\n    COUNT(*) FILTER (WHERE COALESCE(data->>'spotify_match_status','') = 'review_required')::int AS review_required,\n    COUNT(*) FILTER (WHERE COALESCE(data->>'spotify_match_status','') = 'not_found')::int AS not_found\n    FROM entity_records WHERE entity_name='Song'\`);\n  console.log('SPOTIFY_STRICT_SYNC_COMPLETE', { totalProcessed, totalMatched, totalReview, totalNotFound, totalFailed, ...stats.rows[0] });\n}\n`;
}
fs.writeFileSync(spotifyModule, spotify);

const indexPath = 'server/index.js';
let index = fs.readFileSync(indexPath, 'utf8');
if (!index.includes("ensureStrictSpotifyCatalog")) {
  index = index.replace(
    'import express from "express";',
    'import express from "express";\nimport { ensureStrictSpotifyCatalog } from \'./spotify-sync.js\';'
  );
  const portAnchor = 'const port = Number(process.env.PORT';
  index = index.replace(
    portAnchor,
    "setTimeout(() => ensureStrictSpotifyCatalog().catch((error) => console.error('SPOTIFY_STRICT_SYNC_FATAL', error.message)), 5000);\n\n" + portAnchor
  );
}
fs.writeFileSync(indexPath, index);

console.log('Final catalog repair and strict Spotify synchronization installed.');
