GuitarraIA Render - bootstrap sin duplicados Spotify

Reemplaza SOLO render-migration-bootstrap.mjs en la rama migration/render.

Qué corrige:
- Elimina del bootstrap las declaraciones syncSpotifyForSong y syncSpotifyCatalogBatch.
- Conserva el dispatch de rutas para que los parches posteriores render-spotify-*.mjs
  sean la única implementación de esas funciones.
- Mantiene intactas las funciones YouTube/ChordMini, creación de canciones, auth y SEO.

Después:
1. Commit en migration/render.
2. Render: Manual Deploy -> Clear build cache & deploy.
3. No cambies de rama ni los secrets.
