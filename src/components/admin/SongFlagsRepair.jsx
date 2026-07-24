import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const BATCH_SIZE = 200;

function emptyProgress() {
  return {
    scanned: 0,
    fixedSongs: 0,
    chordsActivated: 0,
    tablaturesActivated: 0,
  };
}

function hasContent(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function buildUpdates(songs) {
  const updates = [];
  let chordsActivated = 0;
  let tablaturesActivated = 0;

  for (const song of songs) {
    const update = { id: song.id };
    let changed = false;

    if (!song.has_chords && hasContent(song.content_raw)) {
      update.has_chords = true;
      chordsActivated += 1;
      changed = true;
    }

    if (!song.has_tablature && hasContent(song.tablature)) {
      update.has_tablature = true;
      tablaturesActivated += 1;
      changed = true;
    }

    if (changed) updates.push(update);
  }

  return { updates, chordsActivated, tablaturesActivated };
}

export default function SongFlagsRepair({ allSongsList = [], onCompleted }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(emptyProgress);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);

  const runRepair = async () => {
    if (!confirm(
      'Se revisará todo el catálogo y solo se activarán etiquetas cuando exista contenido real. No se borrará ni reemplazará ningún cifrado o tablatura. ¿Continuar?',
    )) return;

    setRunning(true);
    setError('');
    setCompleted(false);

    try {
      const {
        updates,
        chordsActivated,
        tablaturesActivated,
      } = buildUpdates(allSongsList);

      setProgress({
        scanned: allSongsList.length,
        fixedSongs: 0,
        chordsActivated,
        tablaturesActivated,
      });

      let fixedSongs = 0;
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        await base44.entities.Song.bulkUpdate(batch);
        fixedSongs += batch.length;
        setProgress({
          scanned: allSongsList.length,
          fixedSongs,
          chordsActivated,
          tablaturesActivated,
        });
      }

      setCompleted(true);
      await onCompleted?.();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.message ||
        'No se pudo completar la reparación.',
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Database className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground">Reparar etiquetas de contenido</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Activa <code>has_chords</code> cuando existe <code>content_raw</code> y
            {' '}<code>has_tablature</code> cuando existe <code>tablature</code>.
            No elimina ni modifica el contenido musical.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <Metric label="Revisadas" value={progress.scanned} />
        <Metric label="Corregidas" value={progress.fixedSongs} />
        <Metric label="Acordes activados" value={progress.chordsActivated} />
        <Metric label="Tabs activadas" value={progress.tablaturesActivated} />
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {completed && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Reparación terminada: {progress.fixedSongs} canciones corregidas de {progress.scanned} revisadas.
          </span>
        </div>
      )}

      <button
        onClick={runRepair}
        disabled={running || allSongsList.length === 0}
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {running
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Reparando catálogo…</>
          : <><Database className="w-4 h-4" /> Reparar canciones</>}
      </button>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
