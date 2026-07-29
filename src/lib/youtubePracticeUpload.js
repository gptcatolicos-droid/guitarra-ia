const MAX_FILE_SIZE = 80 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['mp3', 'wav', 'm4a', 'aac', 'ogg']);

function getExtension(filename = '') {
  return String(filename).split('.').pop().toLowerCase();
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.error
    || error?.data?.error
    || error?.message
    || fallback;
}

/**
 * Sube el audio a la carga privada temporal y encola el análisis de práctica.
 * El archivo no se publica: el backend devuelve una URL firmada y luego el
 * worker guarda únicamente el mapa de acordes resultante en la canción.
 */
export async function uploadAndQueueYouTubePractice(base44, songId, file) {
  if (!base44?.functions?.invoke) {
    throw new Error('La conexión del administrador no está disponible. Recarga e inténtalo otra vez.');
  }

  if (!songId) {
    throw new Error('No se encontró la canción para asociar el audio.');
  }

  if (!file) {
    throw new Error('Selecciona un audio para sincronizar.');
  }

  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error('Sube un audio MP3, WAV, M4A, AAC u OGG.');
  }

  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_FILE_SIZE) {
    throw new Error('El audio debe pesar máximo 80 MB.');
  }

  let uploadTicket;
  try {
    const response = await base44.functions.invoke('completeYouTubePracticeAnalysis', {
      songId,
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      size: file.size,
    });
    uploadTicket = response?.data || response;
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No fue posible preparar la carga privada del audio.'));
  }

  if (!uploadTicket?.upload_url || !uploadTicket?.object_name) {
    throw new Error('No fue posible preparar la carga privada del audio.');
  }

  let uploadResponse;
  try {
    uploadResponse = await fetch(uploadTicket.upload_url, {
      method: 'PUT',
      headers: {
        'content-type': uploadTicket.content_type || file.type || 'application/octet-stream',
        'x-guitarraia-timestamp': uploadTicket.timestamp || '',
        'x-guitarraia-signature': uploadTicket.signature || '',
        'x-guitarraia-song-id': songId,
        'x-guitarraia-object-name': uploadTicket.object_name,
      },
      body: file,
    });
  } catch {
    throw new Error('No se pudo subir el audio privado. Revisa tu conexión e inténtalo otra vez.');
  }

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => '');
    throw new Error(detail || 'La carga privada del audio fue rechazada.');
  }

  try {
    const response = await base44.functions.invoke('requestYouTubePracticeAnalysis', {
      songId,
      audioObjectName: uploadTicket.object_name,
    });
    const analysis = response?.data || response;

    if (!analysis?.success && analysis?.status !== 'queued') {
      throw new Error(analysis?.error || 'No se pudo enviar el audio al analizador.');
    }

    return {
      ...analysis,
      status: 'queued',
      audioObjectName: uploadTicket.object_name,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error, 'No se pudo enviar el audio al analizador.'));
  }
}
