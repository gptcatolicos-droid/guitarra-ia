import { useSEO } from '@/lib/seo';
import { Guitar, Sparkles, Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  useSEO({
    title: 'Acerca de GuitarraIA | Acordes y Tablaturas con Inteligencia Artificial',
    description: 'Conoce GuitarraIA, la plataforma de acordes, tablaturas e inteligencia artificial para guitarristas hispanohablantes.',
    canonical: '/acerca',
  });

  return (
    <div className="min-h-screen bg-g-page">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 py-16">

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ backgroundColor: '#FED7AA', color: '#EA580C', border: '1px solid rgba(249,115,22,0.3)' }}>
            <Sparkles className="w-3.5 h-3.5" /> Nuestra historia
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#1F2937', fontFamily: 'var(--font-heading)' }}>
            Acerca de <span style={{ color: '#F97316' }}>GuitarraIA</span>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: '#6B7280' }}>
            La plataforma de acordes, tablaturas e inteligencia artificial para guitarristas que hablan español.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-base leading-relaxed" style={{ color: '#6B7280' }}>

          <section className="rounded-2xl p-6 bg-white shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
            <div className="flex items-center gap-2 mb-4">
              <Guitar className="w-5 h-5" style={{ color: '#F97316' }} />
              <h2 className="text-lg font-bold" style={{ color: '#1F2937' }}>¿Qué es GuitarraIA?</h2>
            </div>
            <p className="mb-3">
              GuitarraIA es una plataforma web gratuita diseñada para ayudarte a aprender, practicar y disfrutar la guitarra.
              Aquí encuentras miles de canciones con sus acordes y tablaturas, organizadas por artista, dificultad e idioma,
              todo en español.
            </p>
            <p className="mb-3">
              A diferencia de otros sitios, integramos <strong style={{ color: '#F97316' }}>inteligencia artificial</strong> directamente
              en la experiencia: nuestro asistente GuitarraIA puede responderte preguntas sobre técnica, sugerirte canciones
              según tu nivel, explicarte teoría musical y ayudarte a encontrar la versión correcta de cualquier tema.
            </p>
            <p>
              Además incluimos el player de Spotify embebido para que puedas escuchar la canción original mientras practicas,
              diagramas visuales de acordes interactivos, transposición de tonalidad en tiempo real, y mucho más.
            </p>
          </section>

          <section className="rounded-2xl p-6 bg-white shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5" style={{ color: '#F97316' }} />
              <h2 className="text-lg font-bold" style={{ color: '#1F2937' }}>¿Para quién es?</h2>
            </div>
            <p className="mb-3">
              GuitarraIA está pensada para guitarristas de todos los niveles que prefieren contenido en español.
              Si eres principiante y estás aprendiendo tus primeros acordes, aquí encontrarás canciones fáciles con
              diagramas visuales y consejos claros. Si ya tienes experiencia, el catálogo de tablaturas y el asistente
              IA te ayudarán a ir más lejos.
            </p>
            <p>
              Somos especialmente útiles para guitarristas de Colombia, México, España, Argentina y el resto de
              Latinoamérica, donde el contenido de calidad en español sobre guitarra escasea.
            </p>
          </section>

          <section className="rounded-2xl p-6 bg-white shadow-sm" style={{ border: '1px solid #E5E7EB' }}>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5" style={{ color: '#F97316' }} />
              <h2 className="text-lg font-bold" style={{ color: '#1F2937' }}>¿Quién lo construye?</h2>
            </div>
            <p className="mb-3">
              GuitarraIA es un proyecto independiente construido por un <strong style={{ color: '#1F2937' }}>Emprendedor Digital experto en IA</strong>,
              apasionado por la música y la tecnología. La plataforma nació de la frustración
              de no encontrar un sitio moderno, en español, con buena tecnología y sin anuncios invasivos para aprender guitarra.
            </p>
            <p>
              El proyecto es completamente independiente y sin financiación externa. Si te resulta útil,
              puedes apoyarnos con una pequeña donación para mantener los servidores funcionando y seguir
              añadiendo contenido nuevo cada semana.
            </p>
          </section>

          {/* CTA */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Link to="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)' }}>
              <Sparkles className="w-4 h-4" /> Probar el asistente IA
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}