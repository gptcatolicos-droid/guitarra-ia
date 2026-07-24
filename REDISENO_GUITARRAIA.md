# Rediseño Guitarra IA — entrega para GitHub / Base44

Este repositorio conserva las entidades, funciones, rutas, lógica de catálogo, reproductores oficiales de Spotify/YouTube y el panel de administración existentes.

## Cambios incluidos

- Sistema visual blanco perlado con ondas naranja pastel y superficies translúcidas.
- Navegación lateral compacta en escritorio y dock inferior en móvil.
- Home rediseñado con búsqueda, afinador destacado y tarjetas de Spotify sin modificar sus colores oficiales.
- Página de canción rediseñada para lectura de acordes/tablatura y acceso directo al afinador.
- Panel de administración rediseñado, sin cambiar sus herramientas ni sus permisos.
- Nuevo `/afinador`: usa el micrófono del dispositivo y detección de tono local (sin subir audio) para la afinación estándar.

## Publicación

1. Sube **el contenido descomprimido** de este repositorio a la rama principal de GitHub. No subas el archivo ZIP dentro del repositorio.
2. Deja intactos `base44/`, `package.json` y `package-lock.json`.
3. En Base44 sincroniza desde la rama conectada de GitHub y publica la nueva versión.

## Verificación realizada

`npm run build` finaliza correctamente.

El proyecto contiene errores de TypeScript y lint preexistentes en componentes ajenos al rediseño; no bloquean la compilación de producción de Vite.
