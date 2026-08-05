import fs from "node:fs";

const indexPath = "server/index.js";
let index = fs.readFileSync(indexPath, "utf8");

if (!index.includes('import bcrypt from "bcryptjs";')) {
  index = index.replace(
    'import express from "express";',
    'import express from "express";\nimport bcrypt from "bcryptjs";\nimport { pool } from "./db.js";'
  );
}

if (!index.includes("async function ensureAdminUser")) {
  index = index.replace(
    "await initDatabase();",
    `await initDatabase();\n\nasync function ensureAdminUser() {\n  const email = String(process.env.ADMIN_EMAIL || \"\").trim().toLowerCase();\n  const password = String(process.env.ADMIN_PASSWORD || \"\");\n  if (!email || !password) {\n    console.warn(\"Admin bootstrap skipped: ADMIN_EMAIL or ADMIN_PASSWORD missing\");\n    return;\n  }\n  const passwordHash = await bcrypt.hash(password, 12);\n  await pool.query(\n    \`INSERT INTO app_users(email,password_hash,role,admin_role,verified)\n     VALUES($1,$2,'admin','Super Admin',TRUE)\n     ON CONFLICT (email) DO UPDATE SET\n       password_hash=EXCLUDED.password_hash,\n       role='admin',\n       admin_role='Super Admin',\n       verified=TRUE,\n       updated_date=NOW()\`,\n    [email, passwordHash]\n  );\n  console.log(\"Admin account ensured\");\n}\n\nawait ensureAdminUser();`
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

fs.writeFileSync(indexPath, index, "utf8");
console.log("Render admin bootstrap installed.");
