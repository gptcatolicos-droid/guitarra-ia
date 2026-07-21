import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import HeroSection from '@/components/home/HeroSection';
import TrendingSection from '@/components/home/TrendingSection';
import FeaturedSpotifySection from '@/components/home/FeaturedSpotifySection';

const LOGO_URL = 'https://media.base44.com/images/public/6a5e15eda090e739a1eebc94/e18c18520_logo.png';

export default function Home() {
  const navigate = useNavigate();
  const [topSongs, setTopSongs] = useState([]);

  useSEO({
    title: 'Guitarra IA - Acordes y tablaturas con inteligencia artificial | guitarraia.com',
    description: 'Busca acordes, tablaturas y cifrados de guitarra con inteligencia artificial. El mejor asistente musical para guitarristas en guitarraia.com.',
    image: LOGO_URL,
    canonical: 'https://www.guitarraia.com/',
  });

  const [heroSongs, setHeroSongs] = useState([]);

  useEffect(() => {
    // Load hero banner songs
    base44.entities.Song.filter({ is_hero: true }, '-created_date', 3)
      .then(setHeroSongs).catch(() => {});
    // Load trending songs
    base44.entities.Song.filter({ is_trending: true }, '-views', 10)
      .then(songs => {
        if (songs && songs.length > 0) setTopSongs(songs);
        else base44.entities.Song.list('-views', 10).then(setTopSongs).catch(() => {});
      })
      .catch(() => base44.entities.Song.list('-views', 10).then(setTopSongs).catch(() => {}));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onChatOpen={() => navigate('/chat')} heroSongs={heroSongs} />
      <div className="mx-6 lg:mx-8 border-t border-border mb-6" />
      <TrendingSection songs={topSongs} />
      <div className="mx-6 lg:mx-8 border-t border-border my-6" />
      <FeaturedSpotifySection songs={topSongs} />
      <div className="pb-8" />
    </div>
  );
}