import { Link } from 'react-router-dom';

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/e18c18520_logo.png';

const cols = [
  {
    title: 'Contenido',
    links: [
      { label: 'Canciones', path: '/canciones' },
      { label: 'Artistas', path: '/artistas' },
      { label: 'Acordes', path: '/acordes' },
      { label: 'Blog', path: '/blog' },
    ],
  },
  {
    title: 'Herramientas',
    links: [
      { label: 'Asistente IA', path: '/chat' },
      { label: 'Guitar Store', path: '/tienda' },
      { label: 'Buscar', path: '/buscar' },
    ],
  },
  {
    title: 'Sitio',
    links: [
      { label: 'Términos', path: '/terminos' },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#0E1112', borderTop: '1px solid #272C2F' }}>
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <img src={LOGO_URL} alt="Guitarra IA" style={{ height: '28px', width: 'auto', marginBottom: '12px' }} />
            <p className="text-sm leading-relaxed" style={{ color: '#747B7F' }}>
              La plataforma de acordes, tablaturas y IA para guitarristas hispanohablantes.
            </p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#555B5E' }}>{col.title}</p>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l.path}>
                    <Link
                      to={l.path}
                      className="text-sm transition-colors"
                      style={{ color: '#A7ACAE' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#FF7200'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#A7ACAE'; }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: '1px solid #272C2F' }}
        >
          <p className="text-xs" style={{ color: '#555B5E' }}>
            © {new Date().getFullYear()} GuitarraIA · guitarraia.com
          </p>
          <p className="text-xs" style={{ color: '#555B5E' }}>
            Hecho con ♪ para guitarristas hispanohablantes
          </p>
        </div>
      </div>
    </footer>
  );
}