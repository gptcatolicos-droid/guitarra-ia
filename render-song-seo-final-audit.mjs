import fs from 'node:fs';

const moduleCode = `import { pool } from './db.js';

export async function auditRemainingSongSeo() {
  const result = await pool.query(\`
    SELECT id,
           data->>'id' AS legacy_id,
           data->>'title' AS title,
           data->>'artist_name' AS artist,
           COALESCE((data->>'seo_manual_lock')::boolean, false) AS locked,
           data->>'seo_status' AS seo_status,
           data->>'seo_title' AS seo_title
    FROM entity_records
    WHERE entity_name='Song'
      AND (data->>'seo_title' IS NULL OR data->>'seo_title'='')
    ORDER BY created_date ASC
    LIMIT 100
  \`);
  console.log('SONG_SEO_REMAINING_AUDIT', {
    count: result.rows.length,
    locked: result.rows.filter((row) => row.locked).length,
    rows: result.rows.map((row) => ({
      id: row.id,
      legacy_id: row.legacy_id,
      title: row.title,
      artist: row.artist,
      locked: row.locked,
      seo_status: row.seo_status,
    })),
  });
}
`;

fs.writeFileSync('server/song-seo-final-audit.js', moduleCode);

let index = fs.readFileSync('server/index.js', 'utf8');
if (!index.includes("from './song-seo-final-audit.js'")) {
  index = index.replace(
    'import express from "express";',
    'import express from "express";\nimport { auditRemainingSongSeo } from \'./song-seo-final-audit.js\';'
  );
}
if (!index.includes('await auditRemainingSongSeo();')) {
  index = index.replace('await ensureSongSeoCatalog();', 'await ensureSongSeoCatalog();\nawait auditRemainingSongSeo();');
}
fs.writeFileSync('server/index.js', index);
console.log('Song SEO final audit installed.');
