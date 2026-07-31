import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workerUrl = Deno.env.get('YOUTUBE_PRACTICE_WORKER_URL') || '';
    const requestSecret = Deno.env.get('YOUTUBE_PRACTICE_REQUEST_SECRET') || '';
    const uploadSecret = Deno.env.get('YOUTUBE_PRACTICE_UPLOAD_SECRET') || '';
    const callbackSecret = Deno.env.get('YOUTUBE_PRACTICE_CALLBACK_SECRET') || '';

    const configuration = {
      worker_url: Boolean(workerUrl),
      request_secret: Boolean(requestSecret),
      upload_secret: Boolean(uploadSecret),
      callback_secret: Boolean(callbackSecret),
    };

    let worker = {
      reachable: false,
      ok: false,
      storage: false,
      chordmini_configured: false,
      status: null as number | null,
      error: null as string | null,
    };

    if (workerUrl) {
      try {
        const response = await fetch(workerUrl.replace(/\/$/, '') + '/health', {
          headers: { accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
        const payload = await response.json().catch(() => ({}));
        worker = {
          reachable: true,
          ok: Boolean(response.ok && payload?.ok),
          storage: Boolean(payload?.storage),
          chordmini_configured: Boolean(payload?.chordmini_url),
          status: response.status,
          error: response.ok ? null : `HTTP ${response.status}`,
        };
      } catch (error) {
        worker.error = error?.message || 'No se pudo consultar el worker.';
      }
    }

    const allConfigured = Object.values(configuration).every(Boolean);
    const readyForPilot = allConfigured && worker.ok && worker.storage && worker.chordmini_configured;

    return Response.json({
      success: true,
      checked_at: new Date().toISOString(),
      configuration,
      worker,
      ready_for_pilot: readyForPilot,
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'No se pudo ejecutar el diagnóstico.' }, { status: 500 });
  }
});
