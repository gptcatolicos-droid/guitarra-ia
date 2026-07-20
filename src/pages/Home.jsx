import ChatInterface from '@/components/chat/ChatInterface';
import { useSEO } from '@/lib/seo';

const LOGO_URL = 'https://media.base44.com/images/public/user_6a5e0a31e8f4f614e1d6f533/ad91dd453_logo.png';

export default function Home() {
  useSEO({
    title: 'Tablaturas AI - Acordes y tablaturas con inteligencia artificial',
    description:
      'Busca acordes, tablaturas y cifrados de tus canciones favoritas con inteligencia artificial. Asistente musical para guitarristas.',
    image: LOGO_URL,
    canonical: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Tablaturas AI',
      description:
        'Buscador y asistente conversacional especializado en canciones, artistas, acordes, cifrados y tablaturas.',
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Web',
      inLanguage: 'es',
    },
  });

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden">
      <div className="flex flex-col items-center pt-6 pb-2 shrink-0">
        <img src={LOGO_URL} alt="Tablaturas AI" style={{ width: '100%', maxWidth: '564px', aspectRatio: '1127/410' }} className="w-auto" />
      </div>
      <ChatInterface embedded />
    </div>
  );
}