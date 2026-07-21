import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import HeroSection from '@/components/home/HeroSection';
import TrendingSection from '@/components/home/TrendingSection';
import FeaturedSpotifySection from '@/components/home/FeaturedSpotifySection';

const LOGO_URL = 'https://media.base44.com/images/public/user_6a5e0a31e8f4f614e1d6f533/ad91dd453_logo.png';

export default function Home() {
  const navigate = useNavigate();
  const [topSongs, setTopSongs] = useState([]);

  useSEO({
    title: 'Tablaturas AI - Acordes y tablaturas con inteligencia artificial',
    description: 'Busca acordes, tablaturas y cifrados de tus canciones favoritas con inteligencia artificial.',
    image: LOGO_URL,
    canonical: '/',
  });

  useEffect(() => {
    // First try manually-curated trending songs, fallback to most viewed
    base44.entities.Song.filter({ is_trending: true }, '-views', 10)
      .then(songs => {
        if (songs && songs.length > 0) setTopSongs(songs);
        else base44.entities.Song.list('-views', 10).then(setTopSongs).catch(() => {});
      })
      .catch(() => base44.entities.Song.list('-views', 10).then(setTopSongs).catch(() => {}));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onChatOpen={() => navigate('/chat')} />
      <div className="mx-6 lg:mx-8 border-t border-border mb-6" />
      <TrendingSection songs={topSongs} />
      <div className="mx-6 lg:mx-8 border-t border-border my-6" />
      <FeaturedSpotifySection songs={topSongs} />
      <div className="pb-8" />
    </div>
  );
}