import fs from 'node:fs';

const path = 'server/entities.js';
let source = fs.readFileSync(path, 'utf8');

source = source.replace(
  '"SELECT * FROM entity_records WHERE entity_name=$1 AND id=$2",',
  '"SELECT * FROM entity_records WHERE entity_name=$1 AND (id::text=$2 OR data->>\'id\'=$2) LIMIT 1",'
);
source = source.replace(
  'WHERE entity_name=$1 AND id=$2 RETURNING *`',
  "WHERE entity_name=$1 AND (id::text=$2 OR data->>'id'=$2) RETURNING *`"
);
source = source.replace(
  '"DELETE FROM entity_records WHERE entity_name=$1 AND id=$2 RETURNING id",',
  '"DELETE FROM entity_records WHERE entity_name=$1 AND (id::text=$2 OR data->>\'id\'=$2) RETURNING id",'
);

fs.writeFileSync(path, source);
console.log('Entity ID compatibility installed.');
