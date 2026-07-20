import { useRef, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import ChatInterface from '@/components/chat/ChatInterface';
import HeroSection from '@/components/home/HeroSection';
import TrendingSection from '@/components/home/TrendingSection';
import ArtistsSection from '@/components/home/ArtistsSection';

const LOGO_URL = 'https://media.base44.com/images/public/user_6a5e0a31e8f4f614e1d6f533/ad91dd453_logo.png';

export default function Home() {
  const chatRef = useRef(null);
  const [topSongs, setTopSongs] = useState([]);
  const [topArtists, setTopArtists] = useState([]);

  useSEO({
    title: 'Tablaturas AI - Acordes y tablaturas con inteligencia artificial',
    description: 'Busca acordes, tablaturas y cifrados de tus canciones favoritas con inteligencia artificial.',
    image: LOGO_URL,
    canonical: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Tablaturas AI',
      description: 'Asistente conversacional especializado en canciones, acordes, cifrados y tablaturas.',
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Web',
      inLanguage: 'es',
    },
  });

  useEffect(() => {
    base44.entities.Song.list('-views', 10).then(setTopSongs).catch(() => {});
    base44.entities.Artist.list('-created_date', 6).then(setTopArtists).catch(() => {});
  }, []);

  const scrollToChat = () => {
    if (chatRef.current) {
      chatRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <HeroSection onChatFocus={scrollToChat} />

      {/* Divider */}
      <div className="mx-6 lg:mx-8 border-t border-border mb-6" />

      {/* Trending */}
      <TrendingSection songs={topSongs} />

      <div className="mx-6 lg:mx-8 my-6 border-t border-border" />

      {/* Artists */}
      <ArtistsSection artists={topArtists} />

      <div className="mx-6 lg:mx-8 my-6 border-t border-border" />

      {/* Chat IA section */}
      <div ref={chatRef} className="px-6 lg:px-8 pb-4">
        <div className="mb-5">
          <h2 className="text-foreground font-bold text-lg">Pregúntale a la IA</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Tu asistente musical. Pregunta lo que necesites.</p>
        </div>
      </div>

      <div className="flex flex-col" style={{ minHeight: '500px' }}>
        <ChatInterface embedded />
      </div>
    </div>
  );
}