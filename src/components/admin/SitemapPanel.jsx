import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, RefreshCw, ExternalLink, Copy, CheckCircle } from 'lucide-react';

const SITEMAP_FUNCTION_URL = 'https://api.base44.com/api/apps/6a5e15eda090e739a1eebc94/functions/sitemap';

export default function SitemapPanel({ allSongs }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('sitemap', {});
      // Count URLs from the XML
      const urlCount = (res.data?.match(/<url>/g) || []).length;
      setResult({ urlCount, generated: new Date().toLocaleString('es-CO') });
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const seoCount = allSongs?.filter(s => ['generated', 'approved', 'published'].includes(s.seo_status)).length || 0;
  const totalSongs = allSongs?.length || 0;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold text-foreground">{totalSongs}</p>
          <p className="text-xs text-muted-foreground mt-1">Canciones en sitemap</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold" style={{ color: '#59B879' }}>{seoCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Con SEO generado</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-2xl font-bold" style={{ color: '#FF7200' }}>
            {totalSongs > 0 ? Math.round((seoCount / totalSongs) * 100) : 0}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Cobertura SEO</p>
        </div>
      </div>

      {/* Sitemap info */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-foreground font-semibold text-sm">Sitemap XML dinámico</h3>
        </div>

        <p className="text-xs text-muted-foreground">
          El sitemap se genera en tiempo real desde la base de datos. Incluye todas las canciones publicadas, artistas y posts del blog. Las prioridades se calculan automáticamente según popularidad (vistas, trending).
        </p>

        {/* URLs */}
        <div className="space-y-2">
          {[
            { label: 'Sitemap XML', url: 'https://www.guitarraia.com/sitemap.xml', note: 'Redirige a la función backend' },
            { label: 'robots.txt', url: 'https://www.guitarraia.com/robots.txt', note: 'Apunta al sitemap' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: '#121516', border: '1px solid #272C2F' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                {item.note && <p className="text-[10px] mt-0.5" style={{ color: '#555B5E' }}>{item.note}</p>}
              </div>
              <button onClick={() => copy(item.url)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>

        {/* Test button */}
        <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid #272C2F' }}>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#FF7200' }}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? 'Generando...' : 'Probar generación'}
          </button>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F', color: '#A7ACAE' }}
          >
            <ExternalLink className="w-4 h-4" />
            Google Search Console
          </a>
        </div>

        {result && (
          <div className={`text-xs rounded-lg p-3 ${result.error ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            {result.error
              ? `Error: ${result.error}`
              : `✓ Sitemap generado con ${result.urlCount} URLs · ${result.generated}`
            }
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-foreground font-semibold text-sm mb-3">Cómo indexar con Google</h3>
        <ol className="space-y-2 text-xs text-muted-foreground">
          <li className="flex gap-2"><span className="text-primary font-bold shrink-0">1.</span>Entra a <strong className="text-foreground">Google Search Console</strong> con el dominio guitarraia.com</li>
          <li className="flex gap-2"><span className="text-primary font-bold shrink-0">2.</span>Ve a <strong className="text-foreground">Sitemaps</strong> en el menú lateral</li>
          <li className="flex gap-2"><span className="text-primary font-bold shrink-0">3.</span>Agrega <code className="text-primary">https://www.guitarraia.com/sitemap.xml</code></li>
          <li className="flex gap-2"><span className="text-primary font-bold shrink-0">4.</span>Google rastreará todas las canciones automáticamente</li>
        </ol>
      </div>
    </div>
  );
}