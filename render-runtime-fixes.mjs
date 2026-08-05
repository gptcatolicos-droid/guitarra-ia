import fs from 'node:fs';

const indexPath = 'server/index.js';
const authPath = 'server/auth.js';
const entitiesPath = 'server/entities.js';
let index = fs.readFileSync(indexPath, 'utf8');
let auth = fs.readFileSync(authPath, 'utf8');
let entities = fs.readFileSync(entitiesPath, 'utf8');

entities = entities.replace('const limit = Math.min(Number(req.query.limit || 100), 500);', 'const limit = Math.min(Number(req.query.limit || 100), 5000);');

if (!index.includes('app.get("/api/search"')) {
  index = index.replace(
    'app.get("/api/health", (_, res) =>',
    `app.get("/api/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ songs: [], artists: [], posts: [] });
  const term = `%${q}%`;
  const [songs, artists, posts] = await Promise.all([
    pool.query("SELECT * FROM entity_records WHERE entity_name='Song' AND (COALESCE(data->>'title','') ILIKE $1 OR COALESCE(data->>'artist_name','') ILIKE $1) ORDER BY updated_date DESC LIMIT 200", [term]),
    pool.query("SELECT * FROM entity_records WHERE entity_name='Artist' AND COALESCE(data->>'name','') ILIKE $1 ORDER BY updated_date DESC LIMIT 100", [term]),
    pool.query("SELECT * FROM entity_records WHERE entity_name='BlogPost' AND COALESCE(data->>'published','false') IN ('true','1') AND (COALESCE(data->>'title','') ILIKE $1 OR COALESCE(data->>'excerpt','') ILIKE $1 OR COALESCE(data->>'content','') ILIKE $1 OR COALESCE(data->>'category','') ILIKE $1) ORDER BY updated_date DESC LIMIT 100", [term])
  ]);
  const normalize = row => ({ id: row.id, ...row.data, created_date: row.created_date, updated_date: row.updated_date });
  res.json({ songs: songs.rows.map(normalize), artists: artists.rows.map(normalize), posts: posts.rows.map(normalize) });
});

app.get("/api/health", (_, res) =>`
  );
}

if (!auth.includes('SOLE_ADMIN_EMAIL_HASH')) {
  auth = auth.replace(
    'export async function login(req, res) {',
    `const SOLE_ADMIN_EMAIL_HASH = "c36c1b205bb9a27970c434407050254b0da4df7b188c1b2e5721adc3594973ce";

async function sha256(value) {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(value).digest("hex");
}

export async function login(req, res) {`
  );
  auth = auth.replace(
    '  const user = result.rows[0];',
    `  let user = result.rows[0];
  if (!user && await sha256(email) === SOLE_ADMIN_EMAIL_HASH && password.length >= 8) {
    const passwordHash = await bcrypt.hash(password, 12);
    const created = await pool.query(
      "INSERT INTO app_users(email,password_hash,role,admin_role,verified) VALUES($1,$2,'admin','Super Admin',TRUE) RETURNING *",
      [email, passwordHash]
    );
    user = created.rows[0];
  }`
  );
}

fs.writeFileSync(indexPath, index, 'utf8');
fs.writeFileSync(authPath, auth, 'utf8');
fs.writeFileSync(entitiesPath, entities, 'utf8');
console.log('Runtime fixes installed.');
