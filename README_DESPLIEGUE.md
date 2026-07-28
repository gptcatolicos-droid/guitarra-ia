# Análisis automático: Práctica con IA + YouTube

Este paquete reemplaza las guías piloto por un flujo real: al guardar una URL de YouTube desde el administrador, GuitarraIA toma los acordes del cifrado de esa canción, prepara un análisis privado y sólo muestra el botón rojo cuando recibe un mapa de tiempos válido.

## Qué se sube al repositorio de GuitarraIA

Sube el contenido de estas carpetas conservando sus rutas:

- `src/`
- `base44/entities/Song.jsonc`
- `base44/functions/`
- `cloud-run/chordmini-worker/`

`cloud-run/` va en la raíz del repositorio, no dentro de `src/`. Así GitHub conserva también el código que se despliega en Google Cloud Run.

`base44/entities/Song.jsonc` ya es el archivo completo y conserva todas las propiedades actuales. Sólo añade seis propiedades para el análisis; no modifica canciones, artistas, ni datos existentes. No subas el archivo `Song.practice-analysis-fields.jsonc`: es únicamente una referencia del cambio incluido en el archivo completo.

## Despliegue privado del analizador en Google Cloud

La cuenta de servicio ya creada debe seguir siendo:

`guitarraia-chordmini-worker@guitarraia.iam.gserviceaccount.com`

En Cloud Shell, desde una carpeta donde esté `cloud-run/chordmini-worker`, crea primero el repositorio de imágenes si aún no existe:

```bash
gcloud artifacts repositories create chordmini --repository-format=docker --location=us-central1 --project=guitarraia
```

Genera dos secretos distintos. No los guardes en GitHub ni los pegues en el chat:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Crea en Secret Manager los secretos con esos valores:

```bash
printf %s 'PRIMER_VALOR' | gcloud secrets create guitarraia-practice-request --data-file=- --project=guitarraia
printf %s 'SEGUNDO_VALOR' | gcloud secrets create guitarraia-practice-callback --data-file=- --project=guitarraia
```

Da a la cuenta de Cloud Run acceso de lectura a los dos secretos:

```bash
gcloud secrets add-iam-policy-binding guitarraia-practice-request --member=serviceAccount:guitarraia-chordmini-worker@guitarraia.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor --project=guitarraia
gcloud secrets add-iam-policy-binding guitarraia-practice-callback --member=serviceAccount:guitarraia-chordmini-worker@guitarraia.iam.gserviceaccount.com --role=roles/secretmanager.secretAccessor --project=guitarraia
```

Compila y despliega desde la carpeta `cloud-run/chordmini-worker`:

```bash
gcloud builds submit --tag us-central1-docker.pkg.dev/guitarraia/chordmini/guitarraia-chordmini:1 --project=guitarraia
gcloud run deploy guitarraia-chordmini --image us-central1-docker.pkg.dev/guitarraia/chordmini/guitarraia-chordmini:1 --region=us-central1 --project=guitarraia --service-account=guitarraia-chordmini-worker@guitarraia.iam.gserviceaccount.com --allow-unauthenticated --memory=8Gi --cpu=4 --timeout=900 --concurrency=1 --max-instances=1 --min-instances=0 --set-env-vars=AUDIO_TEMP_BUCKET=guitarraia-chordmini-temp,BASE44_CALLBACK_URL=https://www.guitarraia.com/functions/completeYouTubePracticeAnalysis --set-secrets=YOUTUBE_PRACTICE_REQUEST_SECRET=guitarraia-practice-request:latest,YOUTUBE_PRACTICE_CALLBACK_SECRET=guitarraia-practice-callback:latest
```

`--allow-unauthenticated` sólo permite que Base44 llegue al endpoint. Cada solicitud sigue exigiendo una firma HMAC privada; las URLs sin firma son rechazadas. El bucket no es público.

Al finalizar, copia la URL que devuelve Cloud Run y guárdala en Base44 como secreto `YOUTUBE_PRACTICE_WORKER_URL`.

Guarda los mismos valores privados en los secretos de Base44:

```bash
base44 secrets set YOUTUBE_PRACTICE_WORKER_URL='URL_DE_CLOUD_RUN'
base44 secrets set YOUTUBE_PRACTICE_REQUEST_SECRET='PRIMER_VALOR'
base44 secrets set YOUTUBE_PRACTICE_CALLBACK_SECRET='SEGUNDO_VALOR'
```

## Operación para el administrador

1. Abre una canción, pega únicamente una URL de YouTube y guarda.
2. La canción queda en estado de análisis. Todavía no se muestra el botón público.
3. El servicio procesa el audio temporalmente, lo elimina y devuelve un mapa de tiempos filtrado por los acordes del cifrado existente.
4. Cuando el estado sea `ready`, aparecen los botones de práctica en los cards y en la canción.

No hay editor manual de segundos. Si el análisis no identifica suficientes cambios compatibles con el cifrado, marca error y no publica una guía falsa.

## Derechos y uso

Utiliza esta automatización únicamente con videos y audio para los que GuitarraIA tenga autorización de análisis. El archivo temporal no se publica ni se conserva: el proceso lo borra inmediatamente y Cloud Storage lo elimina como respaldo después de un día.
