# Práctica IA + YouTube basada en el cifrado — paquete completo

Sube **los cuatro archivos** respetando exactamente sus carpetas:

- `src/components/YouTubePracticePlayer.jsx`
- `src/pages/AdminPage.jsx`
- `src/components/admin/SongCreatorForm.jsx`
- `base44/functions/createSongWithArtist/entry.ts`

## Lo que queda resuelto

1. Cada canción toma el orden de acordes desde su propio cifrado; ya no hereda nunca la guía de Silent Lucidity.
2. Hysteria inicia en **D → G → Em → G → D**, porque así empieza su cifrado.
3. Para precisión por segundo, el editor de canciones existentes y el formulario de canción nueva incluyen un mapa opcional.
4. El mapa solo añade tiempos: los acordes siguen saliendo del cifrado.

## Formato del mapa

```
0:00 [Intro] D
0:04 G
0:08 Em
0:12 G
0:16 D
0:31 [Verso] D
```

Sin mapa, la práctica muestra la secuencia real del cifrado y avisa que no inventará segundos. Con mapa, el acorde grande, las secciones y los saltos quedan sincronizados con el video.

No modifica datos actuales, Spotify, artistas, rutas ni entidades existentes.

