import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { RefreshCw, CheckCircle, AlertCircle, Music, Users, FileText, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const [syncState, setSyncState] = useState(null);
  const [stats, setStats] = useState({ songs: 0, artists: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useSEO({ title: 'Admin - Sincronización | Tablaturas AI' });

  const loadData = async () => {
    try {
      const [syncStates, songs, artists] = await Promise.all([
        base44.entities.SyncState.list(),
        base44.entities.Song.list('-created_date', 1),
        base44.entities.Artist.list('-created_date', 1),
      ]);
      setSyncState(syncStates[0] || null);
      // Get counts via a larger list
      const [allSongs, allArtists] = await Promise.all([
        base44.entities.Song.list('-created_date', 5000),
        base44.entities.Artist.list('-created_date', 5000),
      ]);
      setStats({ songs: allSongs.length, artists: allArtists.length });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const response = await base44.functions.invoke('syncDrive', {});
      setSyncResult(response.data);
      await loadData();
    } catch (e) {
      setSyncResult({ error: e.message });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-[#2b3138] border-t-[#ff7a00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Panel de Administración</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#20242a] border border-[#2b3138] rounded-xl p-5">
          <Music className="w-6 h-6 text-[#ff7a00] mb-2" />
          <p className="text-3xl font-bold text-white">{stats.songs}</p>
          <p className="text-[#a7afb8] text-sm mt-1">Canciones</p>
        </div>
        <div className="bg-[#20242a] border border-[#2b3138] rounded-xl p-5">
          <Users className="w-6 h-6 text-[#ff7a00] mb-2" />
          <p className="text-3xl font-bold text-white">{stats.artists}</p>
          <p className="text-[#a7afb8] text-sm mt-1">Artistas</p>
        </div>
        <div className="bg-[#20242a] border border-[#2b3138] rounded-xl p-5 col-span-2 lg:col-span-1">
          <FileText className="w-6 h-6 text-[#ff7a00] mb-2" />
          <p className="text-3xl font-bold text-white">{syncState?.processed_files || 0}</p>
          <p className="text-[#a7afb8] text-sm mt-1">Archivos procesados</p>
        </div>
      </div>

      {/* Sync card */}
      <div className="bg-[#20242a] border border-[#2b3138] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold">Sincronización con Google Drive</h2>
            <p className="text-[#a7afb8] text-sm mt-0.5">
              Carpeta: <span className="font-mono text-xs">1VlFY-cSfhxqcAhDtiBBW8nsZkXcnl9z1</span>
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff7a00] text-white rounded-xl hover:bg-[#e66e00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
          </button>
        </div>

        {syncState && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-[#a7afb8]">Estado</p>
              <p className={`font-medium capitalize mt-0.5 ${
                syncState.status === 'completed' ? 'text-green-400' :
                syncState.status === 'error' ? 'text-red-400' :
                syncState.status === 'running' ? 'text-yellow-400' :
                'text-[#a7afb8]'
              }`}>
                {syncState.status === 'completed' ? '✓ Completado' :
                 syncState.status === 'error' ? '✗ Error' :
                 syncState.status === 'running' ? '⟳ Ejecutando' : 'Inactivo'}
              </p>
            </div>
            <div>
              <p className="text-[#a7afb8]">Archivos procesados</p>
              <p className="text-white font-medium mt-0.5">{syncState.processed_files || 0}</p>
            </div>
            <div>
              <p className="text-[#a7afb8]">Con errores</p>
              <p className="text-white font-medium mt-0.5">{syncState.error_files || 0}</p>
            </div>
            <div>
              <p className="text-[#a7afb8]">Última sync</p>
              <p className="text-white font-medium mt-0.5 text-xs">
                {syncState.last_synced_at
                  ? new Date(syncState.last_synced_at).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
                  : 'Nunca'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sync result */}
      {syncResult && (
        <div className={`border rounded-xl p-5 ${
          syncResult.error
            ? 'bg-red-950/20 border-red-900'
            : 'bg-green-950/20 border-green-900'
        }`}>
          {syncResult.error ? (
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold">Error en la sincronización</p>
                <p className="text-red-300 text-sm mt-1">{syncResult.error}</p>
                <p className="text-[#a7afb8] text-xs mt-2">
                  Si el error menciona "drive", asegúrate de que el conector de Google Drive tenga el scope <code className="text-[#ff7a00]">drive.readonly</code>. Reconecta desde el menú de conectores del dashboard.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-green-400 font-semibold">Sincronización completada</p>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-[#a7afb8] text-xs">Artistas</p>
                    <p className="text-white font-bold text-lg">{syncResult.artists_found}</p>
                  </div>
                  <div>
                    <p className="text-[#a7afb8] text-xs">Canciones</p>
                    <p className="text-white font-bold text-lg">{syncResult.songs_created}</p>
                  </div>
                  <div>
                    <p className="text-[#a7afb8] text-xs">Errores</p>
                    <p className="text-white font-bold text-lg">{syncResult.files_with_errors}</p>
                  </div>
                </div>
                {syncResult.errors && syncResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[#a7afb8] text-xs font-semibold mb-1">Archivos con error:</p>
                    {syncResult.errors.map((e, i) => (
                      <p key={i} className="text-red-300 text-xs">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notice about scope */}
      <div className="mt-6 bg-yellow-950/20 border border-yellow-800 rounded-xl p-4">
        <p className="text-yellow-400 text-sm font-semibold mb-1">⚠ Nota sobre el conector de Google Drive</p>
        <p className="text-yellow-200 text-sm leading-relaxed">
          Para que la sincronización funcione, el conector de Google Drive necesita el scope{' '}
          <code className="bg-yellow-900/40 px-1 rounded">drive.readonly</code>.
          Si el último intento de conexión solo otorgó <code className="bg-yellow-900/40 px-1 rounded">email</code>,
          ve al dashboard → Conectores → Google Drive → Reconectar y asegúrate de marcar el permiso de lectura de Drive.
        </p>
      </div>
    </div>
  );
}