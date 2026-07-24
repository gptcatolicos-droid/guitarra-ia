# Corrección del sitemap de GuitarraIA

## Qué estaba pasando

La función backend calculaba miles de registros, pero la URL pública
`https://www.guitarraia.com/sitemap.xml` seguía entregando un archivo estático
antiguo de solo 12 URLs. Google Search Console únicamente puede procesar el XML
que recibe en esa URL pública.

Además, las 3249 filas publicadas de `Song` no representan 3249 URLs distintas:
hay registros repetidos con el mismo `artist_slug` y `slug`.

## Archivos corregidos

- `public/sitemap.xml`: 2401 URLs canónicas y únicas obtenidas de Base44.
- `public/robots.txt`: declara el sitemap público y excluye rutas privadas o de
  búsqueda.
- `src/components/admin/SitemapPanel.jsx`: audita el archivo público que realmente
  recibe Google, no la función backend.
- `scripts/generate-static-sitemap.mjs`: generador usado para construir el XML sin
  duplicados.

## Cómo publicarlo

1. Copia las carpetas y archivos conservando exactamente sus rutas.
2. Sube los cambios descomprimidos a GitHub; no subas el ZIP como un solo archivo.
3. Espera la sincronización con Base44 y publica una nueva versión de la app.
4. Abre `https://www.guitarraia.com/sitemap.xml` en una ventana privada.
5. Comprueba que el XML empieza con `<?xml version="1.0"` y contiene muchas
   etiquetas `<url>`.
6. En Google Search Console, vuelve a enviar `sitemap.xml`.

No es necesario eliminar primero el sitemap de Search Console. Google puede tardar
varios días o semanas en descubrir e indexar las URLs; “descubierta” no significa
“indexada”.
