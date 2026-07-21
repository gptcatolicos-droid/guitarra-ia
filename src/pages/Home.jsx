import { useRef, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import { Sparkles } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import HeroSection from '@/components/home/HeroSection';
import TrendingSection from '@/components/home/TrendingSection';

const LOGO_URL = 'https://media.base44.com/images/public/user_6a5e0a31e8f4f614e1d6f533/ad91dd453_logo.png';

export default function Home() {
  const chatRef = useRef(null);
  const [topSongs, setTopSongs] = useState([]);

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

      <div className="mx-6 lg:mx-8 border-t border-border mb-6" />

      {/* Trending */}
      <TrendingSection songs={topSongs} />

      <div className="mx-6 lg:mx-8 my-6 border-t border-border" />

      {/* Chat IA — hero section */}
      <div ref={chatRef} className="px-6 lg:px-8 pb-4">
        <div className="rounded-2xl overflow-hidden border-2 border-orange-400/40 shadow-lg shadow-orange-500/10"
          style={{ background: 'linear-gradient(135deg, #fff7f0 0%, #fff0fa 100%)' }}
        >
          {/* Header destacado */}
          <div className="px-6 pt-6 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-xl leading-tight">
                Busca Tablaturas y Acordes de canciones con la IA
              </h2>
              <p className="text-muted-foreground text-sm mt-0.5">
                Escribe el nombre de cualquier canción o artista y encuentra los acordes al instante.
              </p>
            </div>
          </div>
          <div className="flex flex-col" style={{ minHeight: '500px' }}>
            <ChatInterface embedded />
          </div>
        </div>
      </div>

      <div className="pb-8" />
    </div>
  );
}