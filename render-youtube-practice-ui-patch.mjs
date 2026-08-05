import fs from 'node:fs';

const file = 'src/components/YouTubePracticePlayer.jsx';
let source = fs.readFileSync(file, 'utf8');

source = source.replace(
  "return cues.slice(Math.max(0, activeIndex + 1), Math.max(0, activeIndex + 5));",
  "return cues.slice(Math.max(0, activeIndex + 1), Math.max(0, activeIndex + 3));",
);

const oldBlock = `          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] sm:mt-7" style={{ color: '#9CA3AF' }}>Próximos cambios</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {nextChords.map((cue, index) => <span key={\`${'${cue.time}-${cue.chord}-${index}'}\`} className="rounded-xl border px-3 py-2 text-sm font-bold" style={{ borderColor: '#FDBA74', color: '#C2410C' }}>{cue.chord} <small className="font-medium opacity-70">{formatTime(cue.time)}</small></span>)}
          </div>`;

const newBlock = `          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] sm:mt-7" style={{ color: '#9CA3AF' }}>Próximos acordes</p>
          <div className="mx-auto mt-3 flex max-w-xl items-end justify-center gap-3 sm:gap-5" aria-label="Dos acordes siguientes">
            <AnimatePresence initial={false} mode="popLayout">
              {nextChords.map((cue, index) => {
                const diagram = getChordDiagram(cue.chord);
                const isImmediate = index === 0;
                return (
                  <motion.div
                    layout
                    key={\`${'${cue.time}-${cue.chord}'}\`}
                    initial={{ opacity: 0, x: 28, scale: 0.82, filter: 'blur(8px)' }}
                    animate={{
                      opacity: isImmediate ? 0.82 : 0.48,
                      x: 0,
                      scale: isImmediate ? 0.82 : 0.68,
                      filter: isImmediate ? 'blur(1.5px)' : 'blur(4px)',
                    }}
                    exit={{ opacity: 0, x: -34, scale: 1.05, filter: 'blur(8px)' }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24, mass: 0.7 }}
                    className="relative flex w-32 shrink-0 flex-col items-center rounded-2xl border bg-white px-2 py-3 shadow-sm sm:w-40 sm:px-3 sm:py-4"
                    style={{ borderColor: '#FED7AA', transformOrigin: 'bottom center' }}
                  >
                    <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: '#9CA3AF' }}>
                      {isImmediate ? 'Siguiente' : 'Después'}
                    </span>
                    <strong className="text-xl font-black sm:text-2xl" style={{ color: '#F97316' }}>{cue.chord}</strong>
                    <div className="mt-1 flex h-[92px] w-[78px] items-center justify-center overflow-hidden sm:h-[108px] sm:w-[90px]">
                      <div className="scale-[1.05] sm:scale-[1.22]" style={{ transformOrigin: 'center' }}>
                        <ChordDiagram chordName={cue.chord} diagram={diagram} capo={song?.capo || 0} playable={false} />
                      </div>
                    </div>
                    <small className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: '#FFF7ED', color: '#C2410C' }}>
                      {formatTime(cue.time)}
                    </small>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>`;

if (!source.includes(oldBlock)) {
  throw new Error('Upcoming chord block was not found; practice UI patch aborted safely.');
}

source = source.replace(oldBlock, newBlock);
fs.writeFileSync(file, source, 'utf8');
console.log('YouTube practice transition UI installed.');
