import fs from "node:fs";

const routerPath = "server/base44-migration.js";
const indexPath = "server/index.js";

const router = `
import express from "express";
import { createClient } from "@base44/sdk";
import { pool } from "./db.js";

export const base44MigrationRouter = express.Router();
const ALLOWED_ENTITIES = ["Artist", "Song", "BlogPost", "Infographic", "AmazonProduct"];

function requireMigrationSecret(req, res, next) {
  const configured = process.env.MIGRATION_SECRET;
  const supplied = req.headers["x-migration-secret"];
  if (!configured || supplied !== configured) {
    return res.status(403).json({ error: "Migration access denied" });
  }
  next();
}

function cleanRecord(record) {
  const { id, created_date, updated_date, created_by_id, is_sample, ...data } = record;
  return {
    sourceId: id,
    createdDate: created_date || null,
    updatedDate: updated_date || null,
    data: { ...data, source_id: id, source_created_by_id: created_by_id || null, source_is_sample: Boolean(is_sample) },
  };
}

async function migratePage(client, entity, limit, skip, dryRun = false) {
  const records = await client.entities[entity].list("created_date", limit, skip);
  let inserted = 0;
  let updated = 0;

  for (const original of records) {
    const record = cleanRecord(original);
    if (dryRun) continue;

    const existing = await pool.query(
      "SELECT id FROM entity_records WHERE entity_name=$1 AND data->>'source_id'=$2 LIMIT 1",
      [entity, record.sourceId]
    );

    if (existing.rows[0]) {
      await pool.query(
        "UPDATE entity_records SET data=$3::jsonb, updated_date=COALESCE($4::timestamptz,NOW()) WHERE id=$1 AND entity_name=$2",
        [existing.rows[0].id, entity, JSON.stringify(record.data), record.updatedDate]
      );
      updated += 1;
    } else {
      await pool.query(
        "INSERT INTO entity_records(entity_name,data,created_date,updated_date) VALUES($1,$2::jsonb,COALESCE($3::timestamptz,NOW()),COALESCE($4::timestamptz,NOW()))",
        [entity, JSON.stringify(record.data), record.createdDate, record.updatedDate]
      );
      inserted += 1;
    }
  }

  return { entity, skip, limit, fetched: records.length, inserted, updated, dryRun, nextSkip: skip + records.length, complete: records.length < limit };
}

async function migrateAllEntities() {
  const appId = process.env.BASE44_APP_ID;
  if (!appId) throw new Error("BASE44_APP_ID is not configured");
  const client = createClient({ appId, requiresAuth: false, serverUrl: "https://base44.app" });
  const summary = {};

  for (const entity of ALLOWED_ENTITIES) {
    let skip = 0;
    let fetched = 0;
    let inserted = 0;
    let updated = 0;
    let pages = 0;

    while (true) {
      const result = await migratePage(client, entity, 500, skip, false);
      pages += 1;
      fetched += result.fetched;
      inserted += result.inserted;
      updated += result.updated;
      console.log("Base44 migration page", JSON.stringify(result));
      if (result.complete) break;
      if (result.nextSkip <= skip) throw new Error(\`Migration stalled for \${entity} at \${skip}\`);
      skip = result.nextSkip;
    }

    summary[entity] = { fetched, inserted, updated, pages };
  }

  console.log("Base44 migration complete", JSON.stringify(summary));
  return summary;
}

base44MigrationRouter.post("/pull", requireMigrationSecret, async (req, res) => {
  try {
    const appId = process.env.BASE44_APP_ID;
    if (!appId) return res.status(500).json({ error: "BASE44_APP_ID is not configured" });
    const entity = String(req.body?.entity || "");
    if (!ALLOWED_ENTITIES.includes(entity)) return res.status(400).json({ error: "Entity is not allowed" });
    const limit = Math.min(Math.max(Number(req.body?.limit || 100), 1), 500);
    const skip = Math.max(Number(req.body?.skip || 0), 0);
    const dryRun = Boolean(req.body?.dryRun);
    const client = createClient({ appId, requiresAuth: false, serverUrl: "https://base44.app" });
    res.json(await migratePage(client, entity, limit, skip, dryRun));
  } catch (error) {
    console.error("Base44 pull failed", error);
    res.status(500).json({ error: error.message });
  }
});

base44MigrationRouter.post("/pull-all", requireMigrationSecret, async (_, res) => {
  try {
    res.json({ summary: await migrateAllEntities() });
  } catch (error) {
    console.error("Base44 full migration failed", error);
    res.status(500).json({ error: error.message });
  }
});

base44MigrationRouter.get("/status", requireMigrationSecret, async (_, res) => {
  const result = await pool.query(
    "SELECT entity_name, COUNT(*)::int AS records, COUNT(*) FILTER (WHERE data ? 'source_id')::int AS with_source_id FROM entity_records GROUP BY entity_name ORDER BY entity_name"
  );
  res.json({ entities: result.rows });
});

if (process.env.RUN_BASE44_MIGRATION === "true") {
  setTimeout(() => {
    migrateAllEntities().catch((error) => console.error("Automatic Base44 migration failed", error));
  }, 5000);
}
`;

fs.mkdirSync("server", { recursive: true });
fs.writeFileSync(routerPath, router.trimStart(), "utf8");

let index = fs.readFileSync(indexPath, "utf8");
if (!index.includes("base44MigrationRouter")) {
  index = index.replace(
    'import { sitemapHandler } from "./sitemap.js";',
    'import { sitemapHandler } from "./sitemap.js";\nimport { base44MigrationRouter } from "./base44-migration.js";'
  );
  index = index.replace(
    'app.use("/api/functions", functionsRouter);',
    'app.use("/api/functions", functionsRouter);\napp.use("/api/migration/base44", base44MigrationRouter);'
  );
  fs.writeFileSync(indexPath, index, "utf8");
}

console.log("Render post-bootstrap migration route installed.");
