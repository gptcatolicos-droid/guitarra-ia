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

write("server/functions.js", "import express from \"express\";\nimport jwt from \"jsonwebtoken\";\nimport crypto from \"node:crypto\";\nimport { pool } from \"./db.js\";\n\nexport const functionsRouter = express.Router();\nconst jwtSecret = process.env.JWT_SECRET || \"change-this-before-production\";\nconst MAX_AUDIO_BYTES = 80 * 1024 * 1024;\nconst AUDIO_EXTENSIONS = new Set([\"mp3\",\"wav\",\"m4a\",\"aac\",\"ogg\"]);\nconst CALLBACK_WINDOW_MS = 10 * 60 * 1000;\n\nfunction requireAdminRequest(req) {\n  const header = req.headers.authorization || \"\";\n  const token = header.startsWith(\"Bearer \") ? header.slice(7) : null;\n  if (!token) { const e=new Error(\"Authentication required\"); e.status=401; throw e; }\n  let user; try { user=jwt.verify(token,jwtSecret); } catch { const e=new Error(\"Invalid or expired token\"); e.status=401; throw e; }\n  if (user?.role !== \"admin\") { const e=new Error(\"Admin access required\"); e.status=403; throw e; }\n  return user;\n}\nfunction normalizeName(v){return String(v||\"\").normalize(\"NFD\").replace(/[\\u0300-\\u036f]/g,\"\").toLowerCase().replace(/[^a-z0-9\\s]/g,\" \").replace(/\\s+/g,\" \").trim();}\nfunction slugify(v){return normalizeName(v).replace(/\\s+/g,\"-\").replace(/-+/g,\"-\").replace(/^-|-$/g,\"\")||\"unknown\";}\nfunction normalizeRecord(row){return row?{id:String(row.id),...(row.data||{}),created_date:row.created_date,updated_date:row.updated_date}:null;}\nasync function findRecord(entity,id){const r=await pool.query(\"SELECT * FROM entity_records WHERE entity_name=$1 AND (id::text=$2 OR data->>'id'=$2) LIMIT 1\",[entity,String(id)]);return normalizeRecord(r.rows[0]);}\nasync function updateRecord(entity,id,patch){const r=await pool.query(\"UPDATE entity_records SET data=data || $3::jsonb, updated_date=NOW() WHERE entity_name=$1 AND (id::text=$2 OR data->>'id'=$2) RETURNING *\",[entity,String(id),JSON.stringify(patch)]);return normalizeRecord(r.rows[0]);}\nfunction spotifyEmbedDetails(value){const embed=String(value||\"\").trim();if(!embed)return{embed:\"\",embedUrl:\"\",trackId:\"\"};const src=embed.match(/src=[\"']([^\"']+)[\"']/i)?.[1]||embed;const embedUrl=src.split(\"?\")[0];const trackId=embedUrl.match(/\\/track\\/([A-Za-z0-9]+)/)?.[1]||\"\";return{embed,embedUrl,trackId};}\nfunction youtubeEmbedDetails(value){const embed=String(value||\"\").trim();if(!embed)return{embed:\"\",videoId:\"\"};const source=embed.match(/src=[\"']([^\"']+)[\"']/i)?.[1]||embed;const videoId=source.match(/(?:youtu\\.be\\/|youtube(?:-nocookie)?\\.com\\/(?:watch\\?[^#]*v=|embed\\/|shorts\\/))([A-Za-z0-9_-]{11})/i)?.[1]||\"\";return{embed,videoId};}\nconst CHORD_RE=/^[A-G](#|b)?(m|maj|min|dim|aug|sus|add|\u00b0|\u00f8)?[0-9]*(\\/[A-G](#|b)?)?$/;\nfunction firstChordFromContent(content){if(!content)return\"\";for(const rawLine of String(content).split(\"\\n\")){const line=rawLine.trim();if(!line||(line.startsWith(\"[\")&&line.endsWith(\"]\")))continue;const tokens=line.split(/\\s+/);if(tokens.length&&tokens.every(t=>CHORD_RE.test(t)))return tokens[0].split(\"/\")[0];}return\"\";}\nfunction hasMeaningfulSongContent(c){return typeof c===\"string\"&&c.trim().length>0;}\nasync function findExistingArtist(name){const slug=slugify(name), normalized=normalizeName(name);let r=await pool.query(\"SELECT * FROM entity_records WHERE entity_name='Artist' AND data->>'slug'=$1 LIMIT 1\",[slug]);if(r.rows[0])return normalizeRecord(r.rows[0]);r=await pool.query(\"SELECT * FROM entity_records WHERE entity_name='Artist'\");for(const row of r.rows){const a=normalizeRecord(row);if(normalizeName(a.name)===normalized)return a;if(Array.isArray(a.aliases)&&a.aliases.some(x=>normalizeName(x)===normalized))return a;}return null;}\nasync function findOrCreateArtist(name,identity={}){const imageUrl=String(identity.imageUrl||\"\").trim(),spotifyUrl=String(identity.spotifyUrl||\"\").trim();const existing=await findExistingArtist(name);if(existing){const p={};if(imageUrl)p.image_url=imageUrl;if(spotifyUrl)p.spotify_artist_url=spotifyUrl;if(Object.keys(p).length)return{artist:await updateRecord(\"Artist\",existing.id,p),created:false,reused:true};return{artist:existing,created:false,reused:true};}const data={name:String(name).trim(),slug:slugify(name),normalized_name:normalizeName(name),is_demo:false,is_featured:false,...(imageUrl?{image_url:imageUrl}:{}),...(spotifyUrl?{spotify_artist_url:spotifyUrl}:{})};const r=await pool.query(\"INSERT INTO entity_records(entity_name,data) VALUES('Artist',$1::jsonb) RETURNING *\",[JSON.stringify(data)]);return{artist:normalizeRecord(r.rows[0]),created:true,reused:false};}\nasync function createSongWithArtist(req,res){requireAdminRequest(req);const b=req.body||{},title=String(b.title||\"\").trim(),artistName=String(b.artist_name||\"\").trim(),contentRaw=b.content_raw||\"\",tablature=b.tablature||\"\";if(title.length<2)return res.status(400).json({error:\"El t\u00edtulo es obligatorio y debe tener al menos 2 caracteres.\"});if(!artistName)return res.status(400).json({error:\"El nombre del artista es obligatorio.\"});if(!contentRaw&&!tablature)return res.status(400).json({error:\"Debes proveer acordes (content_raw) o tablatura.\"});const songSlug=slugify(title),artistSlug=slugify(artistName);const dup=await pool.query(\"SELECT id FROM entity_records WHERE entity_name='Song' AND data->>'slug'=$1 AND data->>'artist_slug'=$2 LIMIT 1\",[songSlug,artistSlug]);if(dup.rows[0])return res.status(409).json({error:\"duplicate\",message:`Ya existe la canci\u00f3n \"${title}\" de ${artistName}.`,existing_id:String(dup.rows[0].id)});if(b.dryRun){const a=await findExistingArtist(artistName);return res.json({dryRun:true,songSlug,artistSlug,artistAction:a?\"reuse\":\"create\",artistId:a?.id||null,duplicate:false});}const {artist,created:artistCreated,reused:artistReused}=await findOrCreateArtist(artistName,{imageUrl:b.artist_image_url,spotifyUrl:b.spotify_artist_url});const manualSpotify=spotifyEmbedDetails(b.spotify_embed),manualYouTube=youtubeEmbedDetails(b.youtube_embed);const data={title,slug:songSlug,artist_name:artist.name,artist_slug:artistSlug,artist_id:artist.id,original_key:String(b.original_key||\"\").trim()||firstChordFromContent(contentRaw),capo:Number(b.capo)||0,tuning:b.tuning||\"Est\u00e1ndar\",difficulty:b.difficulty||\"Intermedia\",language:b.language||\"Espa\u00f1ol\",has_chords:Boolean(b.has_chords)||hasMeaningfulSongContent(contentRaw),has_tablature:Boolean(b.has_tablature)||hasMeaningfulSongContent(tablature),content_raw:contentRaw,tablature,chords_used:Array.isArray(b.chords_used)?b.chords_used:[],status:\"published\",is_demo:false,is_unplugged:Boolean(b.is_unplugged),views:0,spotify_match_status:manualSpotify.embed?\"matched\":\"pending\",...(manualYouTube.embed?{youtube_embed:manualYouTube.embed,youtube_video_id:manualYouTube.videoId,youtube_practice_enabled:false,youtube_analysis_status:manualYouTube.videoId?\"awaiting_audio\":\"not_requested\"}:{}),...(manualSpotify.embed?{spotify_embed:manualSpotify.embed,spotify_embed_url:manualSpotify.embedUrl,...(manualSpotify.trackId?{spotify_track_id:manualSpotify.trackId}:{}),spotify_match_method:\"manual\",spotify_manual_lock:true}:{})};const r=await pool.query(\"INSERT INTO entity_records(entity_name,data) VALUES('Song',$1::jsonb) RETURNING *\",[JSON.stringify(data)]);const song=normalizeRecord(r.rows[0]);return res.status(201).json({success:true,songId:song.id,songSlug,artistSlug,artistId:artist.id,artistCreated,artistReused});}\n\nasync function spotifyToken(){const id=process.env.SPOTIFY_CLIENT_ID,secret=process.env.SPOTIFY_CLIENT_SECRET;if(!id||!secret)throw Object.assign(new Error(\"Spotify credentials are not configured\"),{status:503});const auth=Buffer.from(`${id}:${secret}`).toString(\"base64\");const r=await fetch(\"https://accounts.spotify.com/api/token\",{method:\"POST\",headers:{Authorization:`Basic ${auth}`,\"Content-Type\":\"application/x-www-form-urlencoded\"},body:\"grant_type=client_credentials\"});if(!r.ok)throw new Error(`Spotify token failed: ${r.status}`);return(await r.json()).access_token;}\nasync function spotifyArtist(req,res){requireAdminRequest(req);const name=String(req.body?.artist_name||\"\").trim(),url=String(req.body?.spotify_url||\"\").trim();if(!name&&!url)return res.status(400).json({error:\"artist_name or spotify_url required\"});const token=await spotifyToken();let artist=null;const id=url.match(/artist\\/([A-Za-z0-9]+)/)?.[1];if(id){const r=await fetch(`https://api.spotify.com/v1/artists/${id}`,{headers:{Authorization:`Bearer ${token}`}});if(r.ok)artist=await r.json();}if(!artist){const r=await fetch(`https://api.spotify.com/v1/search?type=artist&limit=1&q=${encodeURIComponent(name)}`,{headers:{Authorization:`Bearer ${token}`}});if(r.ok)artist=(await r.json()).artists?.items?.[0];}if(!artist)return res.json({image_url:null,profile:null});const profile=artist.external_urls?.spotify||null;return res.json({image_url:artist.images?.[0]?.url||null,spotify_id:artist.id,followers:artist.followers?.total||0,name:artist.name,profile});}\n\n\nasync function requestPractice(req,res){requireAdminRequest(req);const p=req.body||{},song=await findRecord(\"Song\",p.songId);if(!song)return res.status(404).json({error:\"Canci\u00f3n no encontrada.\"});if(p.action===\"diagnostics\")return practiceDiagnostics(req,res);if(p.action===\"create_upload_ticket\"){const ext=String(p.filename||\"\").toLowerCase().split(\".\").pop()||\"\",size=Number(p.size);if(!AUDIO_EXTENSIONS.has(ext)||!Number.isFinite(size)||size<=0||size>MAX_AUDIO_BYTES)return res.status(400).json({error:\"Sube un audio MP3, WAV, M4A, AAC u OGG de m\u00e1ximo 80 MB.\"});const id=song.youtube_video_id||videoId(song.youtube_embed);if(!id)return res.status(400).json({error:\"Guarda primero una URL v\u00e1lida de YouTube.\"});const worker=process.env.YOUTUBE_PRACTICE_WORKER_URL,secret=process.env.YOUTUBE_PRACTICE_UPLOAD_SECRET;if(!worker||!secret)return res.status(503).json({error:\"La carga privada de audio a\u00fan no est\u00e1 configurada.\",missing:[!worker&&\"YOUTUBE_PRACTICE_WORKER_URL\",!secret&&\"YOUTUBE_PRACTICE_UPLOAD_SECRET\"].filter(Boolean)});const objectName=`incoming/${song.id}/${crypto.randomUUID()}.${ext}`,timestamp=String(Date.now()),signature=hmac(secret,`${timestamp}.${song.id}.${objectName}`);await updateRecord(\"Song\",song.id,{youtube_video_id:id,youtube_practice_enabled:false,youtube_practice_map:null,youtube_analysis_status:\"awaiting_audio\",youtube_analysis_error:null,youtube_analysis_updated_at:new Date().toISOString()});return res.json({upload_url:`${worker.replace(/\\/$/,\"\")}/upload`,object_name:objectName,timestamp,signature,expires_at:new Date(Date.now()+CALLBACK_WINDOW_MS).toISOString(),content_type:p.contentType||\"application/octet-stream\"});}\nconst objectName=String(p.audioObjectName||\"\").trim();if(!objectName)return res.status(400).json({error:\"No se recibi\u00f3 la referencia del audio privado.\"});const id=song.youtube_video_id||videoId(song.youtube_embed),source=cifrado(song);if(!id)return res.status(400).json({error:\"Pega primero una URL v\u00e1lida de YouTube.\"});if(source.chords.length<2)return res.status(400).json({error:\"La canci\u00f3n necesita un cifrado con al menos dos acordes.\"});const worker=process.env.YOUTUBE_PRACTICE_WORKER_URL,secret=process.env.YOUTUBE_PRACTICE_REQUEST_SECRET;if(!worker||!secret)return res.status(503).json({error:\"La integraci\u00f3n de an\u00e1lisis a\u00fan no est\u00e1 configurada.\"});const bodyObj={song_id:song.id,video_id:id,audio_object_name:objectName,catalog_chords:source.chords,catalog_sections:source.sections},body=JSON.stringify(bodyObj),timestamp=String(Date.now()),signature=hmac(secret,`${timestamp}.${body}`);await updateRecord(\"Song\",song.id,{youtube_video_id:id,youtube_practice_enabled:false,youtube_analysis_status:\"queued\",youtube_analysis_error:null,youtube_practice_map:null});const wr=await fetch(`${worker.replace(/\\/$/,\"\")}/analyze`,{method:\"POST\",headers:{\"content-type\":\"application/json\",\"x-guitarraia-timestamp\":timestamp,\"x-guitarraia-signature\":signature},body});if(!wr.ok){const detail=await wr.text();await updateRecord(\"Song\",song.id,{youtube_analysis_status:\"error\",youtube_analysis_error:\"No se pudo iniciar el an\u00e1lisis.\"});return res.status(502).json({error:detail||\"El analizador no respondi\u00f3.\"});}return res.json({success:true,status:\"queued\"});}\nfunction validPracticeMap(v){return v&&typeof v===\"object\"&&Array.isArray(v.chord_cues)&&v.chord_cues.length>=2&&v.chord_cues.every(c=>c&&Number.isFinite(Number(c.time))&&Number(c.time)>=0&&String(c.chord||\"\").trim());}\nasync function completePractice(req,res){const p=req.body||{},timestamp=req.headers[\"x-guitarraia-timestamp\"]||\"\",received=req.headers[\"x-guitarraia-signature\"]||\"\",secret=process.env.YOUTUBE_PRACTICE_CALLBACK_SECRET||\"\",raw=req.rawBody||JSON.stringify(p);if(!secret||!recentTimestamp(timestamp)||!safeEqual(received,hmac(secret,`${timestamp}.${raw}`)))return res.status(401).json({error:\"Unauthorized\"});const songId=String(p.song_id||\"\").trim(),status=String(p.status||\"\").trim();if(!songId||![\"ready\",\"error\",\"processing\"].includes(status))return res.status(400).json({error:\"Callback inv\u00e1lido.\"});const song=await findRecord(\"Song\",songId);if(!song)return res.status(404).json({error:\"Canci\u00f3n no encontrada.\"});if(p.video_id&&song.youtube_video_id&&p.video_id!==song.youtube_video_id)return res.status(409).json({error:\"El video no coincide con la canci\u00f3n.\"});if(status===\"processing\"){await updateRecord(\"Song\",song.id,{youtube_analysis_status:\"processing\",youtube_analysis_error:null,youtube_analysis_updated_at:new Date().toISOString()});return res.json({success:true,status});}if(status===\"error\"){await updateRecord(\"Song\",song.id,{youtube_practice_enabled:false,youtube_analysis_status:\"error\",youtube_analysis_error:String(p.error||\"El analizador no pudo completar el proceso.\").slice(0,500),youtube_analysis_updated_at:new Date().toISOString()});return res.json({success:true,status});}if(!validPracticeMap(p.map))return res.status(400).json({error:\"El mapa de pr\u00e1ctica no es v\u00e1lido.\"});const confidence=Number(p.map.confidence);await updateRecord(\"Song\",song.id,{youtube_video_id:p.video_id||song.youtube_video_id,youtube_practice_map:JSON.stringify(p.map),youtube_practice_enabled:false,youtube_analysis_status:\"ready\",youtube_analysis_error:null,youtube_analysis_confidence:Number.isFinite(confidence)?confidence:null,youtube_analysis_provider:String(p.map.provider||\"ChordMini\"),youtube_analysis_updated_at:new Date().toISOString()});return res.json({success:true,status:\"ready\"});}\nasync function practiceDiagnostics(req,res){requireAdminRequest(req);const worker=process.env.YOUTUBE_PRACTICE_WORKER_URL||\"\",requestSecret=process.env.YOUTUBE_PRACTICE_REQUEST_SECRET||\"\",uploadSecret=process.env.YOUTUBE_PRACTICE_UPLOAD_SECRET||\"\",callbackSecret=process.env.YOUTUBE_PRACTICE_CALLBACK_SECRET||\"\";let worker_health=null;try{if(worker){const r=await fetch(`${worker.replace(/\\/$/,\"\")}/health`);worker_health=await r.json().catch(()=>({status:r.status}));}}catch(e){worker_health={error:e.message};}return res.json({worker_url_configured:Boolean(worker),request_secret_fingerprint:fingerprint(requestSecret),upload_secret_fingerprint:fingerprint(uploadSecret),callback_secret_fingerprint:fingerprint(callbackSecret),worker_health});}\n\nasync function auditSitemap(req,res){requireAdminRequest(req);const origin=process.env.PUBLIC_ORIGIN||\"https://www.guitarraia.com\",sitemapUrl=`${origin.replace(/\\/$/,\"\")}/sitemap.xml`,robotsUrl=`${origin.replace(/\\/$/,\"\")}/robots.txt`;const [s,r]=await Promise.all([fetch(sitemapUrl),fetch(robotsUrl)]);const st=await s.text(),rt=await r.text();return res.json({sitemap:{ok:s.ok,status:s.status,finalUrl:s.url,urlCount:(st.match(/<url>/g)||[]).length,hasUrlset:/<urlset\\b/i.test(st),hasSitemapIndex:/<sitemapindex\\b/i.test(st)},robots:{ok:r.ok,status:r.status,robotsHasSitemap:rt.includes(`Sitemap: ${sitemapUrl}`)}});}\nasync function generateSeoForSong(req,res){requireAdminRequest(req);const song=await findRecord(\"Song\",req.body?.songId);if(!song)return res.status(404).json({error:\"Canci\u00f3n no encontrada.\"});const title=`${song.title} - Acordes y tablatura | ${song.artist_name} | GuitarraIA`.slice(0,70),description=`Aprende a tocar ${song.title} de ${song.artist_name} en guitarra. Acordes, tonalidad, cejilla y pr\u00e1ctica en GuitarraIA.`.slice(0,160),patch={seo_title:title,seo_description:description,meta_title:title,meta_description:description,seo_generated_at:new Date().toISOString()};await updateRecord(\"Song\",song.id,patch);return res.json({success:true,songId:song.id,...patch});}\nasync function generateSeoBatch(req,res){requireAdminRequest(req);const limit=Math.min(Math.max(Number(req.body?.batchSize)||20,1),100);const rows=(await pool.query(\"SELECT * FROM entity_records WHERE entity_name='Song' ORDER BY updated_date ASC LIMIT $1\",[limit])).rows;let processed=0;for(const row of rows){const song=normalizeRecord(row),title=`${song.title} - Acordes y tablatura | ${song.artist_name} | GuitarraIA`.slice(0,70),description=`Aprende a tocar ${song.title} de ${song.artist_name} en guitarra. Acordes, tonalidad, cejilla y pr\u00e1ctica en GuitarraIA.`.slice(0,160);await updateRecord(\"Song\",song.id,{seo_title:title,seo_description:description,meta_title:title,meta_description:description,seo_generated_at:new Date().toISOString()});processed++;}return res.json({success:true,processed,status:rows.length<limit?\"completed\":\"running\"});}\nfunction amazonAsin(v=\"\"){return String(v).match(/(?:dp|gp\\/product)\\/([A-Z0-9]{10})/i)?.[1]||String(v).match(/\\b([A-Z0-9]{10})\\b/)?.[1]||\"\";}\nasync function amazonLookup(req,res){requireAdminRequest(req);const url=String(req.body?.url||\"\").trim(),asin=amazonAsin(url);if(!asin)return res.status(400).json({error:\"No se pudo identificar un ASIN v\u00e1lido.\"});return res.json({asin,url:`https://www.amazon.com/dp/${asin}`,title:null,image_url:null,price:null,note:\"ASIN identificado. Completa t\u00edtulo, imagen y precio manualmente si Amazon no los expone p\u00fablicamente.\"});}\nasync function facebookGetPages(req,res){requireAdminRequest(req);const token=process.env.FACEBOOK_ACCESS_TOKEN;if(!token)return res.status(503).json({error:\"FACEBOOK_ACCESS_TOKEN is not configured\"});const r=await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=id,name,fan_count&access_token=${encodeURIComponent(token)}`);return res.status(r.status).json(await r.json());}\nasync function facebookPost(req,res){requireAdminRequest(req);const token=process.env.FACEBOOK_ACCESS_TOKEN;if(!token)return res.status(503).json({error:\"FACEBOOK_ACCESS_TOKEN is not configured\"});const pages=await fetch(`https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(token)}`);const data=await pages.json(),page=(data.data||[]).find(p=>!req.body?.pageId||p.id===req.body.pageId)||data.data?.[0];if(!page)return res.status(404).json({error:\"No Facebook Pages found for this account\"});const form=new URLSearchParams({message:String(req.body?.message||\"\"),access_token:page.access_token});if(req.body?.link)form.set(\"link\",req.body.link);const r=await fetch(`https://graph.facebook.com/v25.0/${page.id}/feed`,{method:\"POST\",headers:{\"Content-Type\":\"application/x-www-form-urlencoded\"},body:form});return res.status(r.status).json(await r.json());}\n\nfunctionsRouter.post(\"/:name\",async(req,res)=>{const name=req.params.name;try{\n if(name===\"createSongWithArtist\")return await createSongWithArtist(req,res);\n if(name===\"requestYouTubePracticeAnalysisV2\"||name===\"requestYouTubePracticeAnalysis\")return await requestPractice(req,res);\n if(name===\"completeYouTubePracticeAnalysis\")return await completePractice(req,res);\n if(name===\"youtubePracticeDiagnosticsV2\"||name===\"youtubePracticeDiagnostics\")return await practiceDiagnostics(req,res);\n if(name===\"spotifyArtist\")return await spotifyArtist(req,res);\n if(name===\"syncSpotifyForSong\")return await syncSpotifyForSong(req,res);\n if(name===\"syncSpotifyCatalogBatch\")return await syncSpotifyCatalogBatch(req,res);\n if(name===\"auditPublicSitemap\")return await auditSitemap(req,res);\n if(name===\"generateSeoForSong\")return await generateSeoForSong(req,res);\n if(name===\"generateSeoForCatalogBatch\")return await generateSeoBatch(req,res);\n if(name===\"amazonProductLookup\")return await amazonLookup(req,res);\n if(name===\"facebookGetPages\")return await facebookGetPages(req,res);\n if(name===\"facebookPost\")return await facebookPost(req,res);\n if(name===\"spotifySearch\"){const token=await spotifyToken(),query=String(req.body?.query||req.body?.q||[req.body?.artist,req.body?.title].filter(Boolean).join(\" \")||\"\");const r=await fetch(`https://api.spotify.com/v1/search?type=track,artist&limit=10&q=${encodeURIComponent(query)}`,{headers:{Authorization:`Bearer ${token}`}});return res.status(r.status).json(await r.json());}\n if(name===\"songsterr\"){const q=String(req.body?.query||req.body?.q||\"\");const r=await fetch(`https://www.songsterr.com/a/ra/songs.json?pattern=${encodeURIComponent(q)}`);return res.status(r.status).json(await r.json());}\n return res.status(501).json({error:`Function '${name}' is not used by the current frontend or still requires a dedicated migration`,migration_pending:true});\n}catch(e){return res.status(e.status||500).json({error:e.message||\"Function failed\"});}});\n");

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
app.use(express.json({\n  limit: "10mb",\n  verify: (req, _res, buffer) => { req.rawBody = buffer.toString("utf8"); },\n}));

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
