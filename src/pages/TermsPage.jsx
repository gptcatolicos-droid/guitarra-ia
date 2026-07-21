import { useSEO } from '@/lib/seo';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  useSEO({ title: 'Términos y Condiciones | Tablaturas AI', canonical: '/terminos' });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-8">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">Términos y Condiciones de Uso</h1>
      <p className="text-muted-foreground text-sm mb-8">Última actualización: julio de 2026</p>

      <div className="space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Aceptación de los términos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Al acceder y utilizar Tablaturas AI, aceptas estar legalmente vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, te pedimos que no uses nuestro servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Descripción del servicio</h2>
          <p className="text-muted-foreground leading-relaxed">
            Tablaturas AI es una plataforma educativa que proporciona acordes, cifrados y tablaturas de canciones con fines de aprendizaje musical. Utilizamos inteligencia artificial para ayudar a los músicos a encontrar y aprender canciones en guitarra.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Uso educativo y derechos de autor</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Todo el contenido de Tablaturas AI está destinado exclusivamente a uso educativo y de aprendizaje personal. Los acordes, cifrados y tablaturas son representaciones abstractas con fines didácticos.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Tablaturas AI no almacena ni distribuye grabaciones de audio protegidas por derechos de autor. Las vistas previas de audio son proporcionadas por Spotify a través de su API oficial. No reclamamos derechos sobre ninguna composición musical.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Uso permitido</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
            <li>Aprender a tocar canciones en guitarra para uso personal.</li>
            <li>Consultar acordes y tablaturas con fines educativos.</li>
            <li>Utilizar el asistente de IA para orientación musical.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Uso prohibido</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
            <li>Reproducir, distribuir o comercializar el contenido del sitio sin autorización.</li>
            <li>Utilizar el servicio para actividades que infrinjan leyes de propiedad intelectual.</li>
            <li>Intentar acceder sin autorización a partes restringidas de la plataforma.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Exactitud del contenido</h2>
          <p className="text-muted-foreground leading-relaxed">
            El contenido generado por IA puede contener errores. Tablaturas AI no garantiza la exactitud de acordes o tablaturas. Siempre recomendamos verificar el contenido con fuentes oficiales o un maestro de música.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Servicio de terceros</h2>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos la API de Spotify para proporcionar vistas previas de audio. El uso de dichas vistas previas está sujeto a los <a href="https://www.spotify.com/legal/end-user-agreement/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">Términos de Servicio de Spotify</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Limitación de responsabilidad</h2>
          <p className="text-muted-foreground leading-relaxed">
            Tablaturas AI se proporciona "tal cual". No somos responsables de daños directos o indirectos derivados del uso del servicio. Nos reservamos el derecho de modificar o discontinuar el servicio en cualquier momento.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Cambios a los términos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Podemos actualizar estos términos en cualquier momento. Los cambios entran en vigencia al publicarse en esta página. El uso continuado del servicio implica la aceptación de los términos actualizados.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Si tienes preguntas sobre estos términos, contáctanos a través del chat de la plataforma.
          </p>
        </section>
      </div>
    </div>
  );
}