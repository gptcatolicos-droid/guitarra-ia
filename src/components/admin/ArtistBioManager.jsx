import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, CheckCircle2, FilePenLine, Loader2, RefreshCw } from 'lucide-react';

export default function ArtistBioManager() {
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const result = await base44.functions.invoke('generateArtistBios', { action: 'status' });
    setStats(result.data);
  };

  useEffect(() => { load().catch(() => setMessage('No se pudo cargar el estado de las BIOs.')); }, []);

  const generate = async () => {
    setBusy(true); setMessage('');
    try {
      const result = await base44.functions.invoke('generateArtistBios', { action: 'generate', batchSize: 5 });
      const data = result.data;
      const created = (data.results || []).filter((item) => item.status === 'draft_created').length;
      setMessage(`${created} BIOs creadas como borrador. Revisa y publica las que apruebes.`);
      await load();
    } catch (error) {
      setMessage(error?.message || 'No se pudieron generar las BIOs.');
    } finally { setBusy(false); }
  };

  const publishRecent = async () => {
    const ids = (stats?.recent || []).filter((post) => !post.published).map((post) => post.id);
    if (!ids.length || !confirm(`¿Publicar ${ids.length} BIOs revisadas?`)) return;
    setBusy(true); setMessage('');
    try {
      const result = await base44.functions.invoke('generateArtistBios', { action: 'publish', postIds: ids });
      setMessage(`${result.data?.published || 0} BIOs publicadas. Ya estarán disponibles en Blog y Chat IA.`);
      await load();
    } catch (error) {
      setMessage(error?.message || 'No se pudieron publicar las BIOs.');
    } finally { setBusy(false); }
  };

  if (!stats) return <div className="flex justify-center py-5"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-foreground font-semibold"><BookOpen className="w-5 h-5 text-primary" /> Biblioteca BIO de artistas</h3>
          <p className="text-sm text-muted-foreground mt-1">Contenido editorial original para Blog y Chat IA. Las nuevas BIOs siempre quedan en borrador.</p>
        </div>
        <button onClick={() => load().catch(() => {})} className="p-2 text-muted-foreground hover:text-primary" title="Actualizar estado"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <Metric value={stats.totalArtists} label="Artistas" />
        <Metric value={stats.pending} label="Pendientes" />
        <Metric value={stats.drafts} label="Borradores" />
        <Metric value={stats.published} label="Publicadas" />
      </div>

      {message && <p className="text-sm rounded-lg px-3 py-2 bg-secondary text-foreground">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <button onClick={generate} disabled={busy || !stats.pending} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePenLine className="w-4 h-4" />}
          Generar próximos 5 borradores
        </button>
        <button onClick={publishRecent} disabled={busy || !stats.drafts} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground disabled:opacity-40">
          <CheckCircle2 className="w-4 h-4 text-primary" /> Publicar borradores recientes
        </button>
      </div>

      {stats.recent?.length > 0 && (
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {stats.recent.map((post) => (
            <div key={post.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
              <a href={`/blog/${post.slug}${post.published ? '' : '?preview=1'}`} target="_blank" rel="noreferrer" className="text-foreground font-medium hover:text-primary truncate">{post.title}</a>
              <span className={`text-xs shrink-0 ${post.published ? 'text-green-600' : 'text-amber-600'}`}>{post.published ? 'Publicada' : 'Borrador'}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Metric({ value, label }) {
  return <div className="rounded-lg bg-secondary/50 px-2 py-3"><p className="text-xl font-bold text-foreground">{value || 0}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}
