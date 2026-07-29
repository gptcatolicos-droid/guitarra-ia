# Práctica IA + YouTube: análisis privado con ChordMini

Este paquete añade un flujo administrado para sincronizar una canción del catálogo con su video de YouTube. El administrador pega el enlace del video y adjunta un audio autorizado de la **misma versión**. El worker privado analiza ese audio con ChordMini, contrasta sus acordes contra el cifrado ya guardado en GuitarraIA y conserva únicamente el mapa de tiempos resultante.

## Garantías del flujo

- El audio no se publica ni se entrega al navegador de los usuarios.
- Se carga a un bucket privado y se borra automáticamente al terminar, tanto si el análisis funciona como si falla.
- La regla de ciclo de vida de un día es una red de seguridad para archivos que no alcancen a borrarse.
- No se crean claves JSON de cuentas de servicio.
- El usuario final solo ve el video oficial de YouTube y el mapa de acordes guardado en la canción.

## Qué debe subir el administrador

En el editor de una canción:

1. Pega el enlace de YouTube oficial.
2. Adjunta un archivo autorizado `mp3`, `wav`, `m4a`, `aac` u `ogg` de máximo 80 MB, correspondiente a esa misma versión del video.
3. Guarda la canción.

El panel mostrará el estado `Audio privado pendiente`, `En cola`, `Analizando`, `Listo` o `Revisar`. Cuando termine, la página de práctica utiliza los tiempos guardados para mostrar el acorde actual, próximos cambios y secciones.

> Importante: si el cifrado está transpuesto frente al audio/video, no se debe forzar una sincronización falsa. El worker valida los resultados contra los acordes del cifrado y dejará el registro para revisión cuando no haya coincidencias fiables.

## Recursos de Google Cloud ya creados

- Proyecto: `guitarraia`
- Bucket privado: `guitarraia-chordmini-temp`
- Cuenta de servicio de Cloud Run: `guitarraia-chordmini-worker@guitarraia.iam.gserviceaccount.com`
- Rol de la cuenta de servicio: `roles/storage.objectUser`
- Regla de ciclo de vida: borrar objetos a partir de un día

No cambies el bucket a público y no generes una clave de la cuenta de servicio. Cloud Run recibe su identidad de Google directamente.

## 1. Subir los archivos del paquete

Copia cada archivo a la misma ruta dentro del repositorio de GuitarraIA. Los archivos de `base44/` se sincronizan con Base44; el directorio `cloud-run/chordmini-worker/` se despliega aparte en Cloud Run.

Antes de desplegar, revisa que no se hayan sustituido versiones más recientes de tus archivos existentes. Este paquete no cambia canciones, artistas ni datos actuales.

## 2. Crear secretos

Genera cuatro valores largos y aleatorios. No los pongas en el repositorio.

En Base44 configura:

```text
YOUTUBE_PRACTICE_WORKER_URL=https://URL-DEL-WORKER
YOUTUBE_PRACTICE_REQUEST_SECRET=valor-aleatorio-1
YOUTUBE_PRACTICE_UPLOAD_SECRET=valor-aleatorio-2
YOUTUBE_PRACTICE_CALLBACK_SECRET=valor-aleatorio-3
```

En Google Secret Manager crea los tres mismos secretos que consume Cloud Run:

```text
youtube-practice-request-secret
youtube-practice-upload-secret
youtube-practice-callback-secret
```

Usa como contenido exactamente los valores 1, 2 y 3 de Base44, respectivamente. El cuarto valor de Base44 es la URL pública del worker después de desplegarlo.

## 3. Construir y desplegar Cloud Run

Desde el directorio `cloud-run/chordmini-worker` ejecuta estos comandos en Cloud Shell. Sustituye `BASE44_CALLBACK_URL` por la URL pública exacta de la función `completeYouTubePracticeAnalysis` una vez Base44 haya sincronizado las funciones.

```bash
gcloud artifacts repositories create chordmini \
  --repository-format=docker \
  --location=us-central1 \
  --description="Imagen privada de análisis ChordMini" \
  --project=guitarraia

gcloud builds submit \
  --tag us-central1-docker.pkg.dev/guitarraia/chordmini/practice-worker:1 \
  --project=guitarraia

gcloud run deploy guitarraia-chordmini-worker \
  --image us-central1-docker.pkg.dev/guitarraia/chordmini/practice-worker:1 \
  --region us-central1 \
  --service-account guitarraia-chordmini-worker@guitarraia.iam.gserviceaccount.com \
  --min-instances 1 \
  --no-cpu-throttling \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 1 \
  --max-instances 1 \
  --allow-unauthenticated \
  --set-env-vars AUDIO_TEMP_BUCKET=guitarraia-chordmini-temp,BASE44_CALLBACK_URL=BASE44_CALLBACK_URL,ALLOWED_ORIGINS=https://guitarraia.com,https://www.guitarraia.com,MAX_AUDIO_BYTES=83886080 \
  --set-secrets YOUTUBE_PRACTICE_REQUEST_SECRET=youtube-practice-request-secret:latest,YOUTUBE_PRACTICE_UPLOAD_SECRET=youtube-practice-upload-secret:latest,YOUTUBE_PRACTICE_CALLBACK_SECRET=youtube-practice-callback-secret:latest \
  --project=guitarraia
```

`--allow-unauthenticated` solo permite que el navegador suba el audio temporal mediante un ticket HMAC de corta duración; el worker sigue validando firma, canción, ruta y tamaño. No convierte el bucket ni el audio en públicos.

Si pruebas desde el editor de Base44, añade temporalmente el origen exacto de su preview a `ALLOWED_ORIGINS`. En producción deja solo los dominios de GuitarraIA.

Después del despliegue copia la URL de Cloud Run a `YOUTUBE_PRACTICE_WORKER_URL` en los secretos de Base44 y actualiza el valor de `BASE44_CALLBACK_URL` en Cloud Run si aún estaba pendiente.

## 4. Pruebas de aceptación

Haz dos pruebas antes de procesar más canciones:

1. **Hysteria**: pega el video correcto, adjunta el audio autorizado de esa misma versión y confirma que el primer acorde detectado coincide con el cifrado (`D`, no el mapa piloto anterior en `G`).
2. **Silent Lucidity**: repite la carga y comprueba que cambian el acorde actual, los próximos acordes y las secciones mientras avanza el video.

Comprueba en Cloud Storage que el objeto desaparezca tras la finalización. La regla de un día solo debe actuar como respaldo.

## Operación y calidad

- Procesa pocas canciones a la vez: Cloud Run está deliberadamente configurado con concurrencia 1 para no agotar CPU ni memoria.
- Conserva el cifrado corregido de cada canción; es la referencia con la que se filtra ChordMini.
- Revisa el primer resultado de cada tipo de fuente. Reconocer acordes sobre una mezcla terminada es probabilístico y puede requerir corrección cuando la versión, afinación o transposición no coincide.
- Para volver a analizar una canción, guarda de nuevo un audio autorizado y su video. El mapa anterior se reemplaza únicamente cuando el nuevo análisis termina correctamente.

## Qué no hace este paquete

- No descarga audio de YouTube o Spotify.
- No acepta enlaces públicos de usuarios para procesarlos.
- No reproduce ni expone el archivo de audio cargado.
- No altera el catálogo existente hasta que el administrador inicia un análisis de una canción concreta.
