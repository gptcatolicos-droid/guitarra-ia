export default function ChordDiagram({ chordName, diagram }) {
  if (!diagram) {
    return (
      <div className="flex flex-col items-center">
        <span className="text-[#ff7a00] text-sm font-bold mb-1">{chordName}</span>
        <div className="w-[60px] h-[76px] flex items-center justify-center text-[#a7afb8] text-[10px] border border-[#2b3138] rounded">
          N/A
        </div>
      </div>
    );
  }

  const { frets, barre } = diagram;
  const numStrings = 6;
  const numFrets = 4;
  const w = 60;
  const h = 76;
  const mx = 8;
  const my = 14;
  const sw = (w - mx * 2) / (numStrings - 1);
  const fh = (h - my * 2) / numFrets;

  const playedFrets = frets.filter((f) => f > 0);
  const startFret = playedFrets.length > 0 && Math.min(...playedFrets) > 3 ? Math.min(...playedFrets) : 1;

  return (
    <div className="flex flex-col items-center">
      <span className="text-[#ff7a00] text-sm font-bold mb-1">{chordName}</span>
      <svg width={w} height={h} className="overflow-visible">
        {Array.from({ length: numFrets + 1 }).map((_, i) => (
          <line
            key={`f-${i}`}
            x1={mx}
            y1={my + i * fh}
            x2={w - mx}
            y2={my + i * fh}
            stroke="#3a4048"
            strokeWidth={i === 0 ? 2 : 1}
          />
        ))}
        {Array.from({ length: numStrings }).map((_, i) => (
          <line
            key={`s-${i}`}
            x1={mx + i * sw}
            y1={my}
            x2={mx + i * sw}
            y2={h - my}
            stroke="#3a4048"
            strokeWidth="1"
          />
        ))}
        {startFret > 1 && (
          <text x={w - mx + 3} y={my + fh / 2 + 3} fill="#a7afb8" fontSize="7">
            {startFret}fr
          </text>
        )}
        {barre && (
          <rect
            x={mx}
            y={my + (barre - startFret) * fh + 2}
            width={sw * (numStrings - 1)}
            height={fh - 4}
            rx="3"
            fill="#ff7a00"
            opacity="0.85"
          />
        )}
        {frets.map((fret, i) => {
          const x = mx + i * sw;
          if (fret > 0) {
            const y = my + (fret - startFret + 0.5) * fh;
            return <circle key={`d-${i}`} cx={x} cy={y} r="3.5" fill="#ff7a00" />;
          }
          if (fret === 0) {
            return (
              <text key={`o-${i}`} x={x} y={my - 4} fill="#a7afb8" fontSize="7" textAnchor="middle">
                ○
              </text>
            );
          }
          if (fret === -1) {
            return (
              <text key={`x-${i}`} x={x} y={my - 4} fill="#a7afb8" fontSize="7" textAnchor="middle">
                ✕
              </text>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}