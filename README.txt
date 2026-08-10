GuitarraIA Render - Practice Helpers Fix

Corrige helpers faltantes del callback de ChordMini:
- recentTimestamp()
- safeEqual()
- fingerprint()
- videoId()

Sube render-practice-helpers-fix.mjs a la raíz de migration/render.

Build Command completo recomendado:
npm install --include=dev && node render-migration-bootstrap.mjs && npm install express pg cors dotenv bcryptjs jsonwebtoken --include=dev && npm run build && node render-runtime-dedupe.mjs && node render-hmac-fix.mjs && node render-cifrado-fix.mjs && node render-practice-helpers-fix.mjs && node --check server/functions.js && node --check server/index.js
