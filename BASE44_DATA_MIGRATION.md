# Transferencia de datos Base44 → PostgreSQL

La aplicación de producción continúa en Base44. Estos pasos se ejecutan únicamente contra la base temporal de Render.

## Objetivo

Copiar las entidades sin duplicarlas y conservar el identificador original de Base44 como `source_id` dentro del JSONB.

## Formatos aceptados

### Un archivo por entidad

```json
[
  { "id": "base44-id-1", "slug": "ejemplo", "title": "Ejemplo" }
]
```

Ejecución:

```bash
DATABASE_URL="..." node scripts/import-base44-export.mjs ./exports/Song.json Song
```

### Varias entidades en un archivo

```json
{
  "entities": {
    "Song": [{ "id": "song-1", "slug": "cancion" }],
    "Artist": [{ "id": "artist-1", "slug": "artista" }]
  }
}
```

Ejecución:

```bash
DATABASE_URL="..." node scripts/import-base44-export.mjs ./exports/base44-export.json
```

## Comportamiento seguro

- El proceso es idempotente para registros que tengan ID de Base44.
- Una segunda ejecución actualiza el registro existente en lugar de duplicarlo.
- No se importan contraseñas de usuarios.
- Los usuarios deberán migrarse mediante invitación o restablecimiento de contraseña.
- No ejecutar contra una base de producción hasta validar conteos, slugs y relaciones.

## Orden recomendado

1. `Artist`
2. `Song`
3. `BlogPost`
4. `Infographic`
5. `AmazonProduct`
6. Entidades administrativas restantes

## Validación mínima

Después de cada entidad, verificar:

```sql
SELECT entity_name, COUNT(*)
FROM entity_records
GROUP BY entity_name
ORDER BY entity_name;
```

También se deben comparar:

- Conteo total por entidad.
- Slugs duplicados.
- Registros sin `source_id`.
- Canciones sin artista relacionado.
- URLs presentes en `sitemap.xml`.
