# Migración GuitarraIA a Render

La migración se trabaja exclusivamente en la rama `migration/render` y se valida primero en el servicio temporal de Render.

## Reglas de seguridad

- No modificar la rama `main` durante la migración.
- No cambiar el dominio `guitarraia.com` hasta completar QA funcional y SEO.
- No cancelar Base44 hasta validar datos, autenticación, funciones backend y panel administrativo.
- Mantener URLs, slugs, metadatos SEO, sitemap y robots.txt.
- Probar primero en `https://guitarraia-migration.onrender.com`.
- No copiar secretos ni credenciales al repositorio.

## Infraestructura temporal

- Rama: `migration/render`
- Servicio Render: `guitarraia-migration`
- Base PostgreSQL temporal: `guitarraia-db-migration`
- Blueprint de despliegue: `render.yaml`
- Verificación de salud: `/api/health`

## Estado actual

### Completado

- Frontend preparado para compilar con Vite en Render.
- Blueprint reproducible de Render agregado.
- Runtime Node/Express preparado mediante `render-migration-bootstrap.mjs`.
- Capa PostgreSQL JSONB compatible con entidades Base44 preparada.
- Autenticación básica email/contraseña preparada.
- Cliente frontend compatible con la interfaz actual de `base44` preparado.
- Sitemap, robots.txt, SPA fallback y health check preparados.
- Endpoints iniciales para Spotify Search y Songsterr preparados.

### Pendiente antes de producción

1. Conectar `DATABASE_URL` a la base temporal de Render.
2. Configurar `SPOTIFY_CLIENT_ID` y `SPOTIFY_CLIENT_SECRET`.
3. Ejecutar despliegue y validar `/api/health`.
4. Exportar y cargar entidades de Base44 en PostgreSQL conservando IDs, slugs y fechas.
5. Inventariar y migrar todas las funciones Base44 todavía no implementadas.
6. Validar registro, login, recuperación de contraseña y roles administrativos.
7. Validar Afinador IA, Acordes + Spotify, práctica con YouTube, blog, tienda y panel admin.
8. Comparar sitemap y URLs indexables contra producción.
9. Ejecutar QA móvil, desktop y navegadores principales.
10. Cambiar dominio únicamente después de aprobar la lista completa.

## Comandos de Render

Build:

```bash
node render-migration-bootstrap.mjs && npm install --no-save express@4 pg cors dotenv bcryptjs jsonwebtoken && npm run build
```

Start:

```bash
node server/index.js
```

## Variables requeridas

- `DATABASE_URL`
- `JWT_SECRET`
- `PUBLIC_ORIGIN`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `VITE_API_URL` (vacía cuando frontend y API usan el mismo dominio)
