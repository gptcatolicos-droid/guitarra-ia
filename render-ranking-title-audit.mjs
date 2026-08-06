import fs from 'node:fs';

const seed = `import { pool } from './db.js';

export async function auditGuitaristRankingTitles() {
  const result = await pool.query(\`
    SELECT data->>'title' AS title,
           data->>'slug' AS slug,
           data->>'published' AS published,
           data->>'status' AS status
    FROM entity_records
    WHERE entity_name='BlogPost'
      AND lower(data->>'title') LIKE '%top 100%guitarristas%'
    ORDER BY data->>'title'
  \`);
  console.log('GUITARIST_RANKING_AUDIT', result.rows);
}
`;

fs.writeFileSync('server/ranking-title-audit.js', seed);

let index = fs.readFileSync('server/index.js', 'utf8');
if (!index.includes('auditGuitaristRankingTitles')) {
  index = index.replace(
    'import { quarantineInvalidRankings } from "./ranking-emergency-fix.js";',
    'import { quarantineInvalidRankings } from "./ranking-emergency-fix.js";\nimport { auditGuitaristRankingTitles } from "./ranking-title-audit.js";'
  );
  index = index.replace(
    'await quarantineInvalidRankings();',
    'await quarantineInvalidRankings();\nawait auditGuitaristRankingTitles();'
  );
}
fs.writeFileSync('server/index.js', index);
console.log('Ranking title audit installed.');
