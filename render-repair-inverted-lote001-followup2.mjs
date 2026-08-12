import fs from "node:fs";

const moduleSource = `
import { gunzipSync } from "node:zlib";
import { pool } from "./db.js";

const REPAIR_SLUG = "repair-inverted-lote001-v3";
const SONG_ID = "4ad9c54e-3a5c-4cb2-9d83-90d478bbaa41";
const SOURCE_ID = "6a5ff94a18a42b32ed8ba499";
const FALSE_ARTIST_SOURCE_IDS = ["6a60f16ee08414782f100af8", "6a60f16ee08414782f100b31"];
const patch = JSON.parse(gunzipSync(Buffer.from("H4sIADVZfGoC/5VTPU/cQBD9K6OtQLLDIZTGEsUld0mTVCCaOLLm7MFesp41+3HoiPJjrkxBkT6d/xiz5yOASBRhyyPN85vZt292v6vaciAOlcMbVailgQuNV1TyZ+RxW3LJp6encI4rgyE6hGOQPMHLIn8rb3pOdu/Ri3wm8TlW8rzYpxOcC+1v+XOs5EWRP3+O/pNPZSUfzP14B9QPmm4RBqd7chYa8kMcf3ogD5EtbFLMSra6RQaD4KyEAWXD15GgRw8WemLrJYLYpYkb5DdwbhsUfsk1cq0twxoBvc5AmiYSgSzsGjpMWuZeQ68dcfEPA19h2KsNejBk3mUisreylwzS8HVrZZM62dJF7cSFs7iiQIAiVhh1RxlIurYbgaSiifWOdjF1AUNXEhspuI7jnfz4lIDsJX5G7COaDLwWo8i142/iW8x2Hu8kyDg6rCl1fy/MNJ4QoUaZW91Z0fsIDmZPVJkK++NJquBoTKY69JUUuMarIrhIE/KEdonGCzpxquipUcUXtZRec/kW6mumrNOtZjTVN9o89BUlVhUzWTGy5jZdGB/GrZwFBwdLmMMCPsI7oENp0ujLS11HE6RafRi3tTaCGuQ2Yku70gHHXzahPogu0aqGuDLadyInU9pXDfX2j9i1phs/ra6DoSe3NXUwMckhk6/3CLqgfagY+0TdXedHdE/vkVFARwPKuWyqVdI6ZblmGVGgJjc20Gx2nK9P1I97PIKM9TAEAAA=", "base64")).toString("utf8"));

export async function repairInvertedLote001Followup2() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [REPAIR_SLUG]);
    const result = await client.query(
      "SELECT id,data FROM entity_records WHERE entity_name='Song' AND id::text=$1 FOR UPDATE",
      [SONG_ID]
    );
    const row = result.rows[0];
    if (!row) {
      await client.query("COMMIT");
      console.log("Lote 001 follow-up 2 skipped: Song is absent");
      return { status: "absent" };
    }
    if (String(row.data?.source_id || "") !== SOURCE_ID) {
      throw new Error("Unexpected source_id for El Viaje");
    }
    const artistResult = await client.query(
      "SELECT id,data FROM entity_records WHERE entity_name='Artist' AND data->>'slug'='mana' ORDER BY created_date ASC,id ASC LIMIT 1"
    );
    if (!artistResult.rows[0]) throw new Error("Maná artist record is missing");
    const artist = artistResult.rows[0];
    const finalPatch = {
      ...patch,
      artist_id: String(artist.id),
      repaired_at: new Date().toISOString(),
      seo_title: "El Viaje - Acordes y tablatura | Maná | GuitarraIA",
      seo_description: "Aprende a tocar El Viaje de Maná en guitarra. Acordes, tonalidad, cejilla y práctica en GuitarraIA.",
      meta_title: "El Viaje - Acordes y tablatura | Maná | GuitarraIA",
      meta_description: "Aprende a tocar El Viaje de Maná en guitarra. Acordes, tonalidad, cejilla y práctica en GuitarraIA.",
      seo_canonical_path: "/mana/el-viaje",
    };
    await client.query(
      "UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1",
      [row.id, JSON.stringify(finalPatch)]
    );

    const deletedFalseArtists = [];
    for (const sourceId of FALSE_ARTIST_SOURCE_IDS) {
      const artists = await client.query(
        "SELECT id FROM entity_records WHERE entity_name='Artist' AND data->>'source_id'=$1 FOR UPDATE",
        [sourceId]
      );
      for (const falseArtist of artists.rows) {
        const refs = await client.query(
          "SELECT COUNT(*)::int AS count FROM entity_records WHERE entity_name='Song' AND data->>'artist_id'=$1",
          [String(falseArtist.id)]
        );
        if (refs.rows[0].count === 0) {
          await client.query("DELETE FROM entity_records WHERE id=$1 AND entity_name='Artist'", [falseArtist.id]);
          deletedFalseArtists.push(String(falseArtist.id));
        }
      }
    }

    const audit = {
      slug: REPAIR_SLUG,
      status: "completed",
      song_id: String(row.id),
      source_id: SOURCE_ID,
      deleted_false_artist_ids: deletedFalseArtists,
      completed_at: new Date().toISOString(),
    };
    const prior = await client.query(
      "SELECT id FROM entity_records WHERE entity_name='MigrationRepair' AND data->>'slug'=$1 LIMIT 1",
      [REPAIR_SLUG]
    );
    if (prior.rows[0]) {
      await client.query("UPDATE entity_records SET data=$2::jsonb,updated_date=NOW() WHERE id=$1", [prior.rows[0].id, JSON.stringify(audit)]);
    } else {
      await client.query("INSERT INTO entity_records(entity_name,data) VALUES('MigrationRepair',$1::jsonb)", [JSON.stringify(audit)]);
    }
    await client.query("COMMIT");
    console.log("Lote 001 follow-up 2 completed", audit);
    return audit;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Lote 001 follow-up 2 rolled back", error);
    throw error;
  } finally {
    client.release();
  }
}
`;

fs.mkdirSync("server", { recursive: true });
fs.writeFileSync("server/repair-inverted-lote001-followup2.js", moduleSource.trimStart(), "utf8");

const indexPath = "server/index.js";
let index = fs.readFileSync(indexPath, "utf8");
if (!index.includes('from "./repair-inverted-lote001-followup2.js"')) {
  index = index.replace(
    'import express from "express";',
    'import express from "express";\nimport { repairInvertedLote001Followup2 } from "./repair-inverted-lote001-followup2.js";'
  );
}
if (!index.includes("await repairInvertedLote001Followup2();")) {
  index = index.replace("await repairInvertedLote001Followup();", "await repairInvertedLote001Followup();\nawait repairInvertedLote001Followup2();");
}
fs.writeFileSync(indexPath, index, "utf8");
console.log("Lote 001 follow-up repair 2 installed.");

