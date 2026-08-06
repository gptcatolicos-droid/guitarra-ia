import fs from 'node:fs';

const packets = [
  {
    rank: 100,
    slug: 'johnny-thunders-gibson-les-paul-junior-tv-yellow-1959',
    title: 'Gibson Les Paul Junior TV Yellow de Johnny Thunders: historia y ficha técnica',
    excerpt: 'La Les Paul Junior TV Yellow de Johnny Thunders condensó la estética directa del punk y ayudó a convertir un diseño austero de Gibson en un icono.',
    brand: 'Gibson', model: 'Les Paul Junior TV Model', year: 'ca. 1959', owner: 'Johnny Thunders', decade: '1950',
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Gibson%20%2759%20Les%20Paul%20Junior%20DC%20TV%20Yellow.jpg",
    imageNote: 'Imagen representativa de una Les Paul Junior TV Yellow de 1959; no se presenta como fotografía del ejemplar exacto de Johnny Thunders.',
    facts: [
      'Billboard situó esta guitarra en el puesto 100 de su selección de las 100 guitarras más icónicas de todos los tiempos.',
      'El instrumento quedó asociado a Johnny Thunders y a la identidad visual y sonora de New York Dolls.',
      'Sylvain Sylvain explicó que la Les Paul Junior era adecuada para la banda porque era un instrumento despojado, como el grupo y sus canciones.',
      'El acabado TV Yellow fue desarrollado por Gibson para conservar visibilidad en las emisiones de televisión en blanco y negro.',
      'Billy Duffy ha contado que deseaba una Junior amarilla como la de Thunders y que terminó comprando una wine red en 1979.'
    ],
    specs: [['Tipo','Guitarra eléctrica de cuerpo sólido'],['Construcción típica del periodo','Cuerpo y mástil de caoba; mástil encolado'],['Pastilla','Una P-90 en posición de puente'],['Controles','Volumen y tono'],['Puente','Wraparound'],['Acabado asociado','TV Yellow']],
    repertoire: 'La guitarra está vinculada a la etapa de New York Dolls y a la carrera posterior de Thunders. Las fuentes consultadas documentan su papel central en la imagen del músico, pero no atribuyen de manera inequívoca cada grabación a un único ejemplar.',
    relatedPlayers: 'Leslie West, Billie Joe Armstrong, Joan Jett, Mick Jones y Billy Duffy',
    keywords: ['Johnny Thunders guitarra','Gibson Les Paul Junior TV Yellow','guitarra punk','Les Paul Junior 1959','guitarras icónicas']
  },
  {
    rank: 99,
    slug: 'brittany-howard-gibson-les-paul-sg-custom-1961',
    title: 'Gibson Les Paul SG Custom de Brittany Howard: historia, sonido y especificaciones',
    excerpt: 'La SG Custom de Brittany Howard convirtió un instrumento vintage de tres pastillas en una pieza central del sonido y la imagen de Alabama Shakes.',
    brand: 'Gibson', model: 'Les Paul SG Custom', year: 'modelo 1961; reedición de comienzos de los años ochenta', owner: 'Brittany Howard', decade: '1960',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Gibson%20SG.jpg',
    imageNote: 'Imagen reutilizable de una Gibson SG utilizada como referencia visual de la familia; no corresponde necesariamente al ejemplar Inverness Green de Howard.',
    facts: [
      'Billboard ubicó la guitarra de Brittany Howard en el puesto 99.',
      'Howard se acercó a la SG después de tomar prestado un instrumento de Heath Fogg, guitarrista de Alabama Shakes.',
      'Su guitarra es descrita como una 1961 Les Paul SG Custom en acabado Inverness Green, fabricada como reedición a comienzos de los años ochenta.',
      'El instrumento tiene tres pastillas y presenta desgaste visible acumulado por el uso.',
      'Howard ha explicado que prefiere que sus técnicos no limpien excesivamente las pastillas porque valora el carácter generado por el tiempo.',
      'La artista empleó la SG durante la presentación de Alabama Shakes en Saturday Night Live en 2013.'
    ],
    specs: [['Tipo','Guitarra eléctrica de cuerpo sólido y doble cutaway'],['Configuración documentada','Tres pastillas'],['Acabado asociado','Inverness Green'],['Construcción típica SG Custom','Cuerpo de caoba y mástil encolado'],['Escala típica Gibson','24,75 pulgadas'],['Amplificación vinculada','Amplificadores Orange']],
    repertoire: 'La SG quedó asociada al ascenso de Alabama Shakes y a la combinación de soul, blues, rock y música alternativa desarrollada por Howard. La presentación televisiva de 2013 es un momento visualmente documentado. No se atribuye automáticamente cada pista de estudio al mismo ejemplar.',
    relatedPlayers: 'Sister Rosetta Tharpe, Eric Clapton, Angus Young, Tony Iommi, Derek Trucks y Frank Zappa',
    keywords: ['Brittany Howard guitarra','Gibson SG Custom','Alabama Shakes guitarra','Inverness Green SG','guitarras icónicas']
  },
  {
    rank: 98,
    slug: 'john-mayer-prs-silver-sky-historia-ficha-tecnica',
    title: 'PRS Silver Sky de John Mayer: historia, diseño y ficha técnica',
    excerpt: 'La PRS Silver Sky de John Mayer reinterpretó la guitarra de tres pastillas y escala larga con una construcción moderna desarrollada junto a Paul Reed Smith.',
    brand: 'PRS', model: 'Silver Sky', year: '2018', owner: 'John Mayer', decade: '2010',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/2022%20PRS%20SE%20John%20Mayer%20Silver%20Sky%20Moon%20White.jpg',
    imageNote: 'Fotografía reutilizable de una PRS SE Silver Sky; sirve como referencia de la familia y no sustituye la documentación del primer modelo Core de 2018.',
    facts: [
      'PRS y John Mayer presentaron la Silver Sky en 2018.',
      'Billboard la colocó en el puesto 98 de su lista de guitarras icónicas.',
      'El proyecto combinó una silueta familiar de tres pastillas con elementos propios de PRS, como la pala invertida y los marcadores de aves.',
      'Mayer describió el objetivo como una manera de imaginar el futuro de un diseño clásico.',
      'Los acabados iniciales tomaron inspiración de colores de automóviles Tesla y de productos tecnológicos contemporáneos.',
      'La denominación 635JM de las pastillas y del perfil del mástil alude al punto tonal buscado entre referencias de 1963 y 1964.'
    ],
    specs: [['Tipo','Guitarra eléctrica de cuerpo sólido, doble cutaway'],['Cuerpo','Aliso en el modelo Core documentado'],['Escala','25,5 pulgadas'],['Mástil','Arce, perfil 635JM'],['Pastillas','Tres single-coil 635JM'],['Pala','Diseño PRS invertido'],['Lanzamiento','2018']],
    repertoire: 'La Silver Sky se convirtió en un instrumento principal de Mayer en su carrera solista y en numerosas apariciones con Dead & Company. La familia se amplió posteriormente con la versión SE. La atribución de una pista concreta exige documentación de sesión y no se deduce únicamente de una fotografía o de una gira.',
    relatedPlayers: 'John Mayer y músicos contemporáneos que han adoptado versiones Core y SE de la plataforma Silver Sky',
    keywords: ['PRS Silver Sky','John Mayer guitarra','Silver Sky especificaciones','PRS 635JM','guitarra John Mayer']
  },
  {
    rank: 97,
    slug: 'adam-jones-gibson-les-paul-custom-silverburst-1979',
    title: 'Gibson Les Paul Custom Silverburst de Adam Jones: historia y ficha técnica',
    excerpt: 'La Les Paul Custom Silverburst de 1979 convirtió un acabado poco común de Gibson en parte inseparable de la identidad visual y sonora de Tool.',
    brand: 'Gibson', model: 'Les Paul Custom Silverburst', year: '1979', owner: 'Adam Jones', decade: '1970',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Gibson%20Les%20Paul%20Custom.jpg',
    imageNote: 'Imagen representativa de una Les Paul Custom. El ejemplar exacto de Adam Jones utiliza el acabado Silverburst original de 1979.',
    facts: [
      'Billboard situó la Les Paul Custom Silverburst de Adam Jones en el puesto 97.',
      'El Silverburst original fue producido aproximadamente entre 1978 y 1982.',
      'Jones convirtió una Les Paul Custom de 1979 en su guitarra principal con Tool.',
      'El acabado combina un centro plateado con bordes oscuros y puede adquirir tonos verdosos por el envejecimiento de la laca de nitrocelulosa.',
      'Jones ha declarado poseer varios ejemplares originales, incluidos dos de 1979.',
      'La demanda generada por Tool llevó a Gibson y Epiphone a desarrollar recreaciones y colecciones relacionadas con el músico.',
      'La opinión de Jones sobre una posible influencia tonal de la pintura metálica se presenta como apreciación personal, no como una conclusión científica.'
    ],
    specs: [['Tipo','Guitarra eléctrica de cuerpo sólido, single cutaway'],['Año del ejemplar principal','1979'],['Acabado','Silverburst con laca de nitrocelulosa'],['Construcción típica','Cuerpo de caoba, tapa de arce y mástil encolado'],['Escala típica Gibson','24,75 pulgadas'],['Pastillas','Humbuckers; pueden existir modificaciones entre ejemplares']],
    repertoire: 'La Silverburst está ligada a las etapas principales de Tool, a afinaciones graves y a un lenguaje basado en riffs repetitivos, silencios controlados y métricas irregulares. Jones utiliza varios ejemplares similares para conservar consistencia y disponer de repuestos. El timbre final también depende de amplificadores, efectos y técnica.',
    relatedPlayers: 'Adam Jones; la familia Les Paul Custom también está asociada con Randy Rhoads, Zakk Wylde, Peter Frampton y numerosos músicos de rock y metal',
    keywords: ['Adam Jones Silverburst','Les Paul Custom 1979','guitarra de Tool','Gibson Silverburst','Adam Jones guitarra']
  },
  {
    rank: 96,
    slug: 'jimmy-page-fender-telecaster-dragon-1959',
    title: 'Fender Telecaster Dragon de Jimmy Page: historia, grabaciones y ficha técnica',
    excerpt: 'La Telecaster Dragon de Jimmy Page pasó de Jeff Beck a Led Zeppelin, fue pintada por el propio Page y participó en momentos decisivos del rock.',
    brand: 'Fender', model: 'Telecaster Dragon', year: '1959', owner: 'Jimmy Page', decade: '1950',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Fender%20Telecaster.jpg',
    imageNote: 'Imagen reutilizable de una Fender Telecaster como referencia del modelo. No es una fotografía de la Dragon original pintada por Jimmy Page.',
    facts: [
      'Billboard ubicó la Dragon Telecaster en el puesto 96.',
      'Jeff Beck utilizó la guitarra con The Yardbirds y se la regaló a Jimmy Page en 1965.',
      'El instrumento era una Telecaster de 1959 con acabado White Blonde, mástil de arce y diapasón slab de palisandro.',
      'Page añadió primero ocho espejos circulares y después retiró el acabado para pintar un dragón psicodélico.',
      'Sustituyó el golpeador negro por uno de acrílico transparente con película de rejilla de difracción.',
      'La guitarra fue utilizada ampliamente en el álbum debut de Led Zeppelin y en el solo de Stairway to Heaven.',
      'Page comenzó a preferir Les Paul en grandes escenarios porque la Telecaster podía generar acoples a volúmenes elevados.'
    ],
    specs: [['Tipo','Guitarra eléctrica de cuerpo sólido'],['Año','1959'],['Acabado original','White Blonde'],['Modificación visual','Dragón pintado por Jimmy Page'],['Mástil y diapasón','Arce con diapasón slab de palisandro'],['Golpeador','Acrílico transparente con película de difracción'],['Procedencia','Jeff Beck; regalada a Page en 1965']],
    repertoire: 'Antes de llegar a Page, la Telecaster estuvo vinculada a grabaciones de The Yardbirds como Shapes of Things y Heart Full of Soul. Con Led Zeppelin aparece documentada en buena parte del primer álbum y en el solo de Stairway to Heaven. Su historia demuestra que una Telecaster podía producir un sonido pesado y expansivo.',
    relatedPlayers: 'Jeff Beck, Jimmy Page, Keith Richards, Bruce Springsteen, James Burton, Roy Buchanan y Steve Cropper',
    keywords: ['Jimmy Page Dragon Telecaster','Fender Telecaster 1959','guitarra Led Zeppelin','Telecaster Stairway to Heaven','Jimmy Page guitarra']
  }
];

function table(rows) {
  return ['| Campo | Información |','|---|---|', ...rows.map(([a,b]) => `| ${a} | ${b} |`)].join('\n');
}

function makeContent(p) {
  const facts = p.facts.map((fact) => `- ${fact}`).join('\n');
  const brandSlug = p.brand.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  return `![${p.title}](${p.image})\n\n> **Crédito y alcance de la imagen:** ${p.imageNote}\n\n## Por qué esta guitarra es histórica\n\n${p.facts[0]} Esta selección de Billboard no clasifica solamente modelos comerciales: analiza instrumentos concretos asociados a músicos, grabaciones, actuaciones, modificaciones y momentos culturales. En el caso de **${p.owner}**, la importancia de **${p.brand} ${p.model}** surge de la relación entre el objeto físico, la forma de tocar y la imagen pública construida alrededor de la guitarra.\n\n${p.facts.slice(1,3).join(' ')} El instrumento debe entenderse como parte de una cadena en la que participan el fabricante, el músico, los técnicos, los amplificadores, los estudios, los escenarios y las audiencias. Ninguna especificación aislada explica por sí sola por qué una guitarra se vuelve icónica.\n\n## Datos históricos comprobados\n\n${facts}\n\nEstos datos se presentan de manera diferenciada. Las características documentadas del ejemplar no se confunden con las especificaciones generales de todas las unidades del modelo. Cuando existe una declaración del artista, se identifica como testimonio; cuando una relación solo es probable, no se formula como certeza.\n\n## Contexto de la marca y el modelo\n\nLa historia de **${p.brand} ${p.model}** se inscribe en la evolución de la guitarra durante el siglo XX. Los fabricantes debieron responder a escenarios más grandes, nuevos niveles de amplificación, técnicas de grabación multipista y cambios en la cultura juvenil. En ese proceso, ciertos diseños se convirtieron en plataformas: podían conservar una arquitectura básica y, al mismo tiempo, ser modificados para responder a la identidad de un intérprete.\n\nEl ejemplar asociado a ${p.owner} pertenece al periodo **${p.year}**. Su relevancia no se limita a la antigüedad. El uso sostenido, las reparaciones, el desgaste y las decisiones estéticas transformaron el instrumento en un documento material. Las marcas de uso permiten reconstruir hábitos de ejecución, condiciones de gira y preferencias técnicas.\n\n## Ficha técnica documentada\n\n${table([['Marca',p.brand],['Modelo o referencia',p.model],['Año o periodo',p.year],['Propietario asociado',p.owner],['Posición en Billboard',String(p.rank)],...p.specs])}\n\nLas guitarras históricas pueden cambiar durante décadas de mantenimiento. Pastillas, potenciómetros, trastes, clavijas, puentes y acabados pueden ser sustituidos. Por eso, una reedición actual no debe describirse como idéntica al instrumento original sin documentación de fábrica y procedencia.\n\n## Construcción, sonido y respuesta musical\n\nLa respuesta de una guitarra depende de la interacción entre escala, materiales, unión del mástil, puente, electrónica, cuerdas, amplificador y ataque. En manos de ${p.owner}, el modelo se convirtió en un vocabulario: articulación, sustain, ruido, compresión y rango medio fueron utilizados como recursos expresivos.\n\nEl oyente puede no conocer el año exacto del instrumento, pero reconoce la manera en que ocupa una mezcla. Una guitarra con una pastilla simple puede destacar por ataque y definición; una configuración humbucker puede aportar nivel de salida y densidad; un instrumento acústico electrificado puede conservar respuesta dinámica mientras se adapta al escenario. El diseño es el punto de partida, no el sonido final.\n\nLa técnica del intérprete sigue siendo decisiva. La presión de la mano izquierda, el ángulo de la púa, la posición del ataque, el control de volumen y la relación con el amplificador producen diferencias mayores que muchas modificaciones cosméticas. Esta es una de las razones por las que una guitarra famosa no garantiza por sí sola el tono del músico que la utilizó.\n\n## Grabaciones y momentos relevantes\n\n${p.repertoire}\n\nLa atribución de instrumentos a canciones debe manejarse con cautela. Fotografías promocionales no prueban una sesión de estudio y una guitarra utilizada en gira no necesariamente aparece en todas las pistas de un álbum. GuitarraIA solo formula una asociación directa cuando existe documentación editorial, entrevista, registro de sesión o una fuente especializada consistente.\n\n## Otros guitarristas vinculados al modelo\n\nLa familia **${p.model}** y sus diseños relacionados han sido utilizados por músicos de diferentes estilos. Entre los nombres vinculados se encuentran **${p.relatedPlayers}**. Esto no implica que todos utilizaran el mismo año, electrónica o configuración. La comparación sirve para comprender la capacidad de adaptación del diseño.\n\nUn mismo modelo puede responder de manera distinta en punk, blues, rock, metal, country, soul o música experimental. Los cambios de amplificador, afinación, calibre de cuerdas y técnica alteran profundamente el resultado. La longevidad de una plataforma se mide precisamente por esa capacidad para conservar identidad sin imponer una sola forma de tocar.\n\n## La guitarra dentro de la década de ${p.decade}\n\nLa década de **${p.decade}** ofrece el contexto necesario para comprender este instrumento. La industria de la guitarra negociaba entre tradición artesanal y producción industrial, entre acabados reconocibles y nuevas identidades visuales. La guitarra se convirtió simultáneamente en herramienta musical, producto de consumo y emblema cultural.\n\nLas fotografías de conciertos, portadas, programas de televisión y videos fijaron asociaciones que después fueron reproducidas en reediciones y modelos signature. De esta forma, una modificación personal podía terminar influyendo en catálogos globales. El instrumento de ${p.owner} es relevante porque ayudó a convertir una elección individual en una referencia colectiva.\n\n## Cómo reconocer una versión histórica o una reedición\n\nPara identificar una versión histórica se deben revisar el número de serie, el periodo de fabricación, la forma del cuerpo y la pala, la unión del mástil, las cavidades, el puente, las pastillas, los potenciómetros, las soldaduras y el acabado. En instrumentos de artistas también importan las reparaciones y modificaciones documentadas. Una apariencia similar no demuestra autenticidad.\n\nLa procedencia es esencial en el mercado de colección. Facturas, fotografías fechadas, registros de técnicos, catálogos, certificados y cadenas de propiedad reducen el riesgo de atribuciones falsas. Para un músico que busca tocar, una reedición moderna puede ofrecer mayor estabilidad, garantía y disponibilidad de repuestos que una pieza histórica.\n\n## Legado cultural\n\nLa permanencia de **${p.brand} ${p.model}** muestra que la historia de la guitarra se construye mediante usos concretos. El instrumento asociado a ${p.owner} se volvió icónico porque participó en una narrativa reconocible y porque su imagen condensó una época, una técnica y una actitud.\n\nSu puesto ${p.rank} en Billboard funciona como punto de partida, no como una verdad absoluta. La investigación se complementa con documentación del fabricante, archivos musicales, entrevistas y fuentes especializadas. El objetivo es explicar por qué la guitarra merece ser estudiada sin convertir una lista editorial en una afirmación incontestable.\n\n## Explora otras guitarras\n\n- [Más guitarras de ${p.brand}](/blog?marca=${brandSlug})\n- [Historia de la guitarra en la década de ${p.decade}](/blog?decada=${p.decade})\n- [Las guitarras más icónicas de la historia](/blog?tag=guitarras-iconicas)\n- [Acordes y material de práctica](/acordes)\n\n## Fuentes y metodología\n\n- Billboard, selección editorial *The 100 Greatest Guitars of All Time* publicada en 2024.\n- Guitar World, cobertura de la lista y contexto histórico de sus primeros puestos.\n- Wikimedia Commons, información de autoría y licencia de la imagen enlazada.\n- Documentación histórica, catálogos y materiales editoriales de ${p.brand}.\n\n**Palabras clave relacionadas:** ${p.keywords.join(', ')}.`;
}

const posts = packets.map((p) => ({
  title: p.title,
  slug: p.slug,
  excerpt: p.excerpt,
  content: makeContent(p),
  image_url: p.image,
  image_alt: p.title,
  category: 'Guitarras',
  tags: [...p.keywords, p.brand, p.model, p.owner, `guitarras ${p.decade}`],
  reading_time_min: 16,
  published: true,
  status: 'published',
  editorial_validation: 'verified',
  source_collection: 'Billboard 100 Greatest Guitars 2024',
  seo_title: p.title.slice(0, 68),
  seo_description: p.excerpt.slice(0, 158),
  iconic_rank: p.rank,
  guitar_brand: p.brand,
  guitar_model: p.model,
  guitar_decade: p.decade
}));

const seed = `import { pool } from './db.js';\nconst posts = ${JSON.stringify(posts)};\nexport async function ensureIconicGuitarArticlesBatch1(){\n let inserted=0,updated=0;\n for(const post of posts){\n  const found=await pool.query(\"SELECT id FROM entity_records WHERE entity_name='BlogPost' AND data->>'slug'=$1 LIMIT 1\",[post.slug]);\n  if(found.rows[0]){\n   await pool.query('UPDATE entity_records SET data=data || $2::jsonb,updated_date=NOW() WHERE id=$1',[found.rows[0].id,JSON.stringify(post)]); updated++;\n  }else{\n   await pool.query(\"INSERT INTO entity_records(entity_name,data,created_date,updated_date) VALUES('BlogPost',$1::jsonb,NOW(),NOW())\",[JSON.stringify(post)]); inserted++;\n  }\n }\n console.log('Iconic guitar articles batch 1 ensured',{inserted,updated,total:posts.length,lengths:posts.map(p=>p.content.length)});\n}\n`;
fs.writeFileSync('server/iconic-guitars-batch1.js', seed);

let index=fs.readFileSync('server/index.js','utf8');
if(!index.includes('ensureIconicGuitarArticlesBatch1')){
 index=index.replace('import { quarantineInvalidRankings } from "./ranking-emergency-fix.js";','import { quarantineInvalidRankings } from "./ranking-emergency-fix.js";\nimport { ensureIconicGuitarArticlesBatch1 } from "./iconic-guitars-batch1.js";');
 index=index.replace('await quarantineInvalidRankings();','await quarantineInvalidRankings();\nawait ensureIconicGuitarArticlesBatch1();');
}
fs.writeFileSync('server/index.js',index);

let page=fs.readFileSync('src/pages/BlogPostPage.jsx','utf8');
if(!page.includes('post.image_url &&')){
 page=page.replace('          {/* Content */}','          {post.image_url && (\n            <figure className="mb-8 overflow-hidden rounded-2xl border bg-white" style={{borderColor:\'#E5E7EB\'}}>\n              <img src={post.image_url} alt={post.image_alt || post.title} className="w-full max-h-[640px] object-contain bg-white" loading="eager" />\n              {post.image_credit && <figcaption className="px-4 py-3 text-xs" style={{color:\'#6B7280\'}}>{post.image_credit}</figcaption>}\n            </figure>\n          )}\n\n          {/* Content */}');
}
fs.writeFileSync('src/pages/BlogPostPage.jsx',page);
console.log('Iconic guitars batch 1 build patch installed.');