1. Sube render-runtime-dedupe.mjs a la raíz de la rama migration/render.
2. En Render > guitarraia-render > Settings > Build Command, usa:

npm install --include=dev && node render-migration-bootstrap.mjs && npm install express pg cors dotenv bcryptjs jsonwebtoken --include=dev && npm run build && node render-runtime-dedupe.mjs && node --check server/index.js

3. Guarda. Render hará deploy. Si no, Manual Deploy > Clear build cache & deploy.
