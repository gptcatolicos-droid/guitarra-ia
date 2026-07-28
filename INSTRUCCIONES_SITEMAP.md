# Corrección del sitemap de GuitarraIA

## Qué se corrigió

Google Search Console solo procesa la respuesta de la URL pública
`https://www.guitarraia.com/sitemap.xml`. El panel anterior intentaba auditar una
función interna de Base44 desde el navegador, lo que podía fallar por CORS y no
comprobaba el archivo que realmente recibe Google.

El sitemap público se mantiene como archivo estático para que el dominio canónico
lo entregue directamente. El generador elimina URLs repetidas usando la pareja
`artist_slug` + `slug`.

## Archivos corregidos

- `public/sitemap.xml`: 2403 URLs canónicas y únicas; incluye `/afinador` y
  `/unplugged`.
- `public/robots.txt`: declara el sitemap público y excluye rutas privadas o de
  búsqueda.
- `src/components/admin/SitemapPanel.jsx`: audita el archivo público y `robots.txt`
  que realmente recibe Google, sin consultar funciones internas.
- `scripts/generate-static-sitemap.mjs`: generador usado para construir el XML sin
  duplicados.

## Cómo publicarlo

1. Copia las carpetas y archivos conservando exactamente sus rutas.
2. Sube los cambios descomprimidos a GitHub; no subas el ZIP como un solo archivo.
3. Espera la sincronización con Base44 y publica una nueva versión de la app.
4. Abre `https://www.guitarraia.com/sitemap.xml` en una ventana privada.
5. En Admin → Sitemap, pulsa **Verificar sitemap público**. Debe mostrar HTTP 200,
   XML y “Listo para enviar”.
6. En Google Search Console, vuelve a enviar `sitemap.xml`.

No es necesario eliminar primero el sitemap de Search Console. Google puede tardar
varios días o semanas en descubrir e indexar las URLs; “descubierta” no significa
“indexada”.
