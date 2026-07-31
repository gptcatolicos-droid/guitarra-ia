import { useState } from 'react';
import { useSEO } from '@/lib/seo';
import { Link } from 'react-router-dom';
import { ArrowLeft, Globe2, ShieldCheck } from 'lucide-react';

const UPDATED_AT = '31 de julio de 2026';

const spanishSections = [
  {
    title: '1. Aceptación y alcance',
    body: [
      'Al acceder, navegar o utilizar GuitarraIA, disponible en guitarraia.com, aceptas estos Términos y Condiciones. Si no estás de acuerdo con ellos, debes abstenerte de utilizar la plataforma.',
      'Estos términos regulan únicamente el uso de GuitarraIA. Los contenidos y servicios proporcionados por Spotify, YouTube, YouTube Music u otras plataformas de terceros se rigen además por sus propios términos, políticas y condiciones.'
    ]
  },
  {
    title: '2. Naturaleza del servicio',
    body: [
      'GuitarraIA es una plataforma educativa y gratuita orientada al aprendizaje musical y a la práctica de guitarra. Proporciona herramientas como búsqueda asistida por inteligencia artificial, acordes, cifrados, diagramas, tablaturas, afinación, contenidos editoriales y experiencias de práctica sincronizada.',
      'GuitarraIA no es una disquera, editora musical, distribuidora de música, servicio de streaming ni representante de artistas. Tampoco vende, licencia o comercializa grabaciones musicales, composiciones o catálogos de terceros.'
    ]
  },
  {
    title: '3. Titularidad de canciones y material musical',
    body: [
      'Todas las canciones, composiciones, letras, melodías, arreglos, fonogramas, videos musicales, portadas, nombres artísticos, marcas y demás material musical pertenecen a sus respectivos artistas, autores, compositores, productores, editoras, disqueras, sociedades de gestión y demás titulares de derechos.',
      'La aparición de una canción, artista, portada, video, reproductor o enlace en GuitarraIA no implica afiliación, patrocinio, autorización comercial, cesión de derechos ni respaldo por parte del artista, la disquera, la editora o la plataforma de streaming correspondiente.',
      'GuitarraIA no reclama titularidad sobre canciones, grabaciones, videos, letras o marcas de terceros.'
    ]
  },
  {
    title: '4. Uso de Spotify, YouTube y otras plataformas',
    body: [
      'Cuando una canción incluye un reproductor de Spotify o YouTube, GuitarraIA utiliza únicamente mecanismos de integración, enlaces, APIs o embeds que la plataforma correspondiente pone a disposición de desarrolladores y sitios web, sujetos a sus reglas técnicas y contractuales.',
      'La reproducción ocurre dentro de la infraestructura y del reproductor oficial del tercero. GuitarraIA no modifica, elimina ni oculta los controles, marcas, publicidad, atribuciones, restricciones territoriales, disponibilidad, políticas de reproducción o mecanismos de monetización definidos por dichas plataformas.',
      'Las reproducciones, impresiones, anuncios, suscripciones, métricas, regalías, ingresos y demás efectos económicos derivados del uso de esos reproductores corresponden a Spotify, YouTube, los titulares de derechos y demás participantes del ecosistema, conforme a sus contratos y políticas. GuitarraIA no recibe ni administra regalías generadas por la reproducción dentro de esos players oficiales.',
      'La disponibilidad de una canción puede cambiar o desaparecer por decisión de la plataforma, del titular de derechos o por restricciones geográficas, técnicas o contractuales.'
    ]
  },
  {
    title: '5. No almacenamiento ni distribución de canciones',
    body: [
      'GuitarraIA no aloja, almacena, distribuye, descarga, retransmite ni pone a disposición archivos completos de audio o video de canciones comerciales.',
      'Los contenidos audiovisuales reproducidos mediante embeds son servidos directamente por la plataforma externa correspondiente. GuitarraIA no permite descargar, extraer o eludir las protecciones, anuncios, controles o restricciones de esos servicios.'
    ]
  },
  {
    title: '6. Acordes, tablaturas y contenido educativo',
    body: [
      'Los acordes, cifrados, tablaturas, diagramas y explicaciones se presentan con fines de enseñanza, estudio, análisis y práctica personal. Pueden provenir de aportes editoriales, procesamiento automatizado, inteligencia artificial o interpretación musical.',
      'La finalidad educativa o gratuita no significa que todo uso esté automáticamente exento de las leyes de derecho de autor. Ciertos arreglos, transcripciones, letras, tablaturas u otros materiales pueden estar protegidos. GuitarraIA procura limitar su uso a lo necesario para la experiencia educativa y atenderá solicitudes válidas de titulares de derechos.',
      'No se garantiza que los acordes, tiempos, tonalidades, figuras o tablaturas sean exactos, oficiales o idénticos a una edición autorizada.'
    ]
  },
  {
    title: '7. Inteligencia artificial y exactitud',
    body: [
      'Las funciones de inteligencia artificial pueden producir resultados incompletos, inexactos o desactualizados. Los usuarios deben verificar la información antes de utilizarla en presentaciones, grabaciones, publicaciones, clases, actividades comerciales o cualquier contexto donde la precisión sea esencial.',
      'GuitarraIA no sustituye una partitura oficial, una edición licenciada, un profesor, un productor, un abogado o una fuente autorizada por el titular de los derechos.'
    ]
  },
  {
    title: '8. Uso permitido',
    list: [
      'Consultar y practicar acordes, diagramas y tablaturas para aprendizaje personal.',
      'Usar el asistente de IA y las herramientas educativas de forma lícita y razonable.',
      'Reproducir contenidos mediante los players oficiales y conforme a sus condiciones.',
      'Compartir enlaces a páginas de GuitarraIA sin atribuirse la autoría del material de terceros.'
    ]
  },
  {
    title: '9. Uso prohibido',
    list: [
      'Descargar, copiar, capturar, extraer o redistribuir audio o video desde los reproductores integrados.',
      'Eliminar o interferir con publicidad, atribuciones, marcas, controles o sistemas de monetización de terceros.',
      'Utilizar GuitarraIA para infringir derechos de autor, marcas, derechos de imagen, privacidad u otros derechos.',
      'Comercializar, republicar masivamente o crear una base de datos sustitutiva a partir del contenido de la plataforma sin autorización.',
      'Realizar scraping masivo, acceso automatizado abusivo, ingeniería inversa, ataques, evasión de controles o acceso no autorizado.',
      'Presentar como oficial, autorizado o exacto un contenido generado o mostrado por GuitarraIA cuando no lo sea.'
    ]
  },
  {
    title: '10. Reclamaciones de copyright y retiro de contenido',
    body: [
      'Los titulares de derechos o sus representantes pueden solicitar la revisión, corrección, bloqueo o retiro de un contenido que consideren infractor.',
      'La solicitud debe identificar al reclamante, la obra protegida, la URL exacta dentro de GuitarraIA, la naturaleza del derecho reclamado, una declaración de buena fe y un medio de contacto verificable. Puede enviarse mediante el canal de contacto o el chat disponible en guitarraia.com.',
      'GuitarraIA podrá retirar o limitar preventivamente el acceso mientras estudia una reclamación y podrá solicitar documentación adicional que acredite la representación o titularidad. También podrá rechazar reclamaciones manifiestamente incompletas, abusivas o fraudulentas.'
    ]
  },
  {
    title: '11. Marcas y servicios de terceros',
    body: [
      'Spotify, YouTube, YouTube Music y sus respectivos logotipos y marcas pertenecen a sus titulares. Su presencia responde a la identificación de los servicios integrados y no supone asociación societaria con GuitarraIA.',
      'El usuario acepta que su interacción con servicios externos puede implicar el tratamiento de datos, cookies, publicidad o autenticación por parte de dichos terceros, conforme a sus propias políticas.'
    ]
  },
  {
    title: '12. Gratuidad, donaciones y monetización propia',
    body: [
      'El acceso general a GuitarraIA se ofrece gratuitamente como servicio educativo. La plataforma puede aceptar donaciones, incorporar publicidad propia, enlaces de afiliados o servicios adicionales, siempre que ello no implique apropiarse de la monetización perteneciente a los reproductores o contenidos de terceros.',
      'Una donación o pago por un servicio adicional no concede al usuario derechos sobre canciones, grabaciones, videos, letras, transcripciones o marcas de terceros.'
    ]
  },
  {
    title: '13. Limitación de responsabilidad',
    body: [
      'GuitarraIA se ofrece “tal cual” y según disponibilidad. No garantiza continuidad, ausencia de errores, disponibilidad permanente de canciones, compatibilidad con todos los dispositivos ni exactitud absoluta del contenido educativo.',
      'En la máxima medida permitida por la ley aplicable, GuitarraIA no será responsable por decisiones de plataformas externas, eliminación de contenidos, restricciones regionales, interrupciones, pérdidas indirectas, reclamaciones derivadas del uso indebido del usuario o infracciones cometidas por terceros.'
    ]
  },
  {
    title: '14. Modificaciones y terminación',
    body: [
      'GuitarraIA puede modificar, suspender o retirar funciones, integraciones o contenidos cuando sea necesario para cumplir la ley, proteger derechos de terceros, atender cambios técnicos o respetar las políticas de Spotify, YouTube u otros proveedores.',
      'Estos términos pueden actualizarse. La fecha de última actualización se publicará en esta página y el uso continuado de la plataforma implicará aceptación de la versión vigente.'
    ]
  },
  {
    title: '15. Legislación aplicable y contacto',
    body: [
      'Estos términos se interpretarán conforme a la legislación aplicable al operador de GuitarraIA, sin perjuicio de los derechos imperativos que correspondan a los consumidores en su jurisdicción.',
      'Para consultas legales, reclamaciones de copyright o solicitudes relacionadas con estos términos, utiliza el canal de contacto disponible en guitarraia.com e incluye la información suficiente para identificar tu solicitud.'
    ]
  }
];

const englishSections = [
  {
    title: '1. Acceptance and scope',
    body: [
      'By accessing, browsing, or using GuitarraIA at guitarraia.com, you agree to these Terms and Conditions. If you do not agree, you must not use the platform.',
      'These terms govern only the use of GuitarraIA. Content and services supplied by Spotify, YouTube, YouTube Music, or other third parties are also governed by their own terms, policies, and conditions.'
    ]
  },
  {
    title: '2. Nature of the service',
    body: [
      'GuitarraIA is a free educational platform focused on music learning and guitar practice. It provides AI-assisted search, chords, chord sheets, diagrams, tablatures, tuning tools, editorial content, and synchronized practice experiences.',
      'GuitarraIA is not a record label, music publisher, music distributor, streaming service, or representative of any artist. It does not sell, license, or commercially distribute third-party recordings, compositions, or catalogs.'
    ]
  },
  {
    title: '3. Ownership of songs and musical material',
    body: [
      'All songs, compositions, lyrics, melodies, arrangements, sound recordings, music videos, artwork, artist names, trademarks, and other musical material belong to their respective artists, authors, composers, producers, publishers, record labels, collecting societies, and other rights holders.',
      'The appearance of a song, artist, cover image, video, player, or link on GuitarraIA does not imply affiliation, sponsorship, commercial authorization, transfer of rights, or endorsement by the relevant artist, label, publisher, or streaming platform.',
      'GuitarraIA claims no ownership over third-party songs, recordings, videos, lyrics, or trademarks.'
    ]
  },
  {
    title: '4. Use of Spotify, YouTube, and other platforms',
    body: [
      'When a song includes a Spotify or YouTube player, GuitarraIA uses only integrations, links, APIs, or embeds made available by the relevant platform to developers and websites, subject to that platform’s technical and contractual rules.',
      'Playback occurs through the third party’s official infrastructure and player. GuitarraIA does not alter, remove, or obscure controls, branding, advertising, attribution, territorial restrictions, availability rules, playback policies, or monetization mechanisms established by those platforms.',
      'Plays, impressions, advertising, subscriptions, metrics, royalties, revenue, and other economic effects generated through those official players belong to Spotify, YouTube, rights holders, and other ecosystem participants under their applicable agreements and policies. GuitarraIA does not receive or administer royalties generated inside those official players.',
      'A song may become unavailable due to decisions by the platform or rights holder, or due to geographic, technical, or contractual restrictions.'
    ]
  },
  {
    title: '5. No storage or distribution of songs',
    body: [
      'GuitarraIA does not host, store, distribute, download, retransmit, or make available complete audio or video files of commercial songs.',
      'Audiovisual content played through embeds is served directly by the relevant external platform. GuitarraIA does not enable users to download, extract, or bypass protections, advertising, controls, or restrictions imposed by those services.'
    ]
  },
  {
    title: '6. Chords, tablatures, and educational content',
    body: [
      'Chords, chord sheets, tablatures, diagrams, and explanations are provided for teaching, study, analysis, and personal practice. They may result from editorial work, automated processing, artificial intelligence, or musical interpretation.',
      'An educational or free purpose does not automatically exempt every use from copyright law. Certain arrangements, transcriptions, lyrics, tablatures, or other materials may be protected. GuitarraIA seeks to limit use to what is reasonably necessary for the educational experience and will respond to valid rights-holder requests.',
      'GuitarraIA does not guarantee that chords, timing, keys, diagrams, or tablatures are accurate, official, or identical to an authorized edition.'
    ]
  },
  {
    title: '7. Artificial intelligence and accuracy',
    body: [
      'Artificial intelligence features may produce incomplete, inaccurate, or outdated results. Users should verify information before relying on it in performances, recordings, publications, classes, commercial activities, or any context where accuracy is important.',
      'GuitarraIA is not a substitute for official sheet music, a licensed edition, a teacher, a producer, a lawyer, or a source authorized by the relevant rights holder.'
    ]
  },
  {
    title: '8. Permitted use',
    list: [
      'Review and practice chords, diagrams, and tablatures for personal learning.',
      'Use the AI assistant and educational tools in a lawful and reasonable manner.',
      'Play content through official players and in accordance with their conditions.',
      'Share links to GuitarraIA pages without claiming ownership of third-party material.'
    ]
  },
  {
    title: '9. Prohibited use',
    list: [
      'Download, copy, capture, extract, or redistribute audio or video from embedded players.',
      'Remove or interfere with advertising, attribution, branding, controls, or third-party monetization systems.',
      'Use GuitarraIA to infringe copyright, trademark, image rights, privacy rights, or other rights.',
      'Commercialize, republish at scale, or create a substitute database from platform content without authorization.',
      'Conduct abusive scraping, unauthorized automated access, reverse engineering, attacks, control circumvention, or unauthorized access.',
      'Represent content displayed or generated by GuitarraIA as official, authorized, or accurate when it is not.'
    ]
  },
  {
    title: '10. Copyright complaints and takedown requests',
    body: [
      'Rights holders or their authorized representatives may request the review, correction, blocking, or removal of material they believe infringes their rights.',
      'A request should identify the claimant, the protected work, the exact GuitarraIA URL, the nature of the claimed right, a good-faith statement, and verifiable contact information. Requests may be submitted through the contact channel or chat available at guitarraia.com.',
      'GuitarraIA may temporarily remove or restrict access while reviewing a claim and may request additional documentation establishing ownership or authority. Manifestly incomplete, abusive, or fraudulent claims may be rejected.'
    ]
  },
  {
    title: '11. Trademarks and third-party services',
    body: [
      'Spotify, YouTube, YouTube Music, and their respective logos and trademarks belong to their owners. Their presence identifies integrated services and does not imply a corporate relationship with GuitarraIA.',
      'Users acknowledge that interaction with external services may involve data processing, cookies, advertising, or authentication by those third parties under their own policies.'
    ]
  },
  {
    title: '12. Free access, donations, and platform monetization',
    body: [
      'General access to GuitarraIA is offered free of charge as an educational service. The platform may accept donations, display its own advertising, use affiliate links, or offer additional services, provided this does not appropriate monetization belonging to third-party players or content.',
      'A donation or payment for an additional service does not grant any rights in third-party songs, recordings, videos, lyrics, transcriptions, or trademarks.'
    ]
  },
  {
    title: '13. Limitation of liability',
    body: [
      'GuitarraIA is provided “as is” and as available. It does not guarantee uninterrupted operation, permanent song availability, compatibility with every device, or complete accuracy of educational content.',
      'To the fullest extent permitted by applicable law, GuitarraIA is not liable for third-party platform decisions, content removal, regional restrictions, outages, indirect losses, claims resulting from user misuse, or infringements committed by third parties.'
    ]
  },
  {
    title: '14. Changes and termination',
    body: [
      'GuitarraIA may change, suspend, or remove features, integrations, or content when necessary to comply with law, protect third-party rights, respond to technical changes, or comply with Spotify, YouTube, or other provider policies.',
      'These terms may be updated. The latest revision date will appear on this page, and continued use of the platform constitutes acceptance of the current version.'
    ]
  },
  {
    title: '15. Applicable law and contact',
    body: [
      'These terms are interpreted under the law applicable to the operator of GuitarraIA, without limiting any mandatory consumer rights available in the user’s jurisdiction.',
      'For legal inquiries, copyright complaints, or requests relating to these terms, use the contact channel available at guitarraia.com and provide enough information to identify and evaluate the request.'
    ]
  }
];

function TermsContent({ sections }) {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-3 text-xl font-semibold text-foreground">{section.title}</h2>
          {section.body?.map((paragraph) => (
            <p key={paragraph} className="mb-3 leading-relaxed text-muted-foreground last:mb-0">{paragraph}</p>
          ))}
          {section.list && (
            <ul className="list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground">
              {section.list.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export default function TermsPage() {
  const [language, setLanguage] = useState('es');
  useSEO({
    title: 'Términos y condiciones | GuitarraIA',
    description: 'Términos de uso, copyright musical, embeds de Spotify y YouTube y política de retiro de contenido de GuitarraIA.',
    canonical: '/terminos',
  });

  const isSpanish = language === 'es';

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-6">
      <Link to="/" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {isSpanish ? 'Volver al inicio' : 'Back to home'}
      </Link>

      <div className="mb-8 rounded-3xl border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{ background: '#FFF7ED', color: '#C2410C' }}>
              <ShieldCheck className="h-4 w-4" /> COPYRIGHT Y USO EDUCATIVO
            </div>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              {isSpanish ? 'Términos y Condiciones de Uso' : 'Terms and Conditions of Use'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSpanish ? `Última actualización: ${UPDATED_AT}` : 'Last updated: July 31, 2026'} · GuitarraIA · guitarraia.com
            </p>
          </div>
          <div className="inline-flex self-start rounded-xl border bg-secondary p-1">
            <button type="button" onClick={() => setLanguage('es')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${isSpanish ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}>ES</button>
            <button type="button" onClick={() => setLanguage('en')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${!isSpanish ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'}`}>EN</button>
          </div>
        </div>

        <div className="mt-6 flex gap-3 rounded-2xl border p-4" style={{ borderColor: '#FED7AA', background: '#FFF7ED' }}>
          <Globe2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#EA580C' }} />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {isSpanish
              ? 'GuitarraIA no es propietaria de las canciones ni de las grabaciones mostradas. Los contenidos musicales pertenecen a sus respectivos titulares y la reproducción se realiza mediante servicios oficiales de terceros cuando están disponibles.'
              : 'GuitarraIA does not own the songs or recordings displayed. Musical content belongs to its respective rights holders, and playback is provided through official third-party services when available.'}
          </p>
        </div>
      </div>

      <TermsContent sections={isSpanish ? spanishSections : englishSections} />
    </div>
  );
}
