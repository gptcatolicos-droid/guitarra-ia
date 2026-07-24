import { useState } from 'react';
import { Globe, RefreshCw, ExternalLink, Copy, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

// Public function endpoint (reachable without auth, server-rendered XML).
const FN_BASE = 'https://api.base44.com/api/apps/6a5e15eda090e739a1eebc94/functions/sitemap';
const CANONICAL = 'https://www.guitarraia.com';

function analyzeXml(text) {
  const urlTags = (text.match(/<url>/g) || []).length;
  const locTags = (text.match(/<loc>[\s\S]*?<\/loc>/g) || []);
  const sitemapTags = (text.match(/<sitemap>/g) || []).length;
  const locs = locTags.map((l) => l.replace(/<\/?loc>/g, '').trim());
  const unique = new Set(locs);
  const duplicates = locs.length - unique.size;

  // Detection of the failure modes the audit must catch.
  const isSpaFallback = /<div id="root"|<!DOCTYPE html>|domain-not-connected/i.test(text);
  const hasXmlDecl = /^<\?xml/.test(text.trim());
  const hasUrlset = /<urlset|<sitemapindex/.test(text);
  const nonWww = /https?:\/\/guitarraia\.com/.test(text);
  const hasHttp = /http:\/\//.test(text);
  const hasAdmin = /\/admin(<|\/|")/.test(text);
  const hasBase44 = /base44\.app|\.base44\.com\/api/.test(text.replace(FN_BASE, ''));

  const firstUrl = locs[0] || null;
  const lastUrl = locs[locs.length - 1] || null;

  const valid = hasXmlDecl && hasUrlset && !isSpaFallback;

  return {
    urlTags, locCount: locs.length, sitemapTags, uniqueCount: unique.size, duplicates,
    firstUrl, lastUrl, valid, isSpaFallback, hasXmlDecl, hasUrlset,
    nonWww, hasHttp, hasAdmin, hasBase44,
  };
}

async function auditUrl(url) {
  const start = performance.now();
  const res = await fetch(url, { headers: { 'Accept': 'application/xml' } });
  const text = await res.text();
  const ms = Math.round(performance.now() - start);
  const bytes = new Blob([text]).size;
  return {
    httpStatus: res.status,
    contentType: res.headers.get('content-type') || '(sin cabecera)',
    bytes, ms, text,
    ...analyzeXml(text),
  };
}

function StatusPill({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{label}
    </span>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-[#272C2F] last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-foreground text-right break-all ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

const SUB_SITEMAPS = [
  { key: 'index', label: 'Índice principal', url: `${FN_BASE}`, publicUrl: `${CANONICAL}/sitemap.xml` },
  { key: 'pages', label: 'Páginas', url: `${FN_BASE}?type=pages`, publicUrl: `${CANONICAL}/sitemap.xml?type=pages` },
  { key: 'artists', label: 'Artistas', url: `${FN_BASE}?type=artists`, publicUrl: `${CANONICAL}/sitemap.xml?type=artists` },
  { key: 'songs', label: 'Canciones', url: `${FN_BASE}?type=songs`, publicUrl: `${CANONICAL}/sitemap.xml?type=songs` },
  { key: 'blog', label: 'Blog + Infografías', url: `${FN_BASE}?type=blog`, publicUrl: `${CANONICAL}/sitemap.xml?type=blog` },
];

export default function SitemapPanel() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [copied, setCopied] = useState('');

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  const runAudit = async () => {
    setLoading(true);
    const out = {};
    for (const sm of SUB_SITEMAPS) {
      try {
        out[sm.key] = await auditUrl(sm.url);
      } catch (e) {
        out[sm.key] = { error: e.message };
      }
    }
    // Googlebot comparison — same URL, spoofed UA (best-effort; browser may strip UA header).
    try {
      const res = await fetch(SUB_SITEMAPS[0].url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      });
      const text = await res.text();
      out.googlebot = { httpStatus: res.status, text, identical: text === out.index?.text };
    } catch (e) {
      out.googlebot = { error: e.message };
    }
    setResults(out);
    setLoading(false);
  };

  const index = results.index;

  return (
    <div className="space-y-4">
      {/* Platform routing warning */}
      <div className="rounded-xl p-4 flex gap-3" style={{ backgroundColor: 'rgba(227,168,59,0.08)', border: '1px solid rgba(227,168,59,0.35)' }}>
        <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#E3A83B' }} />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Enrutamiento de dominio.</strong> Esta auditoría consulta la función backend directamente.
          Para que Google la use, la ruta pública <code className="text-primary">{CANONICAL}/sitemap.xml</code> debe apuntar a esta función.
          Si sigue devolviendo un XML estático de 12 URLs, es enrutamiento del hosting — contacta a soporte de Base44.
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="text-foreground font-semibold text-sm">Auditoría del XML público real</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          No cuenta registros de la base de datos: descarga la respuesta HTTP real de cada sitemap y analiza su contenido.
        </p>
        <button
          onClick={runAudit}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#FF7200' }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Auditando respuestas HTTP...' : 'Ejecutar auditoría'}
        </button>
      </div>

      {/* Main index audit result */}
      {index && !index.error && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-foreground font-semibold text-sm">Índice principal — resultado</h3>
            <div className="flex gap-1.5 flex-wrap">
              <StatusPill ok={index.httpStatus === 200} label={`HTTP ${index.httpStatus}`} />
              <StatusPill ok={index.valid} label={index.valid ? 'XML válido' : 'XML inválido'} />
              <StatusPill ok={!index.isSpaFallback} label={index.isSpaFallback ? 'Fallback SPA/HTML' : 'No es HTML'} />
              <StatusPill ok={!index.nonWww} label={index.nonWww ? 'Mezcla no-www' : 'Solo www'} />
              <StatusPill ok={!index.hasAdmin} label={index.hasAdmin ? 'Incluye /admin' : 'Sin /admin'} />
              <StatusPill ok={!index.hasBase44} label={index.hasBase44 ? 'URLs Base44' : 'Sin URLs Base44'} />
            </div>
          </div>
          <div>
            <Row label="Código HTTP" value={index.httpStatus} />
            <Row label="Content-Type" value={index.contentType} mono />
            <Row label="Peso del XML" value={`${(index.bytes / 1024).toFixed(1)} KB (${index.bytes} bytes)`} />
            <Row label="Tiempo respuesta" value={`${index.ms} ms`} />
            <Row label="Etiquetas <sitemap>" value={index.sitemapTags} />
            <Row label="Etiquetas <url>" value={index.urlTags} />
            <Row label="Etiquetas <loc>" value={index.locCount} />
            <Row label="URLs únicas" value={index.uniqueCount} />
            <Row label="Duplicados" value={index.duplicates} />
            <Row label="Generado" value={new Date().toLocaleString('es-CO')} />
            <Row label="Primera URL" value={index.firstUrl || '—'} mono />
            <Row label="Última URL" value={index.lastUrl || '—'} mono />
            <Row label="Validación XML" value={index.valid ? '✓ Válido' : '✗ Inválido'} />
            {results.googlebot && !results.googlebot.error && (
              <Row label="Googlebot idéntico" value={results.googlebot.identical ? '✓ Sí' : '✗ No'} />
            )}
          </div>
        </div>
      )}

      {index?.error && (
        <div className="bg-red-500/10 text-red-400 text-xs rounded-lg p-3">Error auditando el índice: {index.error}</div>
      )}

      {/* Sub-sitemaps table */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-foreground font-semibold text-sm mb-3">Sub-sitemaps</h3>
        <div className="space-y-2">
          {SUB_SITEMAPS.map((sm) => {
            const r = results[sm.key];
            return (
              <div key={sm.key} className="p-3 rounded-lg" style={{ backgroundColor: '#121516', border: '1px solid #272C2F' }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{sm.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{sm.publicUrl}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {r && !r.error && (
                      <>
                        <span className="text-[11px] text-muted-foreground">{sm.key === 'index' ? `${r.sitemapTags} sitemaps` : `${r.locCount} URLs`}</span>
                        <StatusPill ok={r.httpStatus === 200} label={`${r.httpStatus}`} />
                        <StatusPill ok={r.valid} label={r.valid ? 'OK' : 'ERR'} />
                      </>
                    )}
                    {r?.error && <span className="text-[11px] text-red-400">Error</span>}
                    <a href={sm.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Abrir">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => copy(sm.publicUrl)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Copiar">
                      {copied === sm.publicUrl ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Robots + GSC */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-foreground font-semibold text-sm mb-3">robots.txt y Google Search Console</h3>
        <div className="space-y-2">
          {[
            { label: 'robots.txt (función)', url: `${FN_BASE}?robots=1` },
            { label: 'Sitemap público', url: `${CANONICAL}/sitemap.xml` },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: '#121516', border: '1px solid #272C2F' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.url}</p>
              </div>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button onClick={() => copy(item.url)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                {copied === item.url ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
          <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 mt-1 rounded-lg text-sm font-medium transition-colors w-fit" style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F', color: '#A7ACAE' }}>
            <ExternalLink className="w-4 h-4" /> Google Search Console
          </a>
        </div>
      </div>
    </div>
  );
}