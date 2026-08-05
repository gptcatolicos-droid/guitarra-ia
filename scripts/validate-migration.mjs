import "dotenv/config";
import pg from "pg";

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

const report = {};

try {
  report.counts = (await pool.query(`
    SELECT entity_name, COUNT(*)::int AS count
    FROM entity_records
    GROUP BY entity_name
    ORDER BY entity_name
  `)).rows;

  report.missingSourceIds = (await pool.query(`
    SELECT entity_name, COUNT(*)::int AS count
    FROM entity_records
    WHERE NOT (data ? 'source_id')
    GROUP BY entity_name
    ORDER BY entity_name
  `)).rows;

  report.duplicateSlugs = (await pool.query(`
    SELECT entity_name, data->>'slug' AS slug, COUNT(*)::int AS count
    FROM entity_records
    WHERE COALESCE(data->>'slug', '') <> ''
    GROUP BY entity_name, data->>'slug'
    HAVING COUNT(*) > 1
    ORDER BY entity_name, slug
  `)).rows;

  report.duplicateSourceIds = (await pool.query(`
    SELECT entity_name, data->>'source_id' AS source_id, COUNT(*)::int AS count
    FROM entity_records
    WHERE data ? 'source_id'
    GROUP BY entity_name, data->>'source_id'
    HAVING COUNT(*) > 1
    ORDER BY entity_name, source_id
  `)).rows;

  report.songsMissingArtistReference = (await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM entity_records
    WHERE entity_name = 'Song'
      AND COALESCE(data->>'artist_id', data->>'artist_slug', data->>'artist') IS NULL
  `)).rows[0].count;

  report.users = (await pool.query(`
    SELECT role, verified, COUNT(*)::int AS count
    FROM app_users
    GROUP BY role, verified
    ORDER BY role, verified
  `)).rows;

  report.ok = report.duplicateSlugs.length === 0 && report.duplicateSourceIds.length === 0;
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 2;
} finally {
  await pool.end();
}
