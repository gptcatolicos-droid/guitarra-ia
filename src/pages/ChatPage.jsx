import ChatInterface from '@/components/chat/ChatInterface';
import { useSEO } from '@/lib/seo';

const HERO_BG = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/2fe719569_foto.png';

export default function ChatPage() {
  useSEO({
    title: 'Chat IA — Guitarra IA | guitarraia.com',
    description: 'Pregunta a GuitarraIA sobre acordes, tablaturas, tonos, capos y canciones. Tu asistente musical inteligente.',
  });

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)', backgroundColor: '#0B0D0E', overflow: 'hidden' }}>
      <ChatInterface embedded heroMode />
    </div>
  );
}