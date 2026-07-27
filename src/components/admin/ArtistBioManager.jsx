import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, EyeOff, Loader2, Trash2 } from 'lucide-react';

const BIO_PREFIX = 'biografia-de-';

async function loadArtistBios() {
  const posts = [];
  const pageSize = 500;
  for (let page = 0; page < 10; page += 1) {
    const batch = await base44.entities.BlogPost.list('-created_date', pageSize, page * pageSize);
    posts.push(...(batch || []));
    if (!batch || batch.length < pageSize) break;
  }
  return posts.filter((post) => post.slug?.startsWith(BIO_PREFIX));
}

// This component intentionally keeps only the safe removal controls for the
// discontinued artist BIO experiment. It does not generate, publish or edit
// new artist biographies.
export default function ArtistBioManager() {
  const [bios, setBios] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const rows = await loadArtistBios();
    setBios(rows);
  };

  useEffect(() => {
    load().catch(() => setMessage('No se pudieron cargar las BIO anteriores.'));
  }, []);

  const hideAll = async () => {
    const published = (bios || []).filter((post) => post.published);
    if (!published.length) {
      setMessage('No hay BIOs públicas para ocultar.');
      return;
    }
    if (!confirm(`¿Ocultar ${published.length} BIOs de artistas del Blog y del Chat IA? Se conservarán como borradores.`)) return;
    setBusy(true); setMessage('');
    try {
      await Promise.all(published.map((post) => base44.entities.BlogPost.update(post.id, { published: false })));
      setMessage(`${published.length} BIOs quedaron ocultas. Ninguna canción ni artista fue modificada.`);
      await load();
    } catch (error) {
      setMessage(error?.message || 'No se pudieron ocultar las BIOs.');
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    const count = bios?.length || 0;
    if (!count) {
      setMessage('No hay BIOs de artistas para eliminar.');
      return;
    }
    if (!confirm(`¿Eliminar definitivamente ${count} BIOs de artistas? Esta acción no se puede deshacer y no afecta canciones, artistas ni otros artículos.`)) return;
    setBusy(true); setMessage('');
    try {
      await Promise.all(bios.map((post) => base44.entities.BlogPost.delete(post.id)));
      setMessage(`${count} BIOs fueron eliminadas definitivamente.`);
      setBios([]);
    } catch (error) {
      setMessage(error?.message || 'No se pudieron eliminar todas las BIOs.');
      await load().catch(() => {});
    } finally {
      setBusy(false);
    }
  };

  if (!bios) return <div className="flex justify-center py-5"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  const published = bios.filter((post) => post.published).length;

  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-amber-500" />
        <div>
          <h3 className="text-foreground font-semibold">BIOs de artistas retiradas</h3>
          <p className="text-sm text-muted-foreground mt-1">Esta función ya no crea ni muestra BIOs. Desde aquí puedes ocultar o borrar únicamente las BIOs anteriores.</p>
        </div>
      </div>

      <div className="rounded-lg bg-secondary/50 px-3 py-3 text-sm text-foreground">
        Hay <strong>{bios.length}</strong> BIOs anteriores: <strong>{published}</strong> públicas y <strong>{bios.length - published}</strong> ya ocultas.
      </div>

      {message && <p className="text-sm rounded-lg px-3 py-2 bg-secondary text-foreground">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <button onClick={hideAll} disabled={busy || !published} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground disabled:opacity-40">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
          Ocultar del sitio
        </button>
        <button onClick={deleteAll} disabled={busy || !bios.length} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-40">
          <Trash2 className="w-4 h-4" /> Eliminar definitivamente
        </button>
      </div>
    </section>
  );
}
