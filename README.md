# Video de práctica desde Admin

Sube y sobrescribe estos archivos:

- `src/pages/AdminPage.jsx`
- `src/components/admin/SongCreatorForm.jsx`

En el editor de una canción existente aparecerá el campo:

**▶ Video para Práctica IA + YouTube (opcional)**

Pega únicamente una URL normal de YouTube, por ejemplo:

`https://www.youtube.com/watch?v=jhat-xUQ6dw`

Al guardar, el sistema valida el enlace, guarda el ID del video y activa
automáticamente el botón de práctica para esa canción. No se crean registros
duplicados ni se modifican otras canciones.
