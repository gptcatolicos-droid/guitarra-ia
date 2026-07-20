import ChatInterface from '@/components/chat/ChatInterface';
import { useSEO } from '@/lib/seo';

export default function Home() {
  useSEO({
    title: 'Tablaturas AI - Acordes y tablaturas con inteligencia artificial',
    description:
      'Busca acordes, tablaturas y cifrados de tus canciones favoritas con inteligencia artificial. Asistente musical para guitarristas.',
    image: 'https://media.base44.com/images/public/user_6a5e0a31e8f4f614e1d6f533/ad91dd453_logo.png',
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

  return <ChatInterface />;
}