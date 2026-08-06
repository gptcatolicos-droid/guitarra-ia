import fs from 'node:fs';

const seed = `import { pool } from './db.js';

export async function quarantineInvalidRankings() {
  const result = await pool.query(\`
    SELECT id, data
    FROM entity_records
    WHERE entity_name='BlogPost'
      AND lower(data->>'title') LIKE '%top 100%guitarristas%'
  \`);

  let quarantined = 0;
  for (const row of result.rows) {
    const title = String(row.data?.title || '').toLowerCase();
    const isValidatedFunk = title.includes('funk') && title.includes('soul');
    if (isValidatedFunk) continue;

    const patch = {
      published: false,
      status: 'draft',
      ranking_rows: [],
      editorial_validation: 'required',
      editorial_note: 'Retirado temporalmente: ranking pendiente de validación manual por género.'
    };
    await pool.query(
      'UPDATE entity_records SET data=data || $2::jsonb, updated_date=NOW() WHERE id=$1',
      [row.id, JSON.stringify(patch)]
    );
    quarantined++;
  }
  console.log('Invalid guitarist rankings quarantined', { found: result.rows.length, quarantined });
}
`;

fs.writeFileSync('server/ranking-emergency-fix.js', seed);

let index = fs.readFileSync('server/index.js', 'utf8');
if (!index.includes('quarantineInvalidRankings')) {
  index = index.replace(
    'import { ensureAllGuitaristRankings } from "./all-rankings-seed.js";',
    'import { ensureAllGuitaristRankings } from "./all-rankings-seed.js";\nimport { quarantineInvalidRankings } from "./ranking-emergency-fix.js";'
  );
  index = index.replace(
    'await ensureAllGuitaristRankings();',
    'await ensureAllGuitaristRankings();\nawait quarantineInvalidRankings();'
  );
}
fs.writeFileSync('server/index.js', index);
console.log('Ranking emergency fix installed.');
