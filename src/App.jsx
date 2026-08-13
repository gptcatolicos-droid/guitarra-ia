import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';

const PageNotFound = lazy(() => import('./lib/PageNotFound'));
const AdminRoute = lazy(() => import('@/components/AdminRoute'));
const ArtistPage = lazy(() => import('@/pages/ArtistPage'));
const SongPage = lazy(() => import('@/pages/SongPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AdminLoginPage = lazy(() => import('@/pages/AdminLoginPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const AcordesPage = lazy(() => import('@/pages/AcordesPage'));
const ChordDetailPage = lazy(() => import('@/pages/ChordDetailPage'));
const TopArtistsPage = lazy(() => import('@/pages/TopArtistsPage'));
const TopSongsPage = lazy(() => import('@/pages/TopSongsPage'));
const GuitarStorePage = lazy(() => import('@/pages/GuitarStorePage'));
const BlogPage = lazy(() => import('@/pages/BlogPage'));
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const InfographicsPage = lazy(() => import('@/pages/InfographicsPage'));
const InfographicPage = lazy(() => import('@/pages/InfographicPage'));
const TunerPage = lazy(() => import('@/pages/TunerPage'));
const UnpluggedPage = lazy(() => import('@/pages/UnpluggedPage'));
const PracticePage = lazy(() => import('@/pages/PracticePage'));

const PRIVATE_ADMIN_PATH = '/supercalifragilisticoespialidoso';
const PRIVATE_LOGIN_PATH = '/supercalifragilisticoespialidoso/acceso';

function RouteFallback() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center" aria-label="Cargando contenido">
      <div className="h-7 w-7 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
    </div>
  );
}

const deferred = (Component) => (
  <Suspense fallback={<RouteFallback />}>
    <Component />
  </Suspense>
);

function PublicRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/buscar" element={deferred(SearchPage)} />
        <Route path="/chat" element={deferred(ChatPage)} />
        <Route path="/afinador" element={deferred(TunerPage)} />
        <Route path="/unplugged" element={deferred(UnpluggedPage)} />
        <Route path="/practicar" element={deferred(PracticePage)} />
        <Route path="/terminos" element={deferred(TermsPage)} />
        <Route path="/acordes" element={deferred(AcordesPage)} />
        <Route path="/acordes/:chord" element={deferred(ChordDetailPage)} />
        <Route path="/artistas" element={deferred(TopArtistsPage)} />
        <Route path="/canciones" element={deferred(TopSongsPage)} />
        <Route path="/tienda" element={deferred(GuitarStorePage)} />
        <Route path="/blog" element={deferred(BlogPage)} />
        <Route path="/blog/:slug" element={deferred(BlogPostPage)} />
        <Route path="/acerca" element={deferred(AboutPage)} />
        <Route path="/infografias" element={deferred(InfographicsPage)} />
        <Route path="/infografias/:slug" element={deferred(InfographicPage)} />
        <Route path="/:artistSlug" element={deferred(ArtistPage)} />
        <Route path="/:artistSlug/:songSlug" element={deferred(SongPage)} />
        <Route path="/:artistSlug/:songSlug/practicar" element={deferred(SongPage)} />
        <Route path="/:artistSlug/:songSlug/:view" element={deferred(SongPage)} />
      </Route>

      <Route path={PRIVATE_LOGIN_PATH} element={deferred(AdminLoginPage)} />

      <Route element={deferred(AdminRoute)}>
        <Route path="/admin" element={deferred(AdminPage)} />
        <Route path={PRIVATE_ADMIN_PATH} element={deferred(AdminPage)} />
      </Route>

      <Route path="*" element={deferred(PageNotFound)} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <PublicRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
