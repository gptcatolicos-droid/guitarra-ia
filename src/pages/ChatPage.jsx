import { useSEO } from '@/lib/seo';
import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  useSEO({
    title: 'Chat IA - Busca Tablaturas y Acordes | Tablaturas AI',
    description: 'Busca acordes y tablaturas de cualquier canción usando inteligencia artificial.',
    canonical: '/chat',
  });

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      <ChatInterface embedded />
    </div>
  );
}