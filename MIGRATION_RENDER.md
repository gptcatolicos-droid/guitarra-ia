# Migración GuitarraIA a Render

Este archivo confirma que la rama `migration/render` está activa y preparada para recibir los cambios de migración.

## Reglas de seguridad

- No modificar la rama `main`.
- No cambiar el dominio `guitarraia.com` durante la migración.
- No cancelar Base44 hasta validar todas las funcionalidades.
- Mantener las URLs, slugs, metadatos SEO, sitemap y robots.txt.
- Probar primero en `https://guitarraia-migration.onrender.com`.

## Infraestructura temporal

- Rama: `migration/render`
- Servicio Render: `guitarraia-migration`
- Base de datos temporal: `guitarraia-db-migration`

## Estado

- Frontend desplegado en Render.
- Base PostgreSQL temporal creada.
- Migración de datos y funciones backend pendiente.
