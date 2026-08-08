import fs from "node:fs";
import path from "node:path";

const write = (file, content) => {
  const target = path.resolve(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.trimStart(), "utf8");
  console.log(`created ${file}`);
};

write("server/db.js", `
import pg from "pg";
const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function initDatabase() {
  await pool.query(\`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS entity_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      entity_name TEXT NOT NULL,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_entity_records_entity
      ON entity_records(entity_name);
    CREATE INDEX IF NOT EXISTS idx_entity_records_slug
      ON entity_records(entity_name, (data->>'slug'));
    CREATE INDEX IF NOT EXISTS idx_entity_records_status
      ON entity_records(entity_name, (data->>'status'));
    CREATE INDEX IF NOT EXISTS idx_entity_records_data_gin
      ON entity_records USING GIN(data);

    CREATE TABLE IF NOT EXISTS app_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      admin_role TEXT,
      verified BOOLEAN NOT NULL DEFAULT TRUE,
      created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  \`);
}
`);

write("server/auth.js", `
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

const secret = process.env.JWT_SECRET || "change-this-before-production";

export function signUser(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, admin_role: user.admin_role },
    secret,
    { expiresIn: "7d" }
  );
}

export function authMiddleware(optional = false) {
  return async (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      if (optional) return next();
      return res.status(401).json({ error: "Authentication required" });
    }
    try {
      req.user = jwt.verify(token, secret);
      next();
    } catch {
      if (optional) return next();
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export async function register(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || password.length < 8) {
    return res.status(400).json({ error: "Email and password of at least 8 characters are required" });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const result = await pool.query(
      \`INSERT INTO app_users(email,password_hash) VALUES($1,$2)
       RETURNING id,email,role,admin_role,verified,created_date\`,
      [email, passwordHash]
    );
    const user = result.rows[0];
    res.json({ user, access_token: signUser(user) });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Email already registered" });
    throw error;
  }
}

export async function login(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const result = await pool.query("SELECT * FROM app_users WHERE email=$1", [email]);
  const user = result.rows[0];
  if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  res.json({
    user: { id:user.id,email:user.email,role:user.role,admin_role:user.admin_role,verified:user.verified },
    access_token: signUser(user),
  });
}

export async function me(req, res) {
  const result = await pool.query(
    "SELECT id,email,role,admin_role,verified,created_date FROM app_users WHERE id=$1",
    [req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "User not found" });
  res.json(result.rows[0]);
}
`);

write("server/entities.js", `
import express from "express";
import { pool } from "./db.js";
import { authMiddleware, requireAdmin } from "./auth.js";

export const entitiesRouter = express.Router();

const publicEntities = new Set(["Song","Artist","BlogPost","Infographic","AmazonProduct"]);

function normalizeRow(row) {
  return {
    id: row.id,
    ...row.data,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
}

function parseSort(value) {
  const raw = String(value || "-created_date");
  const direction = raw.startsWith("-") ? "DESC" : "ASC";
  const field = raw.replace(/^-/, "");
  if (field === "created_date" || field === "updated_date") {
    return { expression: field, direction };
  }
  return { expression: \`data->>'\${field.replace(/[^a-zA-Z0-9_]/g, "")}'\`, direction };
}

entitiesRouter.get("/:entity", authMiddleware(true), async (req, res) => {
  const entity = req.params.entity;
  if (!publicEntities.has(entity) && req.user?.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const filter = req.query.filter ? JSON.parse(String(req.query.filter)) : {};
  const limit = Math.min(Number(req.query.limit || 100), 500);
  const skip = Math.max(Number(req.query.skip || 0), 0);
  const sort = parseSort(req.query.sort);

  const values = [entity];
  const clauses = ["entity_name=$1"];
  for (const [key, value] of Object.entries(filter || {})) {
    values.push(String(value));
    clauses.push(\`data->>'\${key.replace(/[^a-zA-Z0-9_]/g, "")}' = $\${values.length}\`);
  }
  values.push(limit, skip);

  const result = await pool.query(
    \`SELECT * FROM entity_records
     WHERE \${clauses.join(" AND ")}
     ORDER BY \${sort.expression} \${sort.direction}
     LIMIT $\${values.length-1} OFFSET $\${values.length}\`,
    values
  );
  res.json(result.rows.map(normalizeRow));
});

entitiesRouter.get("/:entity/:id", authMiddleware(true), async (req, res) => {
  const entity = req.params.entity;
  if (!publicEntities.has(entity) && req.user?.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  const result = await pool.query(
    "SELECT * FROM entity_records WHERE entity_name=$1 AND id=$2",
    [entity, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Record not found" });
  res.json(normalizeRow(result.rows[0]));
});

entitiesRouter.post("/:entity", authMiddleware(), requireAdmin, async (req, res) => {
  const result = await pool.query(
    "INSERT INTO entity_records(entity_name,data) VALUES($1,$2::jsonb) RETURNING *",
    [req.params.entity, JSON.stringify(req.body || {})]
  );
  res.status(201).json(normalizeRow(result.rows[0]));
});

entitiesRouter.put("/:entity/:id", authMiddleware(), requireAdmin, async (req, res) => {
  const result = await pool.query(
    \`UPDATE entity_records
     SET data = data || $3::jsonb, updated_date=NOW()
     WHERE entity_name=$1 AND id=$2 RETURNING *\`,
    [req.params.entity, req.params.id, JSON.stringify(req.body || {})]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Record not found" });
  res.json(normalizeRow(result.rows[0]));
});

entitiesRouter.delete("/:entity/:id", authMiddleware(), requireAdmin, async (req, res) => {
  const result = await pool.query(
    "DELETE FROM entity_records WHERE entity_name=$1 AND id=$2 RETURNING id",
    [req.params.entity, req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: "Record not found" });
  res.json({ success: true });
});
`);

write("server/functions.js", "import express from \"express\";\nimport jwt from \"jsonwebtoken\";\nimport { pool } from \"./db.js\";\n\nexport const functionsRouter = express.Router();\n\nconst jwtSecret = process.env.JWT_SECRET || \"change-this-before-production\";\n\nfunction requireAdminRequest(req) {\n  const header = req.headers.authorization || \"\";\n  const token = header.startsWith(\"Bearer \") ? header.slice(7) : null;\n  if (!token) { const error = new Error(\"Authentication required\"); error.status = 401; throw error; }\n  let user;\n  try { user = jwt.verify(token, jwtSecret); }\n  catch { const error = new Error(\"Invalid or expired token\"); error.status = 401; throw error; }\n  if (user?.role !== \"admin\") { const error = new Error(\"Admin access required\"); error.status = 403; throw error; }\n  return user;\n}\n\nfunction normalizeName(value) {\n  return String(value || \"\").normalize(\"NFD\").replace(/[\\u0300-\\u036f]/g, \"\").toLowerCase().replace(/[^a-z0-9\\s]/g, \" \").replace(/\\s+/g, \" \").trim();\n}\nfunction slugify(value) { return normalizeName(value).replace(/\\s+/g, \"-\").replace(/-+/g, \"-\").replace(/^-|-$/g, \"\") || \"unknown\"; }\n\nfunction spotifyEmbedDetails(value) {\n  const embed = String(value || \"\").trim();\n  if (!embed) return { embed: \"\", embedUrl: \"\", trackId: \"\" };\n  const src = embed.match(/src=[\"']([^\"']+)[\"']/i)?.[1] || embed;\n  const embedUrl = src.split(\"?\")[0];\n  const trackId = embedUrl.match(/\\/track\\/([A-Za-z0-9]+)/)?.[1] || \"\";\n  return { embed, embedUrl, trackId };\n}\nfunction youtubeEmbedDetails(value) {\n  const embed = String(value || \"\").trim();\n  if (!embed) return { embed: \"\", videoId: \"\" };\n  const source = embed.match(/src=[\"']([^\"']+)[\"']/i)?.[1] || embed;\n  const videoId = source.match(/(?:youtu\\.be\\/|youtube(?:-nocookie)?\\.com\\/(?:watch\\?[^#]*v=|embed\\/|shorts\\/))([A-Za-z0-9_-]{11})/i)?.[1] || \"\";\n  return { embed, videoId };\n}\nconst CHORD_RE = /^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|°|ø)?[0-9]*(\\/[A-G](#|b)?)?$/;\nfunction firstChordFromContent(content) {\n  if (!content) return \"\";\n  for (const rawLine of String(content).split(\"\\n\")) {\n    const line = rawLine.trim();\n    if (!line || (line.startsWith(\"[\") && line.endsWith(\"]\"))) continue;\n    const tokens = line.split(/\\s+/);\n    if (tokens.length && tokens.every(token => CHORD_RE.test(token))) return tokens[0].split(\"/\")[0];\n  }\n  return \"\";\n}\nfunction hasMeaningfulSongContent(content) { return typeof content === \"string\" && content.trim().length > 0; }\nfunction normalizeRecord(row) { return row ? { id: row.id, ...(row.data || {}), created_date: row.created_date, updated_date: row.updated_date } : null; }\n\nasync function findExistingArtist(artistName) {\n  const slug = slugify(artistName);\n  const normalized = normalizeName(artistName);\n  const bySlug = await pool.query(\"SELECT * FROM entity_records WHERE entity_name='Artist' AND data->>'slug'=$1 LIMIT 1\", [slug]);\n  if (bySlug.rows[0]) return normalizeRecord(bySlug.rows[0]);\n  const all = await pool.query(\"SELECT * FROM entity_records WHERE entity_name='Artist'\");\n  for (const row of all.rows) {\n    const artist = normalizeRecord(row);\n    if (normalizeName(artist.name) === normalized) return artist;\n    if (Array.isArray(artist.aliases) && artist.aliases.some(alias => normalizeName(alias) === normalized)) return artist;\n  }\n  return null;\n}\n\nasync function findOrCreateArtist(artistName, identity = {}) {\n  const imageUrl = String(identity.imageUrl || \"\").trim();\n  const spotifyUrl = String(identity.spotifyUrl || \"\").trim();\n  const existing = await findExistingArtist(artistName);\n  if (existing) {\n    const updates = {};\n    if (imageUrl) updates.image_url = imageUrl;\n    if (spotifyUrl) updates.spotify_artist_url = spotifyUrl;\n    if (Object.keys(updates).length) {\n      const result = await pool.query(\"UPDATE entity_records SET data=data || $2::jsonb, updated_date=NOW() WHERE id=$1 RETURNING *\", [existing.id, JSON.stringify(updates)]);\n      return { artist: normalizeRecord(result.rows[0]), created: false, reused: true };\n    }\n    return { artist: existing, created: false, reused: true };\n  }\n  const data = { name: String(artistName).trim(), slug: slugify(artistName), normalized_name: normalizeName(artistName), is_demo: false, is_featured: false, ...(imageUrl ? { image_url: imageUrl } : {}), ...(spotifyUrl ? { spotify_artist_url: spotifyUrl } : {}) };\n  const result = await pool.query(\"INSERT INTO entity_records(entity_name,data) VALUES('Artist',$1::jsonb) RETURNING *\", [JSON.stringify(data)]);\n  return { artist: normalizeRecord(result.rows[0]), created: true, reused: false };\n}\n\nasync function createSongWithArtist(req, res) {\n  requireAdminRequest(req);\n  const body = req.body || {};\n  const title = String(body.title || \"\").trim();\n  const artistName = String(body.artist_name || \"\").trim();\n  const contentRaw = body.content_raw || \"\";\n  const tablature = body.tablature || \"\";\n  if (title.length < 2) return res.status(400).json({ error: \"El título es obligatorio y debe tener al menos 2 caracteres.\" });\n  if (!artistName) return res.status(400).json({ error: \"El nombre del artista es obligatorio.\" });\n  if (!contentRaw && !tablature) return res.status(400).json({ error: \"Debes proveer acordes (content_raw) o tablatura.\" });\n\n  const songSlug = slugify(title);\n  const artistSlug = slugify(artistName);\n  const duplicate = await pool.query(\"SELECT id FROM entity_records WHERE entity_name='Song' AND data->>'slug'=$1 AND data->>'artist_slug'=$2 LIMIT 1\", [songSlug, artistSlug]);\n  if (duplicate.rows[0]) return res.status(409).json({ error: \"duplicate\", message: `Ya existe la canción \"${title}\" de ${artistName}.`, existing_id: duplicate.rows[0].id });\n  if (body.dryRun) {\n    const existingArtist = await findExistingArtist(artistName);\n    return res.json({ dryRun: true, songSlug, artistSlug, artistAction: existingArtist ? \"reuse\" : \"create\", artistId: existingArtist?.id || null, duplicate: false });\n  }\n\n  const { artist, created: artistCreated, reused: artistReused } = await findOrCreateArtist(artistName, { imageUrl: body.artist_image_url, spotifyUrl: body.spotify_artist_url });\n  const resolvedKey = String(body.original_key || \"\").trim() || firstChordFromContent(contentRaw);\n  const manualSpotify = spotifyEmbedDetails(body.spotify_embed);\n  const manualYouTube = youtubeEmbedDetails(body.youtube_embed);\n  const songData = {\n    title, slug: songSlug, artist_name: artist.name, artist_slug: artistSlug, artist_id: artist.id, original_key: resolvedKey || \"\", capo: Number(body.capo) || 0, tuning: body.tuning || \"Estándar\", difficulty: body.difficulty || \"Intermedia\", language: body.language || \"Español\",\n    has_chords: Boolean(body.has_chords) || hasMeaningfulSongContent(contentRaw), has_tablature: Boolean(body.has_tablature) || hasMeaningfulSongContent(tablature), content_raw: contentRaw, tablature, chords_used: Array.isArray(body.chords_used) ? body.chords_used : [], status: \"published\", is_demo: false, is_unplugged: Boolean(body.is_unplugged), views: 0, spotify_match_status: manualSpotify.embed ? \"matched\" : \"pending\",\n    ...(manualYouTube.embed ? { youtube_embed: manualYouTube.embed, youtube_video_id: manualYouTube.videoId, youtube_practice_enabled: false, youtube_analysis_status: manualYouTube.videoId ? \"awaiting_audio\" : \"not_requested\" } : {}),\n    ...(manualSpotify.embed ? { spotify_embed: manualSpotify.embed, spotify_embed_url: manualSpotify.embedUrl, ...(manualSpotify.trackId ? { spotify_track_id: manualSpotify.trackId } : {}), spotify_match_method: \"manual\", spotify_manual_lock: true } : {})\n  };\n  const result = await pool.query(\"INSERT INTO entity_records(entity_name,data) VALUES('Song',$1::jsonb) RETURNING *\", [JSON.stringify(songData)]);\n  const song = normalizeRecord(result.rows[0]);\n  return res.status(201).json({ success: true, songId: song.id, songSlug, artistSlug, artistId: artist.id, artistCreated, artistReused });\n}\n\nasync function spotifyToken() {\n  const id = process.env.SPOTIFY_CLIENT_ID;\n  const secret = process.env.SPOTIFY_CLIENT_SECRET;\n  if (!id || !secret) throw new Error(\"Spotify credentials are not configured\");\n  const auth = Buffer.from(`${id}:${secret}`).toString(\"base64\");\n  const response = await fetch(\"https://accounts.spotify.com/api/token\", { method: \"POST\", headers: { Authorization: `Basic ${auth}`, \"Content-Type\": \"application/x-www-form-urlencoded\" }, body: \"grant_type=client_credentials\" });\n  if (!response.ok) throw new Error(`Spotify token failed: ${response.status}`);\n  return (await response.json()).access_token;\n}\n\nfunctionsRouter.post(\"/:name\", async (req, res) => {\n  const name = req.params.name;\n  try {\n    if (name === \"createSongWithArtist\") return await createSongWithArtist(req, res);\n    if (name === \"spotifySearch\") {\n      const token = await spotifyToken();\n      const query = String(req.body?.query || req.body?.q || \"\");\n      const response = await fetch(`https://api.spotify.com/v1/search?type=track,artist&limit=10&q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } });\n      return res.status(response.status).json(await response.json());\n    }\n    if (name === \"songsterr\") {\n      const query = String(req.body?.query || req.body?.q || \"\");\n      const response = await fetch(`https://www.songsterr.com/a/ra/songs.json?pattern=${encodeURIComponent(query)}`);\n      return res.status(response.status).json(await response.json());\n    }\n    return res.status(501).json({ error: `Function '${name}' is pending migration`, migration_pending: true });\n  } catch (error) { res.status(error.status || 500).json({ error: error.message || \"Function failed\" }); }\n});\n");

write("server/sitemap.js", `
import { pool } from "./db.js";

const escapeXml = (value="") =>
  String(value).replace(/[<>&'"]/g, c => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;" }[c]));

export async function sitemapHandler(req, res) {
  const origin = process.env.PUBLIC_ORIGIN || "https://www.guitarraia.com";
  const result = await pool.query(
    \`SELECT entity_name,data,updated_date FROM entity_records
     WHERE entity_name IN ('Song','Artist','BlogPost','Infographic')\`
  );

  const urls = [
    "/", "/buscar", "/chat", "/afinador", "/unplugged", "/practicar",
    "/acordes", "/artistas", "/canciones", "/tienda", "/blog",
    "/acerca", "/infografias"
  ].map(path => ({ loc: origin + path }));

  for (const row of result.rows) {
    const d = row.data || {};
    let pathname = null;
    if (row.entity_name === "Song" && d.artist_slug && d.slug) pathname = \`/\${d.artist_slug}/\${d.slug}\`;
    if (row.entity_name === "Artist" && d.slug) pathname = \`/\${d.slug}\`;
    if (row.entity_name === "BlogPost" && d.slug) pathname = \`/blog/\${d.slug}\`;
    if (row.entity_name === "Infographic" && d.slug) pathname = \`/infografias/\${d.slug}\`;
    if (pathname) urls.push({ loc: origin + pathname, lastmod: row.updated_date?.toISOString?.() });
  }

  const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
\${urls.map(u => \`<url><loc>\${escapeXml(u.loc)}</loc>\${u.lastmod ? \`<lastmod>\${u.lastmod}</lastmod>\` : ""}</url>\`).join("\\n")}
</urlset>\`;
  res.type("application/xml").send(xml);
}
`);

write("server/index.js", `
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initDatabase } from "./db.js";
import { entitiesRouter } from "./entities.js";
import { functionsRouter } from "./functions.js";
import { authMiddleware, login, me, register } from "./auth.js";
import { sitemapHandler } from "./sitemap.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

await initDatabase();

const app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_, res) =>
  res.json({ ok: true, app: "GuitarraIA", runtime: "Render", database: "PostgreSQL" })
);

app.post("/api/auth/register", register);
app.post("/api/auth/login", login);
app.get("/api/auth/me", authMiddleware(), me);

app.use("/api/entities", entitiesRouter);
app.use("/api/functions", functionsRouter);
app.get("/sitemap.xml", sitemapHandler);
app.get("/robots.txt", (_, res) => {
  const origin = process.env.PUBLIC_ORIGIN || "https://www.guitarraia.com";
  res.type("text/plain").send(\`User-agent: *
Allow: /
Disallow: /admin
Sitemap: \${origin}/sitemap.xml
\`);
});

app.use(express.static(dist, { index: false, maxAge: "1h" }));
app.use((_, res) => res.sendFile(path.join(dist, "index.html")));

const port = Number(process.env.PORT || 10000);
app.listen(port, "0.0.0.0", () => console.log(\`GuitarraIA listening on \${port}\`));
`);

write("src/api/base44Client.js", `
const API = import.meta.env.VITE_API_URL || "";

function token() {
  return localStorage.getItem("guitarraia_access_token");
}

async function request(path, options = {}) {
  const response = await fetch(\`\${API}\${path}\`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token() ? { Authorization: \`Bearer \${token()}\` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || \`Request failed with status \${response.status}\`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

function entity(name) {
  return {
    list: (sort="-created_date", limit=100, skip=0) =>
      request(\`/api/entities/\${name}?sort=\${encodeURIComponent(sort)}&limit=\${limit}&skip=\${skip}\`),
    filter: (filter={}, sort="-created_date", limit=100, skip=0) =>
      request(\`/api/entities/\${name}?filter=\${encodeURIComponent(JSON.stringify(filter))}&sort=\${encodeURIComponent(sort)}&limit=\${limit}&skip=\${skip}\`),
    get: (id) => request(\`/api/entities/\${name}/\${id}\`),
    create: (data) => request(\`/api/entities/\${name}\`, { method:"POST", body:JSON.stringify(data) }),
    update: (id, data) => request(\`/api/entities/\${name}/\${id}\`, { method:"PUT", body:JSON.stringify(data) }),
    delete: (id) => request(\`/api/entities/\${name}/\${id}\`, { method:"DELETE" }),
  };
}

export const base44 = {
  entities: new Proxy({}, { get: (_, name) => entity(String(name)) }),
  functions: {
    invoke: async (name, payload={}) => ({ data: await request(\`/api/functions/\${name}\`, {
      method:"POST", body:JSON.stringify(payload)
    }) }),
  },
  auth: {
    me: () => request("/api/auth/me"),
    loginViaEmailPassword: async (email, password) => {
      const result = await request("/api/auth/login", {
        method:"POST", body:JSON.stringify({ email, password })
      });
      localStorage.setItem("guitarraia_access_token", result.access_token);
      return result;
    },
    register: async ({ email, password }) => {
      const result = await request("/api/auth/register", {
        method:"POST", body:JSON.stringify({ email, password })
      });
      localStorage.setItem("guitarraia_access_token", result.access_token);
      return result;
    },
    setToken: value => localStorage.setItem("guitarraia_access_token", value),
    logout: () => {
      localStorage.removeItem("guitarraia_access_token");
      window.location.assign("/");
    },
    redirectToLogin: from => {
      const url = new URL("/login", window.location.origin);
      if (from) url.searchParams.set("from", from);
      window.location.assign(url.toString());
    },
    loginWithProvider: () => { throw new Error("Google login is pending configuration"); },
    verifyOtp: async () => ({ access_token: token() }),
    resendOtp: async () => ({ success:true }),
    resetPasswordRequest: async () => ({ success:true }),
    resetPassword: async () => ({ success:true }),
  },
};
`);

write("src/lib/AuthContext.jsx", `
import React, { createContext, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error.status !== 401) setAuthError({ type:"unknown", message:error.message });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => { checkUserAuth(); }, []);

  const logout = () => base44.auth.logout();
  const navigateToLogin = () => base44.auth.redirectToLogin(window.location.href);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings:false,
      authError,
      appPublicSettings:{ public_settings:{ visibility:"public" } },
      authChecked:true,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState:checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
};
`);

write(".env.render.example", `
DATABASE_URL=postgresql://...
JWT_SECRET=replace-with-a-long-random-secret
PUBLIC_ORIGIN=https://www.guitarraia.com
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
VITE_API_URL=
`);

write("RENDER_MIGRATION_STATUS.md", `
# GuitarraIA Render Migration — Phase 1

This bootstrap creates:

- Node/Express runtime
- PostgreSQL JSONB entity compatibility layer
- Email/password authentication
- Base44-compatible frontend client
- SPA fallback for every existing route
- Dynamic sitemap.xml
- robots.txt
- Spotify Search and Songsterr function endpoints
- Health endpoint at /api/health

## Render build command

node render-migration-bootstrap.mjs && npm install express pg cors dotenv bcryptjs jsonwebtoken && npm run build

## Render start command

node server/index.js

## Required environment variables

DATABASE_URL
JWT_SECRET
PUBLIC_ORIGIN
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET

This is migration phase 1. Do not point guitarraia.com here until entity data and all backend functions are migrated and validated.
`);

console.log("Render migration bootstrap completed.");
