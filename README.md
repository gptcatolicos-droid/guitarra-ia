# Actualización UX: práctica con IA y YouTube

## Archivos a subir

Sube los cuatro archivos conservando exactamente estas rutas en GitHub:

- `src/lib/youtubePractice.js`
- `src/components/chat/SongCard.jsx`
- `src/components/YouTubePracticePlayer.jsx`
- `src/pages/SongPage.jsx`

En GitHub entra en cada carpeta y usa **Add file → Upload files**. Sobrescribe
solamente el archivo equivalente, sin borrar ni reemplazar la carpeta `src`.

## Resultado

- La tarjeta de **Silent Lucidity** mostrará ambos botones: naranja para acordes
  y rojo **Practicar con IA - YouTube**.
- Una canción con URL/iframe de YouTube cargado desde Admin mostrará el botón
  rojo automáticamente.
- La vista normal muestra Spotify y acordes; la ruta `/practicar` muestra
  únicamente la práctica de YouTube, sin duplicar el reproductor de Spotify.
- El acorde activo de la práctica queda grande y centrado.

No modifica entidades ni datos de canciones.
