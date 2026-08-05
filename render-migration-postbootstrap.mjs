import fs from "node:fs";

const routerPath = "server/base44-migration.js";
const indexPath = "server/index.js";

const router = `
import express from "express";
import { createClient } from "@base44/sdk";
import { pool } from "./db.js";

export const base44MigrationRouter = express.Router();

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

base44MigrationRouter.post("/pull", requireMigrationSecret, async (req, res) => {
  const appId = process.env.BASE44_APP_ID;
  if (!appId) return res.status(500).json({ error: "BASE44_APP_ID is not configured" });

  const entity = String(req.body?.entity || "");
  const allowed = new Set(["Artist", "Song", "BlogPost", "Infographic", "AmazonProduct"]);
  if (!allowed.has(entity)) return res.status(400).json({ error: "Entity is not allowed" });

  const limit = Math.min(Math.max(Number(req.body?.limit || 100), 1), 500);
  const skip = Math.max(Number(req.body?.skip || 0), 0);
  const dryRun = Boolean(req.body?.dryRun);

  const client = createClient({ appId, requiresAuth: false, serverUrl: "" });
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

  res.json({ entity, skip, limit, fetched: records.length, inserted, updated, dryRun, nextSkip: skip + records.length, complete: records.length < limit });
});

base44MigrationRouter.get("/status", requireMigrationSecret, async (_, res) => {
  const result = await pool.query(
    "SELECT entity_name, COUNT(*)::int AS records, COUNT(*) FILTER (WHERE data ? 'source_id')::int AS with_source_id FROM entity_records GROUP BY entity_name ORDER BY entity_name"
  );
  res.json({ entities: result.rows });
});
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
