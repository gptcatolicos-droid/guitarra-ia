import fs from "node:fs";

const moduleSource = `
import { gunzipSync } from "node:zlib";
import { pool } from "./db.js";

const REPAIR_SLUG = "repair-inverted-lote001-v2";
const SONG_ID = "5b6558ac-153f-4608-b7d0-281e78bed4eb";
const SOURCE_ID = "6a5f8eda1c6cc3db7b29be76";
const patch = JSON.parse(gunzipSync(Buffer.from("H4sIAJRXfGoC/61W3W7bNhR+FUK7aAJYWZym8CosF46jegaCDluK3kyDQVPHNjf+qCTlthvWd8llL3ox7BH8YjvUjy1b0tKsJUBbOjz8+J3vHJL6M2BaOVBubujbIAomVDG+/UeRseKSikTd6ZSSOwcGdKISdXV1RW7BGUrekzHTJgVLhgStfnCmnNFpzgqEiMQynJCTd5enfiyWpN0mifqBZ0o7bqUmKZBckaWgKxC42IFnMR3db3LBgDiqSOqfOnDRaZKD0STjIJClBOfjaKF5P2okV+jD1tRodJruPMbl39SDUZVqglgMYTNNFL7YDAw9AL1psrzV5E0ORAgqkSmV2vRJULBAhTFog4J7DdZULgwcMd6TjgWR1JIsxxDV9iNz1BxBT/oSddGbqN207jSR/jwden7drD2I/eU57EYff+VkHjv2JNcPfEF6n/amtyT8X5utlaGuPeS13n7qFvv/7ZsX38g6/n6ha1W396094tXa3h/L9dK7F/YqmJ8QFomgSKAJoykoaj32tJv9g/xL/V/RhaAuxxxc1spfR7PQt5PRafEflq9lGz7bfAhn31dv4zc5J8gTswBLYE77p0wzjUUwjfbzCqj6dXhRPcxqpvAOi2D7tx5gdAssAhRHwIYqFALzhImNmhRqRsPLhqGGWtDfcNLtuAi4ZFbwwRsiUeM2ThPkgJJXOtVnmJ7OxQ8MXjWc8y2m1EitONOWJEmiAKfuVOyb+hlyP0rMXrku2mE+SpJHSPEajNVkWOlStWrj/iH1WdFIWdn7DXvWaOWCELVW+LzW0LW/PUVtO0xHcne18z7TrL2vntX7ancAxnKEoR0k5CiZRcMQDmzffWh7IdWmbdSFhQXRQH3eGRAWwv5lFPb4xA/q7uN88jr++e7Huyfk5JVOcScI7BtfEHjEUQMMFOGG8FVOxYBYLYrNSahY5XiiHVwrG2o4ZVwrsMX3176Cju7vvkJCMBR7dzjDsTilxJWypbFUdNT0LAR83tJr9KA8iQoGgasqAYJI5UIMgjW1c7bG684GkTM5lJaG25IKi9bSZ55bSIPolyCWCDbBPsU+xn6DHe8e/L3GHvsuR8Gvg0AbvuKKivnv8L5elNFMB9E50skVVyv8So6t296rFE/LkxgvjRsyJdcEThEm5cslZ7lwODt4sb1nXKBVUIUpW0ExNfPHtbdah6QxkCDLF4LbNXIdBNzOU5B6F8mGw1tbrs6dgPYnugcSuWfF/IBWIa3t1OBd7+aKSj+v8SW/H6umWhwLbT1mIKPcQDpf+CjKt5ArLEQHaSi0g/PzYbi5CP76F3PgCwQ/DAAA", "base64")).toString("utf8"));

export async function repairInvertedLote001Followup() {
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
      console.log("Lote 001 follow-up skipped: Song is absent");
      return { status: "absent" };
    }
    if (String(row.data?.source_id || "") !== SOURCE_ID) {
      throw new Error("Unexpected source_id for Canción Animal");
    }
    const artistResult = await client.query(
      "SELECT id,data FROM entity_records WHERE entity_name='Artist' AND data->>'slug'='soda-stereo' ORDER BY created_date ASC,id ASC LIMIT 1"
    );
    if (!artistResult.rows[0]) throw new Error("Soda Stereo artist record is missing");
    const artist = artistResult.rows[0];
    const finalPatch = {
      ...patch,
      artist_id: String(artist.id),
      repaired_at: new Date().toISOString(),
      seo_title: "Canción Animal - Acordes y tablatura | Soda Stereo | GuitarraIA",
      seo_description: "Aprende a tocar Canción Animal de Soda Stereo en guitarra. Acordes, tonalidad, cejilla y práctica en GuitarraIA.",
      meta_title: "Canción Animal - Acordes y tablatura | Soda Stereo | GuitarraIA",
      meta_description: "Aprende a tocar Canción Animal de Soda Stereo en guitarra. Acordes, tonalidad, cejilla y práctica en GuitarraIA.",
      seo_canonical_path: "/soda-stereo/cancion-animal",
    };
    await client.query(
      "UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1",
      [row.id, JSON.stringify(finalPatch)]
    );
    const audit = {
      slug: REPAIR_SLUG,
      status: "completed",
      song_id: String(row.id),
      source_id: SOURCE_ID,
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
    console.log("Lote 001 follow-up completed", audit);
    return audit;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Lote 001 follow-up rolled back", error);
    throw error;
  } finally {
    client.release();
  }
}
`;

fs.mkdirSync("server", { recursive: true });
fs.writeFileSync("server/repair-inverted-lote001-followup.js", moduleSource.trimStart(), "utf8");

const indexPath = "server/index.js";
let index = fs.readFileSync(indexPath, "utf8");
if (!index.includes('from "./repair-inverted-lote001-followup.js"')) {
  index = index.replace(
    'import express from "express";',
    'import express from "express";\nimport { repairInvertedLote001Followup } from "./repair-inverted-lote001-followup.js";'
  );
}
if (!index.includes("await repairInvertedLote001Followup();")) {
  index = index.replace("await repairInvertedLote001();", "await repairInvertedLote001();\nawait repairInvertedLote001Followup();");
}
fs.writeFileSync(indexPath, index, "utf8");
console.log("Lote 001 follow-up repair installed.");

// Install the final narrowly scoped follow-up in the same build step.
await import("./render-repair-inverted-lote001-followup2.mjs");
