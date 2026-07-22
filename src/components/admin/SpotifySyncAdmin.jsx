import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Music, RefreshCw, Play, Pause, CheckCircle, AlertCircle, XCircle, Clock, ExternalLink, Lock, Unlock } from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    matched: { label: 'Encontrada', color: '#59B879', bg: 'rgba(89,184,121,0.15)' },
    review_required: { label: 'Revisar', color: '#D8A62A', bg: 'rgba(216,166,42,0.15)' },
    not_found: { label: 'No encontrada', color: '#747B7F', bg: 'rgba(116,123,127,0.15)' },
    error: { label: 'Error', color: '#E06464', bg: 'rgba(224,100,100,0.15)' },
    pending: { label: 'Pendiente', color: '#4F9ED8', bg: 'rgba(79,158,216,0.15)' },
    processing: { label: 'Procesando', color: '#FF7200', bg: 'rgba(255,114,0,0.15)' },
    disabled: { label: 'Desactivada', color: '#555B5E', bg: 'rgba(85,91,94,0.15)' },
  };
  const s = map[status] || map.pending;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function ReviewCard({ song, onApprove, onDiscard, onManualSearch }) {
  const score = song.spotify_match_score;
  const scoreColor = score >= 0.9 ? '#59B879' : score >= 0.75 ? '#D8A62A' : '#E06464';

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold" style={{ color: '#F4F4F2' }}>{song.title}</p>
          <p className="text-xs" style={{ color: '#747B7F' }}>{song.artist_name}</p>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}>
          {Math.round((score || 0) * 100)}%
        </span>
      </div>

      {song.spotify_track_id && (
        <>
          <div className="text-xs space-y-1" style={{ color: '#A7ACAE' }}>
            <p><span style={{ color: '#747B7F' }}>Propuesta:</span> {song.spotify_track_name}</p>
            <p><span style={{ color: '#747B7F' }}>Artista:</span> {song.spotify_artist_name}</p>
            <p><span style={{ color: '#747B7F' }}>Álbum:</span> {song.spotify_album_name}</p>
            {song.spotify_duration_ms && (
              <p><span style={{ color: '#747B7F' }}>Duración:</span> {Math.floor(song.spotify_duration_ms / 60000)}:{String(Math.floor((song.spotify_duration_ms % 60000) / 1000)).padStart(2, '0')}</p>
            )}
          </div>
          <iframe
            src={`https://open.spotify.com/embed/track/${song.spotify_track_id}?utm_source=generator`}
            width="100%" height="80" frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy" style={{ borderRadius: '8px' }}
          />
        </>
      )}

      <div className="flex gap-2">
        <button onClick={() => onApprove(song)}
          className="flex-1 py-1.5 text-xs font-bold rounded-lg text-white transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#59B879' }}>
          ✓ Aceptar
        </button>
        <button onClick={() => onManualSearch(song)}
          className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#272C2F', color: '#A7ACAE' }}>
          Buscar manual
        </button>
        <button onClick={() => onDiscard(song)}
          className="py-1.5 px-3 text-xs font-bold rounded-lg transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(224,100,100,0.15)', color: '#E06464' }}>
          ✗
        </button>
      </div>
    </div>
  );
}

function ManualSearchModal({ song, onSelect, onClose }) {
  const [query, setQuery] = useState(`${song.title} ${song.artist_name}`);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('spotifySearch', {
        title: query,
        artist: '',
      });
      if (res?.data?.track_id) {
        setResults([res.data]);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        style={{ backgroundColor: '#181B1D', border: '1px solid #303538' }}>
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid #272C2F' }}>
          <p className="font-bold text-sm" style={{ color: '#F4F4F2' }}>Búsqueda manual en Spotify</p>
          <button onClick={onClose} className="text-xs" style={{ color: '#747B7F' }}>Cerrar</button>
        </div>
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Buscar en Spotify..."
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: '#121516', border: '1px solid #303538', color: '#F4F4F2' }}
            />
            <button onClick={search} disabled={loading}
              className="px-4 py-2 text-sm font-bold rounded-lg text-white"
              style={{ backgroundColor: '#FF7200' }}>
              {loading ? '...' : 'Buscar'}
            </button>
          </div>
          {results.map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: '#121516', border: '1px solid #272C2F' }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#F4F4F2' }}>{r.track_name || r.title}</p>
                <p className="text-xs" style={{ color: '#747B7F' }}>{r.artist_name || r.artist}</p>
              </div>
              <button onClick={() => onSelect(r, song)}
                className="px-3 py-1 text-xs font-bold rounded-lg text-white"
                style={{ backgroundColor: '#1DB954' }}>
                Seleccionar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SpotifySyncAdmin({ allSongs }) {
  const [stats, setStats] = useState(null);
  const [job, setJob] = useState(null);
  const [reviewSongs, setReviewSongs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [syncing, setSyncing] = useState(false);
  const [manualSearchSong, setManualSearchSong] = useState(null);
  const [singleSongId, setSingleSongId] = useState('');

  const computeStats = (songs) => {
    const total = songs.length;
    const matched = songs.filter(s => s.spotify_match_status === 'matched').length;
    const pending = songs.filter(s => !s.spotify_match_status || s.spotify_match_status === 'pending').length;
    const review = songs.filter(s => s.spotify_match_status === 'review_required').length;
    const notFound = songs.filter(s => s.spotify_match_status === 'not_found').length;
    const errors = songs.filter(s => s.spotify_match_status === 'error').length;
    return { total, matched, pending, review, notFound, errors };
  };

  useEffect(() => {
    if (allSongs?.length) {
      setStats(computeStats(allSongs));
      setReviewSongs(allSongs.filter(s => s.spotify_match_status === 'review_required'));
    }
  }, [allSongs]);

  const runBatch = async (existingJobId) => {
    setSyncing(true);
    try {
      const payload = existingJobId
        ? { jobId: existingJobId, batchSize: 20, action: 'resume' }
        : { batchSize: 20 };
      const res = await base44.functions.invoke('syncSpotifyCatalogBatch', payload);
      setJob(res.data);
    } catch (e) {
      console.error(e);
    }
    setSyncing(false);
  };

  const pauseJob = async () => {
    if (!job?.jobId) return;
    await base44.functions.invoke('syncSpotifyCatalogBatch', { jobId: job.jobId, action: 'pause' });
    setJob(prev => ({ ...prev, status: 'paused' }));
  };

  const syncSingle = async () => {
    if (!singleSongId.trim()) return;
    setSyncing(true);
    await base44.functions.invoke('syncSpotifyForSong', { songId: singleSongId.trim() });
    setSyncing(false);
    setSingleSongId('');
  };

  const approveSong = async (song) => {
    await base44.entities.Song.update(song.id, {
      spotify_match_status: 'matched',
      spotify_manual_lock: true,
      spotify_match_method: 'manual',
    });
    setReviewSongs(prev => prev.filter(s => s.id !== song.id));
  };

  const discardSong = async (song) => {
    await base44.entities.Song.update(song.id, {
      spotify_match_status: 'not_found',
      spotify_track_id: null,
      spotify_embed: null,
      spotify_embed_url: null,
    });
    setReviewSongs(prev => prev.filter(s => s.id !== song.id));
  };

  const handleManualSelect = async (result, song) => {
    await base44.entities.Song.update(song.id, {
      spotify_track_id: result.track_id,
      spotify_embed: `https://open.spotify.com/embed/track/${result.track_id}?utm_source=generator`,
      spotify_embed_url: `https://open.spotify.com/embed/track/${result.track_id}?utm_source=generator`,
      spotify_match_status: 'matched',
      spotify_match_method: 'manual',
      spotify_manual_lock: true,
    });
    setReviewSongs(prev => prev.filter(s => s.id !== song.id));
    setManualSearchSong(null);
  };

  const pct = stats ? Math.round((stats.matched / Math.max(stats.total, 1)) * 100) : 0;

  return (
    <div className="space-y-6">
      {manualSearchSong && (
        <ManualSearchModal
          song={manualSearchSong}
          onSelect={handleManualSelect}
          onClose={() => setManualSearchSong(null)}
        />
      )}

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Total canciones', value: stats.total, color: '#A7ACAE' },
            { label: 'Con Spotify', value: stats.matched, color: '#1DB954' },
            { label: 'Pendientes', value: stats.pending, color: '#4F9ED8' },
            { label: 'Para revisar', value: stats.review, color: '#D8A62A' },
            { label: 'No encontradas', value: stats.notFound, color: '#747B7F' },
            { label: 'Errores', value: stats.errors, color: '#E06464' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4"
              style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: '#747B7F' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {stats && (
        <div className="rounded-xl p-4" style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold" style={{ color: '#F4F4F2' }}>Progreso del catálogo</p>
            <p className="text-sm font-bold" style={{ color: '#1DB954' }}>{pct}%</p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#272C2F' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: '#1DB954' }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: '#747B7F' }}>
            {stats.matched} de {stats.total} canciones enlazadas a Spotify
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}>
        <p className="text-sm font-semibold mb-2" style={{ color: '#F4F4F2' }}>Acciones de sincronización</p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => runBatch(null)}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg text-white disabled:opacity-40"
            style={{ backgroundColor: '#1DB954' }}>
            <Play className="w-4 h-4" />
            {syncing ? 'Procesando...' : 'Procesar siguiente lote'}
          </button>

          {job?.jobId && (
            <>
              <button onClick={() => runBatch(job.jobId)} disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg disabled:opacity-40"
                style={{ backgroundColor: '#272C2F', color: '#A7ACAE' }}>
                <RefreshCw className="w-4 h-4" />
                Reanudar
              </button>
              <button onClick={pauseJob} disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg disabled:opacity-40"
                style={{ backgroundColor: '#272C2F', color: '#D8A62A' }}>
                <Pause className="w-4 h-4" />
                Pausar
              </button>
            </>
          )}
        </div>

        {/* Job status */}
        {job && (
          <div className="text-xs rounded-lg p-3 space-y-1"
            style={{ backgroundColor: '#121516', border: '1px solid #272C2F' }}>
            <p style={{ color: '#A7ACAE' }}>Último lote: procesadas {job.processed}, encontradas {job.results?.matched || 0}, revisar {job.results?.review_required || 0}, no encontradas {job.results?.not_found || 0}</p>
          </div>
        )}

        {/* Sync single song */}
        <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid #272C2F' }}>
          <input
            value={singleSongId}
            onChange={e => setSingleSongId(e.target.value)}
            placeholder="ID de canción para sincronizar..."
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: '#121516', border: '1px solid #303538', color: '#F4F4F2' }}
          />
          <button onClick={syncSingle} disabled={syncing || !singleSongId.trim()}
            className="px-4 py-2 text-sm font-bold rounded-lg text-white disabled:opacity-40"
            style={{ backgroundColor: '#FF7200' }}>
            Sincronizar
          </button>
        </div>
      </div>

      {/* Review queue */}
      {reviewSongs.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: '#F4F4F2' }}>
            Coincidencias para revisar ({reviewSongs.length})
          </p>
          {reviewSongs.map(song => (
            <ReviewCard
              key={song.id}
              song={song}
              onApprove={approveSong}
              onDiscard={discardSong}
              onManualSearch={setManualSearchSong}
            />
          ))}
        </div>
      )}
    </div>
  );
}