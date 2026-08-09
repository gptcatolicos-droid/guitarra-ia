GuitarraIA - HMAC runtime fix

1. Sube render-hmac-fix.mjs a la raíz de la rama migration/render.
2. En Render, agrega al final del Build Command, después de render-runtime-dedupe.mjs:

   && node render-hmac-fix.mjs && node --check server/functions.js && node --check server/index.js

3. Manual Deploy -> Clear build cache & deploy.

El parche no cambia secrets ni ChordMini. Solo añade crypto/hmac donde el runtime final lo necesita.
