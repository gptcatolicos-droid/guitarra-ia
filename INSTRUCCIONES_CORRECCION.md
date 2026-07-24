# Corrección de etiquetas de canciones — GuitarraIA

## Qué corrige

- Muestra el cifrado si `content_raw` tiene contenido, aunque `has_chords` esté mal marcado.
- Muestra la tablatura si `tablature` tiene contenido, aunque `has_tablature` esté mal marcado.
- Añade una reparación segura por lotes para corregir definitivamente las filas de Base44.
- Evita que las nuevas canciones e importaciones vuelvan a guardar etiquetas falsas cuando sí existe contenido.
- No elimina ni reemplaza contenido musical.

## Archivos que debes reemplazar o agregar

1. `src/pages/SongPage.jsx`
2. `src/pages/AdminPage.jsx`
3. `src/lib/fileParser.js`
4. `src/lib/songContentFlags.js` (nuevo)
5. `src/components/admin/SongFlagsRepair.jsx` (nuevo)
6. `base44/shared/songContentFlags.js` (nuevo)
7. `base44/functions/repairSongContentFlags/entry.ts` (nuevo)
8. `base44/functions/createSongWithArtist/entry.ts`
9. `base44/functions/syncDrive/entry.ts`

## Cómo ejecutar la reparación

1. Copia los archivos respetando exactamente sus rutas.
2. Publica los cambios en Base44.
3. Entra al panel de administración.
4. Abre la pestaña **Reparar canciones**.
5. Pulsa **Reparar canciones** y confirma.
6. Espera a que el panel indique que terminó.

La función revisa el catálogo en lotes de 500 registros. Solo cambia etiquetas de `false` a `true` cuando el campo correspondiente contiene texto real.
