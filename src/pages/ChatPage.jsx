import ChatInterface from '@/components/chat/ChatInterface';
import { useSEO } from '@/lib/seo';

export default function ChatPage() {
  useSEO({
    title: 'Asistente IA — Guitarra IA | guitarraia.com',
    description: 'Pregunta a GuitarraIA sobre acordes, tablaturas, tonos, capos y canciones. Tu asistente musical inteligente.',
  });

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)', backgroundColor: '#0B0D0E' }}>
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid #272C2F', backgroundColor: '#0E1112' }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,114,0,0.15)' }}>
          <span className="text-sm">🎸</span>
        </div>
        <div>
          <h1 className="text-sm font-bold" style={{ color: '#F4F4F2' }}>GuitarraIA</h1>
          <p className="text-xs" style={{ color: '#747B7F' }}>Asistente musical con IA</p>
        </div>
      </div>
      <ChatInterface embedded />
    </div>
  );
}