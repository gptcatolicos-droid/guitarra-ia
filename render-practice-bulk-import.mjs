import fs from 'node:fs';

const moduleSource = String.raw`import jwt from "jsonwebtoken";
import { pool } from "./db.js";

const jwtSecret = process.env.JWT_SECRET || "change-this-before-production";
const MAX_ROWS = 500;

function requireAdmin(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw Object.assign(new Error("Authentication required"), { status: 401 });
  let user;
  try { user = jwt.verify(token, jwtSecret); }
  catch { throw Object.assign(new Error("Invalid or expired token"), { status: 401 }); }
  if (user?.role !== "admin") throw Object.assign(new Error("Admin access required"), { status: 403 });
}

function normalize(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(value = "") {
  return normalize(value).replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "unknown";
}

function videoId(value = "") {
  const text = String(value).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
  try {
    const url = new URL(text);
    if (url.hostname === "youtu.be") {
      const candidate = url.pathname.split("/").filter(Boolean)[0] || "";
      return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : "";
    }
    if (url.hostname.endsWith("youtube.com") || url.hostname.endsWith("youtube-nocookie.com")) {
      const candidate = url.searchParams.get("v") || url.pathname.match(/\/(?:embed|shorts)\/([A-Za-z0-9_-]{11})/)?.[1] || "";
      return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : "";
    }
  } catch {}
  return text.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/i)?.[1] || "";
}

async function findSong(title, artist) {
  const result = await pool.query(
    "SELECT * FROM entity_records WHERE entity_name='Song' AND data->>'slug'=$1 AND data->>'artist_slug'=$2 ORDER BY updated_date DESC LIMIT 1",
    [slugify(title), slugify(artist)],
  );
  return result.rows[0] || null;
}

async function findOrCreateArtist(name) {
  const slug = slugify(name);
  let result = await pool.query(
    "SELECT * FROM entity_records WHERE entity_name='Artist' AND data->>'slug'=$1 ORDER BY updated_date DESC LIMIT 1",
    [slug],
  );
  if (result.rows[0]) return result.rows[0];
  const data = { name: String(name).trim(), slug, normalized_name: normalize(name), is_demo: false, is_featured: false };
  result = await pool.query(
    "INSERT INTO entity_records(entity_name,data) VALUES('Artist',$1::jsonb) RETURNING *",
    [JSON.stringify(data)],
  );
  return result.rows[0];
}

export async function bulkUpsertYouTubePractice(req, res) {
  requireAdmin(req);
  const inputRows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!inputRows.length) return res.status(400).json({ error: "Agrega al menos una canción." });
  if (inputRows.length > MAX_ROWS) return res.status(400).json({ error: "El máximo es " + MAX_ROWS + " canciones por lote." });

  const createMissing = req.body?.createMissing !== false;
  const results = [];
  const seen = new Set();

  for (let index = 0; index < inputRows.length; index += 1) {
    const row = inputRows[index] || {};
    const artist = String(row.artist || "").trim();
    const title = String(row.title || "").trim();
    const id = videoId(row.youtubeUrl);
    const key = slugify(artist) + "|" + slugify(title);

    if (!artist || title.length < 2 || !id) {
      results.push({ index, artist, title, error: "Completa artista, canción y una URL válida de YouTube." });
      continue;
    }
    if (seen.has(key)) {
      results.push({ index, artist, title, error: "La canción está repetida dentro del CSV." });
      continue;
    }
    seen.add(key);

    try {
      const canonicalUrl = "https://www.youtube.com/watch?v=" + id;
      const existing = await findSong(title, artist);
      if (existing) {
        const previous = existing.data || {};
        const changed = previous.youtube_video_id !== id;
        const patch = {
          youtube_embed: canonicalUrl,
          youtube_video_id: id,
          ...(changed ? {
            youtube_practice_enabled: false,
            youtube_practice_map: null,
            youtube_analysis_status: "awaiting_audio",
            youtube_analysis_error: null,
          } : (!previous.youtube_analysis_status ? { youtube_analysis_status: "awaiting_audio" } : {})),
        };
        await pool.query(
          "UPDATE entity_records SET data=data || $2::jsonb, updated_date=NOW() WHERE id=$1",
          [existing.id, JSON.stringify(patch)],
        );
        results.push({ index, artist: previous.artist_name || artist, title: previous.title || title, songId: String(existing.id), status: changed ? "updated" : "matched", audioFile: row.audioFile || "" });
        continue;
      }

      if (!createMissing) {
        results.push({ index, artist, title, error: "La canción no existe en el catálogo." });
        continue;
      }

      const artistRecord = await findOrCreateArtist(artist);
      const artistData = artistRecord.data || {};
      const songData = {
        title,
        slug: slugify(title),
        artist_name: artistData.name || artist,
        artist_slug: artistData.slug || slugify(artist),
        artist_id: String(artistRecord.id),
        original_key: String(row.originalKey || "").trim(),
        capo: 0,
        tuning: "Estándar",
        difficulty: String(row.difficulty || "Intermedia").trim() || "Intermedia",
        language: String(row.language || "Español").trim() || "Español",
        has_chords: false,
        has_tablature: false,
        content_raw: "",
        tablature: "",
        chords_used: [],
        status: "published",
        is_demo: false,
        is_unplugged: false,
        views: 0,
        spotify_match_status: "pending",
        youtube_embed: canonicalUrl,
        youtube_video_id: id,
        youtube_practice_enabled: false,
        youtube_analysis_status: "awaiting_audio",
        youtube_analysis_error: null,
      };
      const inserted = await pool.query(
        "INSERT INTO entity_records(entity_name,data) VALUES('Song',$1::jsonb) RETURNING id",
        [JSON.stringify(songData)],
      );
      results.push({ index, artist: songData.artist_name, title, songId: String(inserted.rows[0].id), status: "created", audioFile: row.audioFile || "" });
    } catch (error) {
      results.push({ index, artist, title, error: error.message || "No se pudo preparar la canción." });
    }
  }

  return res.json({ success: true, processed: results.length, results });
}
`;

fs.mkdirSync('server', { recursive: true });
fs.writeFileSync('server/practice-bulk-import.js', moduleSource, 'utf8');

const functionsPath = 'server/functions.js';
let functionsSource = fs.readFileSync(functionsPath, 'utf8');
if (!functionsSource.includes('bulkUpsertYouTubePractice')) {
  functionsSource = functionsSource.replace(
    'import { pool } from "./db.js";',
    'import { pool } from "./db.js";\nimport { bulkUpsertYouTubePractice } from "./practice-bulk-import.js";',
  );
  functionsSource = functionsSource.replace(
    ' if(name==="createSongWithArtist")return await createSongWithArtist(req,res);',
    ' if(name==="bulkUpsertYouTubePractice")return await bulkUpsertYouTubePractice(req,res);\n if(name==="createSongWithArtist")return await createSongWithArtist(req,res);',
  );
}
fs.writeFileSync(functionsPath, functionsSource, 'utf8');
console.log('YouTube practice bulk importer backend installed.');
