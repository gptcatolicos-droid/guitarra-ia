import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, RefreshCw, CheckCircle, AlertCircle, Clock, Eye, Lock, Play, Pause, ChevronRight } from 'lucide-react';

const STATUS_CONFIG = {
  pending:          { label: 'Pendiente',        color: 'text-yellow-400',  bg: 'bg-yellow-400/10' },
  processing:       { label: 'Procesando',        color: 'text-blue-400',    bg: 'bg-blue-400/10' },
  generated:        { label: 'Generado',          color: 'text-cyan-400',    bg: 'bg-cyan-400/10' },
  review_required:  { label: 'Revisar',           color: 'text-orange-400',  bg: 'bg-orange-400/10' },
  approved:         { label: 'Aprobado',          color: 'text-green-400',   bg: 'bg-green-400/10' },
  published:        { label: 'Publicado',         color: 'text-green-300',   bg: 'bg-green-300/10' },
  error:            { label: 'Error',             color: 'text-red-400',     bg: 'bg-red-400/10' },
  disabled:         { label: 'Desactivado',       color: 'text-gray-500',    bg: 'bg-gray-500/10' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

function SongSeoRow({ song, onGenerate, onPreview, onApprove, onToggleLock, busy }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium truncate">{song.title}</p>
        <p className="text-xs text-muted-foreground truncate">{song.artist_name}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {song.seo_quality_score != null && (
          <span className="text-xs text-muted-foreground">Q:{song.seo_quality_score}</span>
        )}
        <StatusBadge status={song.seo_status || 'pending'} />
        {song.seo_manual_lock && <Lock className="w-3 h-3 text-muted-foreground" title="Bloqueado manualmente" />}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {song.seo_intro && (
          <button onClick={() => onPreview(song)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Ver preview">
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
        {(song.seo_status === 'generated' || song.seo_status === 'review_required') && !song.seo_manual_lock && (
          <button onClick={() => onApprove(song)} className="p-1.5 rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-colors" title="Aprobar">
            <CheckCircle className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={() => onToggleLock(song)} className={`p-1.5 rounded transition-colors ${song.seo_manual_lock ? 'text-orange-400 hover:text-orange-300' : 'text-muted-foreground hover:text-foreground'} hover:bg-secondary`} title={song.seo_manual_lock ? 'Desbloquear' : 'Bloquear edición automática'}>
          <Lock className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onGenerate(song.id)}
          disabled={busy}
          className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
          title="Generar / Regenerar SEO"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}

function PreviewModal({ song, onClose }) {
  if (!song) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-start justify-between gap-3">
          <div>
            <h3 className="text-foreground font-bold">{song.seo_title || song.title}</h3>
            <p className="text-muted-foreground text-sm mt-0.5">{song.seo_meta_description}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 text-lg">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {song.seo_intro && (
            <section>
              <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Intro SEO</h4>
              <p className="text-sm text-foreground">{song.seo_intro}</p>
            </section>
          )}
          {song.seo_how_to_play && (
            <section>
              <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cómo tocarla</h4>
              <p className="text-sm text-foreground">{song.seo_how_to_play}</p>
            </section>
          )}
          {song.seo_original_key_text && (
            <section>
              <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tono original</h4>
              <p className="text-sm text-foreground">{song.seo_original_key_text}</p>
            </section>
          )}
          {song.seo_capo_text && (
            <section>
              <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Capo</h4>
              <p className="text-sm text-foreground">{song.seo_capo_text}</p>
            </section>
          )}
          {song.seo_beginner_tips?.length > 0 && (
            <section>
              <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Consejos</h4>
              <ul className="space-y-1">
                {song.seo_beginner_tips.map((t, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary">•</span>{t}</li>
                ))}
              </ul>
            </section>
          )}
          {song.seo_faq?.length > 0 && (
            <section>
              <h4 className="text-xs text-muted-foreground uppercase tracking-wide mb-1">FAQ</h4>
              <div className="space-y-2">
                {song.seo_faq.map((f, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-foreground">{f.question}</p>
                    <p className="text-sm text-muted-foreground">{f.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {song.seo_review_notes && (
            <section className="bg-orange-400/10 border border-orange-400/20 rounded-lg p-3">
              <h4 className="text-xs text-orange-400 uppercase tracking-wide mb-1">Advertencias</h4>
              <p className="text-sm text-orange-300">{song.seo_review_notes}</p>
            </section>
          )}
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <StatusBadge status={song.seo_status} />
            {song.seo_quality_score != null && (
              <span className="text-xs text-muted-foreground">Score: {song.seo_quality_score}/100</span>
            )}
            {song.seo_generated_at && (
              <span className="text-xs text-muted-foreground">Generado: {new Date(song.seo_generated_at).toLocaleString('es-CO')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SeoManager({ allSongs, onRefresh }) {
  const [songs, setSongs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [busyIds, setBusyIds] = useState(new Set());
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchOffset, setBatchOffset] = useState(0);
  const [batchLog, setBatchLog] = useState([]);
  const [preview, setPreview] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);

  useEffect(() => { setSongs(allSongs || []); }, [allSongs]);

  const stats = {
    total: songs.length,
    pending: songs.filter(s => !s.seo_status || s.seo_status === 'pending').length,
    generated: songs.filter(s => s.seo_status === 'generated').length,
    review: songs.filter(s => s.seo_status === 'review_required').length,
    approved: songs.filter(s => ['approved', 'published'].includes(s.seo_status)).length,
    error: songs.filter(s => s.seo_status === 'error').length,
    locked: songs.filter(s => s.seo_manual_lock).length,
    noKey: songs.filter(s => !s.original_key).length,
    noCapo: songs.filter(s => !s.capo && s.capo !== 0).length,
    noDifficulty: songs.filter(s => !s.difficulty).length,
  };

  const filtered = songs.filter(s => {
    const st = s.seo_status || 'pending';
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && st === 'pending') ||
      (filter === 'review' && st === 'review_required') ||
      (filter === 'generated' && st === 'generated') ||
      (filter === 'approved' && ['approved', 'published'].includes(st)) ||
      (filter === 'error' && st === 'error') ||
      (filter === 'locked' && s.seo_manual_lock) ||
      (filter === 'nokey' && !s.original_key);
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.artist_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const generateOne = async (songId, force = false) => {
    setBusyIds(prev => new Set([...prev, songId]));
    try {
      await base44.functions.invoke('generateSeoForSong', { songId, force });
      onRefresh && onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyIds(prev => { const n = new Set(prev); n.delete(songId); return n; });
    }
  };

  const approveOne = async (song) => {
    await base44.entities.Song.update(song.id, { seo_status: 'approved', seo_updated_at: new Date().toISOString() });
    onRefresh && onRefresh();
  };

  const toggleLock = async (song) => {
    await base44.entities.Song.update(song.id, { seo_manual_lock: !song.seo_manual_lock });
    onRefresh && onRefresh();
  };

  const runDryRun = async () => {
    setBatchRunning(true);
    try {
      const res = await base44.functions.invoke('generateSeoForCatalogBatch', {
        dryRun: true, batchSize: 20, offset: batchOffset, processOnlyPending: true,
      });
      setDryRunResult(res.data);
    } catch (err) {
      setBatchLog(l => [...l, `Error: ${err.message}`]);
    } finally {
      setBatchRunning(false);
    }
  };

  const runBatch = async (force = false) => {
    setBatchRunning(true);
    setBatchLog([]);
    setBatchLog(l => [...l, `Iniciando lote (offset: ${batchOffset}, force: ${force})...`]);
    try {
      const res = await base44.functions.invoke('generateSeoForCatalogBatch', {
        batchSize: 20, offset: batchOffset, processOnlyPending: !force, force, dryRun: false,
      });
      const d = res.data;
      setBatchLog(l => [...l,
        `✓ Procesados: ${d.processed} | OK: ${d.succeeded} | Errores: ${d.failed} | Omitidos: ${d.skipped}`,
        d.hasMore ? `→ Hay más. Próximo offset: ${d.nextOffset}` : '✓ Lote completado.',
      ]);
      if (d.nextOffset) setBatchOffset(d.nextOffset);
      onRefresh && onRefresh();
    } catch (err) {
      setBatchLog(l => [...l, `Error: ${err.message}`]);
    } finally {
      setBatchRunning(false);
    }
  };

  const FILTERS = [
    { id: 'all', label: `Todas (${stats.total})` },
    { id: 'pending', label: `Pendientes (${stats.pending})` },
    { id: 'review', label: `Revisar (${stats.review})` },
    { id: 'generated', label: `Generadas (${stats.generated})` },
    { id: 'approved', label: `Aprobadas (${stats.approved})` },
    { id: 'error', label: `Error (${stats.error})` },
    { id: 'nokey', label: `Sin tono (${stats.noKey})` },
    { id: 'locked', label: `Bloqueadas (${stats.locked})` },
  ];

  return (
    <div className="space-y-6">
      <PreviewModal song={preview} onClose={() => setPreview(null)} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pendientes', value: stats.pending, color: 'text-yellow-400' },
          { label: 'Generadas', value: stats.generated + stats.approved, color: 'text-green-400' },
          { label: 'A revisar', value: stats.review, color: 'text-orange-400' },
          { label: 'Con error', value: stats.error, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-muted-foreground text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Batch controls */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-foreground font-semibold text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> Procesamiento por lotes
        </h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={runDryRun} disabled={batchRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 disabled:opacity-40">
            <Eye className="w-3.5 h-3.5" /> Dry Run
          </button>
          <button onClick={() => runBatch(false)} disabled={batchRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:opacity-90 disabled:opacity-40">
            {batchRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Procesar lote (pendientes)
          </button>
          <button onClick={() => runBatch(true)} disabled={batchRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 disabled:opacity-40">
            <RefreshCw className="w-3.5 h-3.5" /> Forzar lote (todo)
          </button>
          <button onClick={() => setBatchOffset(0)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80">
            <Pause className="w-3.5 h-3.5" /> Reset offset
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Offset actual: {batchOffset} | Lote: 20 canciones</p>

        {batchLog.length > 0 && (
          <div className="bg-background rounded-lg p-3 space-y-1">
            {batchLog.map((l, i) => (
              <p key={i} className="text-xs font-mono text-muted-foreground">{l}</p>
            ))}
          </div>
        )}

        {dryRunResult && (
          <div className="bg-background rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              Dry Run — {dryRunResult.totalEligible} elegibles, mostrando {dryRunResult.wouldProcess?.length}:
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {dryRunResult.wouldProcess?.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                  <span className="text-foreground truncate">{s.title}</span>
                  <span className="text-muted-foreground shrink-0">— {s.artist}</span>
                  {!s.hasKey && <span className="text-yellow-400 shrink-0">sin tono</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Song list */}
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border space-y-3">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar canción o artista..."
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary"
          />
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.id ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 max-h-[500px] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay canciones en este filtro.</p>
          ) : (
            filtered.map(song => (
              <SongSeoRow
                key={song.id}
                song={song}
                onGenerate={generateOne}
                onPreview={setPreview}
                onApprove={approveOne}
                onToggleLock={toggleLock}
                busy={busyIds.has(song.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}