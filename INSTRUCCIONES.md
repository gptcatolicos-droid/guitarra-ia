# Reparación: importador de audio para Práctica IA + YouTube

Este paquete corrige el error actual de pantalla blanca:

`Failed to resolve import "@/lib/youtubePracticeUpload"`

## Qué subir

Sube únicamente este archivo a la misma ruta dentro de tu repositorio:

`src/lib/youtubePracticeUpload.js`

No borres ni reemplaces `SongCreatorForm.jsx`: ya tiene el import correcto y solo le faltaba este archivo.

## Cómo hacerlo desde GitHub

1. Extrae este ZIP en tu computador.
2. En GitHub, entra a la carpeta `src`, después a `lib`.
3. Selecciona **Add file → Upload files** y carga `youtubePracticeUpload.js`.
4. Confirma el commit y espera la sincronización de Base44. Luego actualiza el preview.

Mensaje sugerido para el commit:

`fix: add private YouTube practice upload helper`

## Seguridad

Este archivo no modifica canciones, entidades ni datos del catálogo. Solicita al backend una carga firmada privada, sube el audio temporalmente y encola el análisis existente. No hace público el audio.
