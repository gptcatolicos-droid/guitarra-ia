import ChatInterface from '@/components/chat/ChatInterface';
import { useSEO } from '@/lib/seo';

const HERO_BG = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/2fe719569_foto.png';

export default function ChatPage() {
  useSEO({
    title: 'Chat IA — Guitarra IA | guitarraia.com',
    description: 'Pregunta a GuitarraIA sobre acordes, tablaturas, tonos, capos y canciones. Tu asistente musical inteligente.',
  });

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#0B0D0E' }}>
      {/* Hero header with background photo */}
      <div
        className="relative flex flex-col items-center justify-center text-center px-6 py-10 lg:py-14 overflow-hidden"
        style={{ borderBottom: '1px solid #272C2F', minHeight: '200px' }}
      >
        {/* Background photo */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${HERO_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 z-0" style={{ backgroundColor: 'rgba(11,13,14,0.80)' }} />

        {/* Content */}
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4"
            style={{ backgroundColor: 'rgba(255,114,0,0.18)', border: '1px solid rgba(255,114,0,0.4)', color: '#FF7200' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Asistente IA activo
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold mb-2" style={{ color: '#F4F4F2' }}>
            Tu profe de guitarra con <span style={{ color: '#FF7200' }}>inteligencia artificial</span>
          </h1>
          <p className="text-sm lg:text-base max-w-xl mx-auto" style={{ color: '#A7ACAE' }}>
            Pregunta por acordes, tablaturas, tonos, canciones o técnica. GuitarraIA te responde al instante.
          </p>
        </div>
      </div>

      {/* Chat interface fills remaining space */}
      <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
        <ChatInterface embedded />
      </div>
    </div>
  );
}