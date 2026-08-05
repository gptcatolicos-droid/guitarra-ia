import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

function usage() {
  console.error("Usage: node scripts/import-base44-export.mjs <export.json> [EntityName]");
  process.exit(1);
}

const inputPath = process.argv[2];
const forcedEntity = process.argv[3];
if (!inputPath) usage();
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const absolutePath = path.resolve(inputPath);
const raw = JSON.parse(fs.readFileSync(absolutePath, "utf8"));

function normalizeExport(value) {
  if (forcedEntity) {
    const records = Array.isArray(value) ? value : value?.records || value?.data || [];
    return [{ entity: forcedEntity, records }];
  }

  if (Array.isArray(value)) {
    const grouped = new Map();
    for (const item of value) {
      const entity = item?.entity_name || item?.entity || item?.type;
      if (!entity) {
        throw new Error("Array exports must include entity_name, entity, or type on every record, or pass EntityName as the second argument");
      }
      const record = item?.data && typeof item.data === "object" ? item.data : item;
      if (!grouped.has(entity)) grouped.set(entity, []);
      grouped.get(entity).push(record);
    }
    return [...grouped].map(([entity, records]) => ({ entity, records }));
  }

  if (value?.entities && typeof value.entities === "object") {
    return Object.entries(value.entities).map(([entity, records]) => ({ entity, records }));
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, records]) => Array.isArray(records))
      .map(([entity, records]) => ({ entity, records }));
  }

  throw new Error("Unsupported export format");
}

function cleanRecord(record) {
  const value = record?.data && typeof record.data === "object" ? { ...record.data } : { ...record };
  const sourceId = record?.id || record?._id || value.id || value._id;
  delete value.id;
  delete value._id;

  if (sourceId) value.source_id = String(sourceId);
  if (record?.created_date && !value.created_date) value.source_created_date = record.created_date;
  if (record?.updated_date && !value.updated_date) value.source_updated_date = record.updated_date;
  return value;
}

const groups = normalizeExport(raw);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

let inserted = 0;
let updated = 0;
let skipped = 0;

try {
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_records_source_id
    ON entity_records(entity_name, (data->>'source_id'))
    WHERE data ? 'source_id';
  `);

  for (const { entity, records } of groups) {
    if (!Array.isArray(records)) continue;
    console.log(`Importing ${records.length} ${entity} records...`);

    for (const original of records) {
      if (!original || typeof original !== "object") {
        skipped += 1;
        continue;
      }

      const data = cleanRecord(original);
      const sourceId = data.source_id;

      if (sourceId) {
        const result = await pool.query(
          `INSERT INTO entity_records(entity_name, data)
           VALUES($1, $2::jsonb)
           ON CONFLICT (entity_name, (data->>'source_id'))
           WHERE data ? 'source_id'
           DO UPDATE SET data = EXCLUDED.data, updated_date = NOW()
           RETURNING (xmax = 0) AS inserted`,
          [entity, JSON.stringify(data)]
        );
        if (result.rows[0]?.inserted) inserted += 1;
        else updated += 1;
      } else {
        await pool.query(
          "INSERT INTO entity_records(entity_name, data) VALUES($1, $2::jsonb)",
          [entity, JSON.stringify(data)]
        );
        inserted += 1;
      }
    }
  }

  console.log(JSON.stringify({ inserted, updated, skipped, entities: groups.map(g => g.entity) }, null, 2));
} finally {
  await pool.end();
}
