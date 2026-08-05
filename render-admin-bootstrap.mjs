import fs from "node:fs";

const indexPath = "server/index.js";
const authPath = "server/auth.js";

let index = fs.readFileSync(indexPath, "utf8");
let auth = fs.readFileSync(authPath, "utf8");

if (!index.includes('import { pool } from "./db.js";')) {
  index = index.replace(
    'import express from "express";',
    'import express from "express";\nimport { pool } from "./db.js";'
  );
}

if (!index.includes("async function ensureAdminUser")) {
  index = index.replace(
    "await initDatabase();",
    `await initDatabase();\n\nasync function ensureAdminUser() {\n  const email = String(process.env.ADMIN_EMAIL || \"\").trim().toLowerCase();\n  if (!email) {\n    console.warn(\"Admin bootstrap skipped: ADMIN_EMAIL missing\");\n    return;\n  }\n  await pool.query(\n    \`INSERT INTO app_users(email,password_hash,role,admin_role,verified)\n     VALUES($1,NULL,'admin','Super Admin',TRUE)\n     ON CONFLICT (email) DO UPDATE SET\n       role='admin',\n       admin_role='Super Admin',\n       verified=TRUE,\n       updated_date=NOW()\`,\n    [email]\n  );\n  console.log(\"Admin account ensured\");\n}\n\nawait ensureAdminUser();`
  );
}

index = index.replace(
  'app.post("/api/auth/register", register);',
  'app.post("/api/auth/register", (_, res) => res.status(404).json({ error: "Not found" }));'
);

index = index.replace(
  "Disallow: /admin",
  "Disallow: /admin\nDisallow: /dp-control-8f31c7\nDisallow: /supercalifragilisticoespialidoso"
);

if (!auth.includes("ADMIN_EMAIL first-login activation")) {
  auth = auth.replace(
    '  const user = result.rows[0];\n  if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {',
    `  let user = result.rows[0];\n\n  // ADMIN_EMAIL first-login activation: the submitted password is hashed once,\n  // then only the bcrypt hash remains in PostgreSQL.\n  const configuredAdminEmail = String(process.env.ADMIN_EMAIL || \"\").trim().toLowerCase();\n  if (user && !user.password_hash && email === configuredAdminEmail && password.length >= 8) {\n    const passwordHash = await bcrypt.hash(password, 12);\n    const activated = await pool.query(\n      \`UPDATE app_users\n       SET password_hash=$2, role='admin', admin_role='Super Admin', verified=TRUE, updated_date=NOW()\n       WHERE email=$1\n       RETURNING *\`,\n      [email, passwordHash]\n    );\n    user = activated.rows[0];\n  }\n\n  if (!user?.password_hash || !(await bcrypt.compare(password, user.password_hash))) {`
  );
}

fs.writeFileSync(indexPath, index, "utf8");
fs.writeFileSync(authPath, auth, "utf8");
console.log("Render admin bootstrap installed.");
