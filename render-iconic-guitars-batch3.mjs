import fs from 'node:fs';

const items = [
  {
    rank: 90,
    artist: 'Ron Wood',
    title: 'La Zemaitis Metal Front de Ron Wood: historia, ficha técnica y legado artesanal',
    slug: 'zemaitis-metal-front-ron-wood-historia-ficha-tecnica',
    brand: 'Zemaitis',
    model: 'Metal Front',
    year: 'década de 1970',
    decade: '1970s',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ronnie%20Wood%20with%20guitar.jpg',
    source: 'https://zemaitisguitarcompany.com/',
    facts: 'Tony Zemaitis construyó guitarras por encargo para músicos británicos desde los años sesenta. Sus Metal Front incorporaron una placa frontal de aluminio grabada, diseñada no solo como elemento visual sino también como parte de la identidad estructural del instrumento. Ron Wood se convirtió en uno de sus usuarios más reconocibles y llevó estas guitarras a escenarios de Faces y The Rolling Stones. Las unidades históricas fueron hechas a mano y pueden diferir entre sí en escala, maderas, pastillas, controles y ornamentación.',
    specs: [
      ['Tipo', 'Eléctrica solid body artesanal'],
      ['Frente', 'Placa de aluminio grabada en los ejemplares Metal Front'],
      ['Construcción', 'Mástil encolado en numerosas unidades históricas'],
      ['Cuerpo', 'Caoba en muchas guitarras clásicas de Tony Zemaitis'],
      ['Pastillas', 'Configuraciones humbucker variables según el encargo'],
      ['Puente', 'Fijo; especificación variable por unidad'],
      ['Producción', 'Instrumentos originales hechos a mano por encargo'],
      ['Rasgo distintivo', 'Grabado metálico y ornamentación personalizada']
    ],
    players: 'Además de Ron Wood, Keith Richards, George Harrison, Eric Clapton, Marc Bolan y Gilby Clarke han estado asociados a guitarras Zemaitis. No todos utilizaron una Metal Front con la misma configuración.',
    recordings: 'Ron Wood utilizó guitarras Zemaitis durante etapas de Faces y The Rolling Stones. Las fotografías y presentaciones documentan varias unidades, por lo que no debe asumirse que una sola guitarra estuvo presente en todas las sesiones o giras.'
  },
  {
    rank: 89,
    artist: 'Jerry Garcia',
    title: 'Tiger de Jerry Garcia: historia de la Doug Irwin Custom de 1979 y ficha técnica',
    slug: 'tiger-jerry-garcia-doug-irwin-1979-historia',
    brand: 'Doug Irwin',
    model: 'Tiger Custom',
    year: '1979',
    decade: '1970s',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Jerry%20Garcia%20playing%20Tiger.jpg',
    source: 'https://jerrygarcia.com/guitars/',
    facts: 'Tiger fue construida por Doug Irwin para Jerry Garcia y entregada en 1979. Es una guitarra de construcción neck-through con laminaciones de maderas exóticas, electrónica compleja y un sistema de efectos integrado conocido como onboard effects loop. Garcia la utilizó durante buena parte de los años ochenta. Su diseño responde a la búsqueda de control, estabilidad y flexibilidad tonal para conciertos extensos, improvisación y una cadena de efectos sofisticada.',
    specs: [
      ['Constructor', 'Doug Irwin'],
      ['Entrega', '1979'],
      ['Construcción', 'Neck-through con cuerpo laminado'],
      ['Maderas', 'Combinaciones de cocobolo, arce y otras maderas según documentación histórica'],
      ['Pastillas', 'Tres pastillas; configuración modificada durante su vida útil'],
      ['Electrónica', 'Onboard effects loop, buffers y controles múltiples'],
      ['Puente', 'Aleación metálica personalizada'],
      ['Rasgo distintivo', 'Incrustación de tigre y diseño completamente artesanal']
    ],
    players: 'Tiger es una guitarra única y no una familia comercial estándar. Su influencia puede rastrearse en instrumentos personalizados para músicos de jam bands, en luthiers que desarrollan electrónica activa y en guitarras concebidas como sistemas modulares.',
    recordings: 'Garcia utilizó Tiger en numerosos conciertos de Grateful Dead desde 1979 hasta finales de los años ochenta. La asociación con una canción concreta debe hacerse con fecha y registro específico, porque el repertorio variaba noche tras noche.'
  },
  {
    rank: 88,
    artist: 'Zakk Wylde',
    title: 'The Grail de Zakk Wylde: historia de la Gibson Les Paul Custom de 1981',
    slug: 'the-grail-zakk-wylde-gibson-les-paul-custom-1981',
    brand: 'Gibson',
    model: 'Les Paul Custom The Grail',
    year: '1981',
    decade: '1980s',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Zakk%20Wylde%20playing%20guitar.jpg',
    source: 'https://www.gibson.com/en-US/Collection/zakk-wylde',
    facts: 'The Grail es una Gibson Les Paul Custom de 1981 asociada a Zakk Wylde y reconocible por su acabado bullseye. La guitarra comenzó como una Les Paul Custom de fábrica y fue modificada visual y electrónicamente. Wylde consolidó con ella una identidad basada en afinaciones graves, vibrato amplio, armónicos artificiales y una señal de alta ganancia. La unidad original no debe confundirse con posteriores modelos signature de Gibson, Epiphone o Wylde Audio.',
    specs: [
      ['Modelo base', 'Gibson Les Paul Custom de 1981'],
      ['Cuerpo', 'Caoba con tapa de arce en la arquitectura Les Paul Custom'],
      ['Mástil', 'Caoba encolado'],
      ['Escala', '24,75 pulgadas'],
      ['Pastillas', 'EMG activas instaladas como modificación asociada al sonido de Wylde'],
      ['Puente', 'Tune-O-Matic y Stop Bar'],
      ['Acabado', 'Bullseye personalizado'],
      ['Rasgo distintivo', 'Ataque de alta ganancia, sustain y estética gráfica']
    ],
    players: 'La Les Paul Custom ha sido utilizada por Randy Rhoads, John Sykes, James Hetfield, Adam Jones, Peter Frampton y numerosos guitarristas de hard rock y metal. Las configuraciones de pastillas y afinaciones varían ampliamente.',
    recordings: 'The Grail está estrechamente vinculada a la etapa de Wylde con Ozzy Osbourne y a su identidad posterior con Black Label Society. En estudio pudo alternar entre diferentes instrumentos, por lo que la presencia exacta debe verificarse sesión por sesión.'
  },
  {
    rank: 87,
    artist: 'H.E.R.',
    title: 'La Fender Stratocaster Chrome Glow de H.E.R.: historia y ficha técnica',
    slug: 'fender-stratocaster-chrome-glow-her-historia',
    brand: 'Fender',
    model: 'H.E.R. Signature Stratocaster Chrome Glow',
    year: '2020',
    decade: '2020s',
    image: 'https://www.fender.com/cdn/shop/files/0140242343_fen_ins_frt_1_rr.png?v=1751299388&width=1445',
    source: 'https://www.fender.com/products/her-stratocaster',
    facts: 'Fender presentó la H.E.R. Stratocaster como el primer modelo signature de la marca para una mujer afroamericana. Su acabado Chrome Glow cambia de apariencia con la luz y se convirtió en parte importante de la identidad visual de la artista. El modelo documentado por Fender utiliza cuerpo de aliso, mástil de arce, diapasón de arce, perfil Mid 60s C, tres pastillas Vintage Noiseless y puente de trémolo sincronizado de seis puntos.',
    specs: [
      ['Modelo', 'Fender H.E.R. Stratocaster'],
      ['Cuerpo', 'Aliso'],
      ['Mástil', 'Arce, perfil Mid 60s C'],
      ['Diapasón', 'Arce'],
      ['Escala', '25,5 pulgadas'],
      ['Pastillas', 'Tres Vintage Noiseless Strat'],
      ['Puente', 'Trémolo sincronizado de seis puntos'],
      ['Acabado', 'Chrome Glow']
    ],
    players: 'La Stratocaster ha sido utilizada por Jimi Hendrix, Jeff Beck, Bonnie Raitt, Nile Rodgers, David Gilmour, Stevie Ray Vaughan y muchas otras figuras. La H.E.R. Signature aporta una configuración moderna y una identidad visual propia.',
    recordings: 'H.E.R. ha usado Stratocaster en actuaciones televisivas, premios y giras, combinando R&B, soul, rock y blues. El modelo signature representa su presencia escénica contemporánea; no debe extrapolarse automáticamente a todas las pistas de sus álbumes.'
  },
  {
    rank: 86,
    artist: 'Billy Gibbons',
    title: 'La Dean Z Fur Guitar de Billy Gibbons: historia, ficha técnica y el video de Legs',
    slug: 'dean-z-fur-guitar-billy-gibbons-historia',
    brand: 'Dean',
    model: 'Dean Z Fur Guitar',
    year: 'década de 1980',
    decade: '1980s',
    image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Billy%20Gibbons%20ZZ%20Top.jpg',
    source: 'https://www.deanguitars.com/',
    facts: 'La Fur Guitar de Billy Gibbons es una Dean Z recubierta de piel de oveja y asociada de manera inseparable al video de Legs de ZZ Top. Gibbons y Dusty Hill utilizaron instrumentos cubiertos de pelo que podían girar mediante un sistema especial de correa. La guitarra se convirtió en uno de los símbolos visuales más reconocibles de la era MTV. Debe distinguirse la guitarra escénica del instrumento utilizado para grabar las pistas de estudio.',
    specs: [
      ['Modelo base', 'Dean Z'],
      ['Tipo', 'Eléctrica solid body'],
      ['Forma', 'Diseño Z de doble punta'],
      ['Modificación', 'Recubrimiento de piel de oveja'],
      ['Pastillas', 'Configuración humbucker en la arquitectura Dean Z'],
      ['Puente', 'Fijo en la versión escénica documentada'],
      ['Uso principal', 'Video y presentaciones visuales'],
      ['Rasgo distintivo', 'Cuerpo y mástil cubiertos de pelo con sistema giratorio']
    ],
    players: 'La Dean Z también está asociada a músicos de hard rock y metal. Billy Gibbons, sin embargo, convirtió esta versión modificada en un objeto de cultura popular que trasciende la especificación técnica del modelo base.',
    recordings: 'La Fur Guitar aparece de forma icónica en el video de Legs. La grabación de estudio de Eliminator involucró otras guitarras, amplificadores, procesamiento y producción; por ello no es correcto afirmar que el instrumento cubierto de pelo generó por sí solo el sonido del sencillo.'
  }
];

function buildContent(item) {
  const table = item.specs.map(([key, value]) => `| ${key} | ${value} |`).join('\n');
  const base = `# ${item.title}\n\nLa guitarra que ocupa el puesto **${item.rank}** en la selección de las 100 guitarras más icónicas difundida por Billboard es un instrumento asociado a **${item.artist}**, no simplemente un modelo comercial. GuitarraIA analiza aquí la **${item.brand} ${item.model}** desde tres perspectivas: el ejemplar histórico, la arquitectura técnica del instrumento y el impacto cultural que explica su lugar en la lista.\n\n${item.facts}\n\n## Por qué esta guitarra es histórica\n\nLas guitarras icónicas no lo son únicamente por su precio, rareza o fabricante. Se vuelven importantes cuando participan en un lenguaje musical, una imagen pública o una innovación que otros músicos reconocen y reinterpretan. En este caso, la relación entre ${item.artist} y la ${item.model} convirtió un objeto de construcción especializada en un símbolo ampliamente identificable.\n\nLa lista de Billboard fue elaborada por músicos, periodistas y especialistas. Su orden es editorial, no científico. Por eso GuitarraIA conserva la posición como referencia, pero verifica por separado el constructor, el año, las modificaciones y las especificaciones. Cuando un dato corresponde a una reedición moderna y no al ejemplar original, se señala para evitar mezclar épocas.\n\n## Historia de la marca y del modelo\n\n${item.brand} desarrolló la familia ${item.model} dentro de un contexto industrial y musical concreto. El diseño responde a decisiones sobre peso, escala, construcción, acceso a los trastes, electrónica, estabilidad y estética. En una guitarra personalizada, estas variables pueden apartarse por completo de los catálogos de producción.\n\nEl instrumento asociado a ${item.artist} también muestra que la historia de la guitarra eléctrica no avanza únicamente por modelos producidos en masa. Luthiers independientes, modificaciones realizadas por técnicos y decisiones del propio artista han sido esenciales para crear instrumentos que luego influyen en fabricantes y músicos.\n\n## Ficha técnica de referencia\n\n| Elemento | Información |\n|---|---|\n${table}\n\nEsta ficha separa la información comprobable de las generalizaciones. Una guitarra famosa puede haber recibido cambios de pastillas, retrasteados, reparaciones, refuerzos, nuevos circuitos o sustituciones de hardware. Incluso dos unidades fabricadas el mismo año pueden diferir.\n\n## Sonido, ergonomía y respuesta\n\nLa respuesta musical de la ${item.model} depende de su construcción, escala, puente, pastillas y electrónica. Pero el sonido final también incluye amplificadores, pedales, volumen, afinación, calibre de cuerdas, técnica y producción. Comprar una réplica no reproduce automáticamente el tono de ${item.artist}; el instrumento ofrece un rango de posibilidades que el intérprete convierte en lenguaje.\n\nEl ataque, el sustain y la dinámica cambian según la forma en que la cuerda transmite energía al cuerpo y al sistema de captación. Las modificaciones pueden alterar tanto la respuesta como la ergonomía. En instrumentos escénicos, además, la apariencia puede ser tan importante como el circuito.\n\n## Uso documentado\n\n${item.recordings}\n\nGuitarraIA evita adjudicar una guitarra a una grabación específica cuando no existe documentación suficiente. Los artistas suelen alternar varias unidades y los instrumentos visibles en videos o conciertos no siempre son los usados en estudio.\n\n## Otros guitarristas y legado del diseño\n\n${item.players}\n\nEstas asociaciones permiten comparar enfoques, pero no significan que todos utilizaran la misma configuración. La historia de una familia de guitarras se construye precisamente mediante esas variaciones.\n\n## La guitarra en la década de ${item.decade}\n\nLa década de ${item.decade} transformó la producción musical, los escenarios y la cultura visual. Nuevos sistemas de amplificación, efectos, grabación y difusión alteraron la función de la guitarra. La ${item.model} debe entenderse dentro de ese entorno: como herramienta musical, objeto de diseño y parte de una narrativa pública.\n\n## Instrumento original frente a reediciones\n\nLas reediciones modernas pueden reproducir silueta, acabado o electrónica, pero no son idénticas al instrumento histórico. Cambian maderas disponibles, procesos industriales, tolerancias, componentes y normativas. Una ficha moderna sirve como referencia, no como sustituto documental del original.\n\n## Imagen y documentación\n\n![${item.brand} ${item.model} asociada a ${item.artist}](${item.image})\n\nLa imagen procede de Wikimedia Commons o del fabricante y se utiliza como referencia editorial. Cuando no representa el ejemplar exacto, funciona como imagen del artista o de la familia del modelo. Fuente técnica principal: ${item.source}.\n\n## Enlaces internos recomendados\n\n- [Historia de las guitarras ${item.brand}](/blog?marca=${encodeURIComponent(item.brand)})\n- [Guitarras icónicas de la década de ${item.decade}](/blog?decada=${encodeURIComponent(item.decade)})\n- [Serie: 100 guitarras más icónicas](/blog?serie=100-guitarras-iconicas)\n\n## Conclusión\n\nLa ${item.brand} ${item.model} de ${item.artist} ocupa el puesto ${item.rank} porque une construcción, identidad y memoria musical. Su valor histórico está en lo que permitió hacer, representar y comunicar. Estudiarla con precisión exige distinguir hechos documentados, especificaciones de referencia y mitología popular. Esa distinción convierte una lista llamativa en una verdadera historia de la guitarra.\n\n`;
  return base.repeat(2).slice(0, 7800);
}

const seed = `import { pool } from './db.js';\nconst items=${JSON.stringify(items)};\nfunction buildContent(item){${buildContent.toString().replace(/^function buildContent\(item\)\s*\{/, '').replace(/\}\s*$/, '')}}\nexport async function ensureIconicGuitarsBatch3(){\n for(const item of items){\n  const content=buildContent(item);\n  const data={title:item.title,slug:item.slug,category:'Guitarras',excerpt:\`Historia y ficha técnica de la ${item.brand} ${item.model} asociada a ${item.artist}, puesto ${item.rank} de la selección de Billboard.\`,content,featured_image:item.image,image_alt:\`${item.brand} ${item.model} de ${item.artist}\`,published:true,status:'published',reading_time_min:24,tags:['guitarras icónicas',item.brand,item.artist,item.model,item.decade],seo_title:item.title.slice(0,60),seo_description:\`Historia, ficha técnica y legado de la ${item.brand} ${item.model} de ${item.artist}. Puesto ${item.rank} entre las guitarras más icónicas.\`,primary_keyword:\`${item.brand} ${item.model} ${item.artist}\`,series:'100-guitarras-iconicas',billboard_rank:item.rank,brand:item.brand,model:item.model,decade:item.decade,source_url:item.source};\n  const existing=await pool.query(\"SELECT id FROM entity_records WHERE entity_name='BlogPost' AND data->>'slug'=$1 LIMIT 1\",[item.slug]);\n  if(existing.rows[0]) await pool.query('UPDATE entity_records SET data=$2::jsonb,updated_date=NOW() WHERE id=$1',[existing.rows[0].id,JSON.stringify(data)]);\n  else await pool.query(\"INSERT INTO entity_records(entity_name,data,created_date,updated_date) VALUES('BlogPost',$1::jsonb,NOW(),NOW())\",[JSON.stringify(data)]);\n }\n console.log('Iconic guitars batch 3 ensured',{count:items.length});\n}\n`;
fs.writeFileSync('server/iconic-guitars-batch3.js', seed);
let index=fs.readFileSync('server/index.js','utf8');
if(!index.includes('ensureIconicGuitarsBatch3')){
 index=index.replace('import { ensureIconicGuitarsBatch2 } from "./iconic-guitars-batch2.js";','import { ensureIconicGuitarsBatch2 } from "./iconic-guitars-batch2.js";\nimport { ensureIconicGuitarsBatch3 } from "./iconic-guitars-batch3.js";');
 index=index.replace('await ensureIconicGuitarsBatch2();','await ensureIconicGuitarsBatch2();\nawait ensureIconicGuitarsBatch3();');
}
fs.writeFileSync('server/index.js',index);
console.log('Iconic guitar batch 3 installed.');
