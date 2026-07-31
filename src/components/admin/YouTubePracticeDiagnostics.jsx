import { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function StatusRow({ label, ok, detail }) {
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-secondary/20 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
      </div>
      <Icon className={`h-5 w-5 shrink-0 ${ok ? 'text-green-500' : 'text-red-500'}`} />
    </div>
  );
}

export default function YouTubePracticeDiagnostics() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runDiagnostics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await base44.functions.invoke('youtubePracticeDiagnosticsV2', {});
      setResult(response?.data || response);
    } catch (diagnosticError) {
      setResult(null);
      setError(
        diagnosticError?.response?.data?.error
        || diagnosticError?.message
        || 'No se pudo ejecutar el diagnóstico.',
      );
    } finally {
      setLoading(false);
    }
  };

  const configuration = result?.configuration || {};
  const worker = result?.worker || {};
  const secretMatches = result?.secret_matches || {};

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Activity className="h-5 w-5" /> Diagnóstico de práctica IA
          </div>
          <h2 className="mt-1 text-xl font-bold text-foreground">YouTube + ChordMini</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Comprueba la configuración de Base44 y la salud del worker sin mostrar los valores de los secretos.
          </p>
        </div>
        <button
          type="button"
          onClick={runDiagnostics}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? 'Comprobando...' : 'Ejecutar diagnóstico'}
        </button>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-5">
          <div className={`rounded-xl border p-4 ${result.ready_for_pilot ? 'border-green-500/20 bg-green-500/10' : 'border-amber-500/20 bg-amber-500/10'}`}>
            <p className={`font-semibold ${result.ready_for_pilot ? 'text-green-700' : 'text-amber-700'}`}>
              {result.ready_for_pilot ? 'Infraestructura lista para la canción piloto' : 'La infraestructura todavía tiene elementos pendientes'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Última comprobación: {new Date(result.checked_at).toLocaleString()}</p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Configuración en Base44</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <StatusRow label="URL del worker" ok={configuration.worker_url} />
              <StatusRow label="Secreto de solicitudes" ok={configuration.request_secret} />
              <StatusRow label="Secreto de carga" ok={configuration.upload_secret} />
              <StatusRow label="Secreto de callback" ok={configuration.callback_secret} />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Coincidencia de secretos</h3>
            <div className="grid gap-3 md:grid-cols-3">
              <StatusRow label="Secreto de carga coincide" ok={secretMatches.upload} detail={secretMatches.upload ? 'Base44 y Cloud Run usan el mismo valor.' : 'Los valores no coinciden o el worker aún no expone la huella.'} />
              <StatusRow label="Secreto de solicitudes coincide" ok={secretMatches.request} detail={secretMatches.request ? 'Base44 y Cloud Run usan el mismo valor.' : 'Los valores no coinciden o el worker aún no expone la huella.'} />
              <StatusRow label="Secreto de callback coincide" ok={secretMatches.callback} detail={secretMatches.callback ? 'Base44 y Cloud Run usan el mismo valor.' : 'Los valores no coinciden o el worker aún no expone la huella.'} />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Cloud Run y ChordMini</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <StatusRow label="Worker accesible" ok={worker.reachable} detail={worker.status ? `HTTP ${worker.status}` : worker.error} />
              <StatusRow label="Health check correcto" ok={worker.ok} />
              <StatusRow label="Bucket temporal disponible" ok={worker.storage} />
              <StatusRow label="ChordMini configurado" ok={worker.chordmini_configured} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
