import fs from "node:fs";

const moduleSource = `
import { pool } from "./db.js";

const REPAIR_SLUG = "dedupe-song-catalog-footer-followup-v2";
const FOOTER = "::::::::::::::::::::::::::::::::\\nwww.GuitarraIA.com";

function normalized(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function withFooter(value) {
  const text = String(value || "").trimEnd();
  if (!text) return value;
  if (text.endsWith(FOOTER)) return text + "\\n";
  return text + "\\n\\n" + FOOTER + "\\n";
}

export async function ensureSongCatalogFooter() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [REPAIR_SLUG]);
    const result = await client.query(
      "SELECT id,data FROM entity_records WHERE entity_name='Song' FOR UPDATE"
    );
    const seen = new Set();
    for (const row of result.rows) {
      const key = normalized(row.data?.artist_name) + "|" + normalized(row.data?.title);
      if (seen.has(key)) throw new Error("Duplicate remained after catalog repair: " + key);
      seen.add(key);
    }

    let updated = 0;
    for (const row of result.rows) {
      const contentRaw = withFooter(row.data?.content_raw);
      const tablature = withFooter(row.data?.tablature);
      if (contentRaw !== row.data?.content_raw || tablature !== row.data?.tablature) {
        await client.query(
          "UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1",
          [row.id, JSON.stringify({ content_raw: contentRaw, tablature })]
        );
        updated += 1;
      }
    }

    const audit = {
      slug: REPAIR_SLUG,
      status: "completed",
      songs_checked: result.rows.length,
      songs_updated: updated,
      completed_at: new Date().toISOString(),
    };
    const prior = await client.query(
      "SELECT id FROM entity_records WHERE entity_name='MigrationRepair' AND data->>'slug'=$1 LIMIT 1",
      [REPAIR_SLUG]
    );
    if (prior.rows[0]) {
      await client.query(
        "UPDATE entity_records SET data=$2::jsonb,updated_date=NOW() WHERE id=$1",
        [prior.rows[0].id, JSON.stringify(audit)]
      );
    } else {
      await client.query(
        "INSERT INTO entity_records(entity_name,data) VALUES('MigrationRepair',$1::jsonb)",
        [JSON.stringify(audit)]
      );
    }
    await client.query("COMMIT");
    console.log("Song catalog footer follow-up completed", audit);
    return audit;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Song catalog footer follow-up rolled back", error);
    throw error;
  } finally {
    client.release();
  }
}
`;

fs.mkdirSync("server", { recursive: true });
fs.writeFileSync("server/dedupe-song-catalog-followup.js", moduleSource.trimStart(), "utf8");

const indexPath = "server/index.js";
let index = fs.readFileSync(indexPath, "utf8");
if (!index.includes('from "./dedupe-song-catalog-followup.js"')) {
  index = index.replace(
    'import express from "express";',
    'import express from "express";\nimport { ensureSongCatalogFooter } from "./dedupe-song-catalog-followup.js";'
  );
}
if (!index.includes("await ensureSongCatalogFooter();")) {
  index = index.replace(
    "await dedupeSongCatalogAndAddFooter();",
    "await dedupeSongCatalogAndAddFooter();\nawait ensureSongCatalogFooter();"
  );
}
fs.writeFileSync(indexPath, index, "utf8");
console.log("Song catalog footer follow-up installed.");
