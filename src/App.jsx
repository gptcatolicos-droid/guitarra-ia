import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import AppLayout from '@/components/layout/AppLayout';
import AdminRoute from '@/components/AdminRoute';
import Home from '@/pages/Home';
import ArtistPage from '@/pages/ArtistPage';
import SongPage from '@/pages/SongPage';
import SearchPage from '@/pages/SearchPage';

import AdminPage from '@/pages/AdminPage';
import ChatPage from '@/pages/ChatPage';
import TermsPage from '@/pages/TermsPage';
import AcordesPage from '@/pages/AcordesPage';
import ChordDetailPage from '@/pages/ChordDetailPage';
import TopArtistsPage from '@/pages/TopArtistsPage';
import TopSongsPage from '@/pages/TopSongsPage';
import GuitarStorePage from '@/pages/GuitarStorePage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import AboutPage from '@/pages/AboutPage';
import InfographicsPage from '@/pages/InfographicsPage';
import InfographicPage from '@/pages/InfographicPage';
import TunerPage from '@/pages/TunerPage';
import UnpluggedPage from '@/pages/UnpluggedPage';
import PracticePage from '@/pages/PracticePage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/buscar" element={<SearchPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/afinador" element={<TunerPage />} />
        <Route path="/unplugged" element={<UnpluggedPage />} />
        <Route path="/practicar" element={<PracticePage />} />

        <Route path="/terminos" element={<TermsPage />} />
        <Route path="/acordes" element={<AcordesPage />} />
        <Route path="/acordes/:chord" element={<ChordDetailPage />} />
        <Route path="/artistas" element={<TopArtistsPage />} />
        <Route path="/canciones" element={<TopSongsPage />} />
        <Route path="/tienda" element={<GuitarStorePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/acerca" element={<AboutPage />} />
        <Route path="/infografias" element={<InfographicsPage />} />
        <Route path="/infografias/:slug" element={<InfographicPage />} />
        <Route path="/:artistSlug" element={<ArtistPage />} />
        <Route path="/:artistSlug/:songSlug" element={<SongPage />} />
        <Route path="/:artistSlug/:songSlug/practicar" element={<SongPage />} />
        <Route path="/:artistSlug/:songSlug/:view" element={<SongPage />} />
      </Route>
      {/* Admin routes — require an authenticated platform admin */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App

