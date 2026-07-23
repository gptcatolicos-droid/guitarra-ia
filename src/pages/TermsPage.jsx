import { useSEO } from '@/lib/seo';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  useSEO({ title: 'Términos y Condiciones | GuitarraIA', canonical: '/terminos' });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-8">
        <ArrowLeft className="w-4 h-4" /> Volver al inicio
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2">Términos y Condiciones de Uso</h1>
      <p className="text-muted-foreground text-sm mb-8">Última actualización: julio de 2026 · GuitarraIA — guitarraia.com</p>

      <div className="space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Aceptación de los términos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Al acceder y utilizar GuitarraIA (guitarraia.com), aceptas estar legalmente vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, te pedimos que no uses nuestro servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Descripción del servicio</h2>
          <p className="text-muted-foreground leading-relaxed">
            GuitarraIA es una plataforma educativa que proporciona acordes, cifrados y tablaturas de canciones con fines de aprendizaje musical. Utilizamos inteligencia artificial para ayudar a los músicos a encontrar y aprender canciones en guitarra. El servicio incluye un asistente de IA, biblioteca de acordes, reproductor integrado de Spotify y contenido generado automáticamente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Derechos de autor y propiedad intelectual</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Todo el contenido musical disponible en GuitarraIA — incluyendo letras, melodías, grabaciones y composiciones — es propiedad exclusiva de sus respectivos artistas, compositores y titulares de derechos. GuitarraIA <strong>no reclama ningún derecho</strong> sobre ninguna composición musical.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Los acordes, cifrados y tablaturas presentados en este sitio son representaciones abstractas con fines exclusivamente didácticos y de aprendizaje personal. No reproducimos grabaciones de audio propias ni distribuimos archivos protegidos.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            GuitarraIA se limita a utilizar los recursos disponibles a través de APIs públicas y oficiales (como la API de Spotify) de conformidad con sus términos de servicio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Player de Spotify y API de terceros</h2>
          <p className="text-muted-foreground leading-relaxed mb-3">
            El reproductor de música integrado en GuitarraIA es <strong>propiedad de Spotify AB</strong>. Las vistas previas de audio y el reproductor embebido son proporcionados por Spotify a través de su API oficial (Spotify Web API y Spotify Embed). GuitarraIA no tiene control sobre el contenido reproducido ni sobre la disponibilidad de las canciones en dicha plataforma.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            El uso del player de Spotify está sujeto a los <a href="https://www.spotify.com/legal/end-user-agreement/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">Términos de Servicio de Spotify</a> y a su <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">Política de Privacidad</a>. Spotify y su logo son marcas registradas de Spotify AB.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Uso permitido</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
            <li>Aprender a tocar canciones en guitarra para uso personal y no comercial.</li>
            <li>Consultar acordes y tablaturas con fines educativos.</li>
            <li>Utilizar el asistente de IA GuitarraIA para orientación musical.</li>
            <li>Compartir contenido del sitio citando la fuente (guitarraia.com).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Uso prohibido</h2>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
            <li>Reproducir, distribuir o comercializar el contenido del sitio sin autorización.</li>
            <li>Utilizar el servicio para actividades que infrinjan leyes de propiedad intelectual.</li>
            <li>Intentar acceder sin autorización a partes restringidas de la plataforma.</li>
            <li>Usar robots, scrapers o herramientas automatizadas para extraer contenido masivo.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Exactitud del contenido</h2>
          <p className="text-muted-foreground leading-relaxed">
            El contenido generado por IA puede contener errores. GuitarraIA no garantiza la exactitud de acordes o tablaturas. Siempre recomendamos verificar el contenido con fuentes oficiales o un maestro de música.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Limitación de responsabilidad</h2>
          <p className="text-muted-foreground leading-relaxed">
            GuitarraIA se proporciona "tal cual". No somos responsables de daños directos o indirectos derivados del uso del servicio. Nos reservamos el derecho de modificar o discontinuar el servicio en cualquier momento sin previo aviso.
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
            Si tienes preguntas sobre estos términos o deseas reportar una infracción de derechos de autor, contáctanos a través del chat de la plataforma en guitarraia.com.
          </p>
        </section>
      </div>
    </div>
  );
}