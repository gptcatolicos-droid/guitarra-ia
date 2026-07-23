import { useSEO } from '@/lib/seo';
import { Mail, Instagram, ExternalLink, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  useSEO({
    title: 'Contacto | GuitarraIA',
    description: 'Contáctanos para sugerencias, colaboraciones o reportar errores en GuitarraIA.',
    canonical: '/contacto',
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0D0E' }}>
      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-16">

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: '#F4F4F2', fontFamily: 'var(--font-heading)' }}>
            Contacto
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: '#A7ACAE' }}>
            ¿Tienes una sugerencia, encontraste un error o quieres colaborar? Escríbenos.
          </p>
        </div>

        {/* Contact options */}
        <div className="space-y-4">

          <a href="mailto:hola@guitarraia.com"
            className="flex items-center gap-4 rounded-2xl p-5 transition-colors group"
            style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,114,0,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#272C2F'}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(255,114,0,0.1)' }}>
              <Mail className="w-6 h-6" style={{ color: '#FF7200' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm mb-0.5" style={{ color: '#F4F4F2' }}>Correo electrónico</p>
              <p className="text-sm" style={{ color: '#A7ACAE' }}>hola@guitarraia.com</p>
              <p className="text-xs mt-0.5" style={{ color: '#747B7F' }}>Respondemos en 24–48 horas</p>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0 group-hover:text-orange-400 transition-colors" style={{ color: '#555B5E' }} />
          </a>

          <a href="https://www.instagram.com/guitarraia" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl p-5 transition-colors group"
            style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,114,0,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#272C2F'}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(225,48,108,0.1)' }}>
              <Instagram className="w-6 h-6" style={{ color: '#E1306C' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm mb-0.5" style={{ color: '#F4F4F2' }}>Instagram</p>
              <p className="text-sm" style={{ color: '#A7ACAE' }}>@guitarraia</p>
              <p className="text-xs mt-0.5" style={{ color: '#747B7F' }}>Síguenos para novedades y contenido de guitarra</p>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0 group-hover:text-orange-400 transition-colors" style={{ color: '#555B5E' }} />
          </a>

          <a href="https://paypal.me/schoolmarketing" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl p-5 transition-colors group"
            style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,114,0,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#272C2F'}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl">
              💙
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm mb-0.5" style={{ color: '#F4F4F2' }}>Apoyar el proyecto</p>
              <p className="text-sm" style={{ color: '#A7ACAE' }}>paypal.me/schoolmarketing</p>
              <p className="text-xs mt-0.5" style={{ color: '#747B7F' }}>Con 1 USD ayudas a mantener el sitio activo</p>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0 group-hover:text-orange-400 transition-colors" style={{ color: '#555B5E' }} />
          </a>

          <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl p-5 transition-colors group"
            style={{ backgroundColor: '#181B1D', border: '1px solid #272C2F' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,114,0,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#272C2F'}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(37,211,102,0.1)' }}>
              <MessageCircle className="w-6 h-6" style={{ color: '#25D366' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm mb-0.5" style={{ color: '#F4F4F2' }}>WhatsApp</p>
              <p className="text-sm" style={{ color: '#A7ACAE' }}>Contáctanos por WhatsApp</p>
              <p className="text-xs mt-0.5" style={{ color: '#747B7F' }}>Para consultas rápidas y reportes</p>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0 group-hover:text-orange-400 transition-colors" style={{ color: '#555B5E' }} />
          </a>
        </div>

        <p className="text-center text-xs mt-10" style={{ color: '#555B5E' }}>
          GuitarraIA · guitarraia.com · Hecho con ♪ para guitarristas hispanohablantes
        </p>
      </div>
    </div>
  );
}