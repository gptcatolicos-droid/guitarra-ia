# Corrección del error 404

El error aparecía porque el botón intentaba invocar la función backend
`repairSongContentFlags`, pero esa función no había sido desplegada por Base44.

Esta versión ejecuta la reparación directamente desde la sesión de Super Admin
y ya no depende de esa función backend.

## Reemplaza solamente estos archivos

1. `src/components/admin/SongFlagsRepair.jsx`
2. `src/pages/AdminPage.jsx`

Después:

1. Haz commit y push a la rama `main`.
2. Espera la sincronización de Base44.
3. Pulsa **Publish**.
4. Recarga el panel administrativo.
5. Entra a **Reparar canciones** y pulsa el botón.

La reparación continúa siendo segura: solo activa etiquetas cuando existe
contenido real y no elimina ni modifica el cifrado o la tablatura.
