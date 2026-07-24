import { Minus, Plus, RotateCcw } from 'lucide-react';

export default function TransposeControls({
  semitones,
  onTranspose,
  fontSize,
  onFontSize,
  autoScroll,
  onAutoScroll,
  showDiagrams,
  onShowDiagrams,
}) {
  const btn = 'w-8 h-8 flex items-center justify-center bg-[#F3F4F6] text-[#1F2937] rounded-lg hover:bg-[#E5E7EB] transition-colors';

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 p-3 min-w-0 bg-white border border-[#E5E7EB] rounded-xl shadow-sm">
      <div className="flex items-center gap-1">
        <span className="text-[#6B7280] text-xs mr-1">Transponer:</span>
        <button className={btn} onClick={() => onTranspose(semitones - 1)}>
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-[#1F2937] text-sm w-8 text-center font-medium">
          {semitones > 0 ? `+${semitones}` : semitones}
        </span>
        <button className={btn} onClick={() => onTranspose(semitones + 1)}>
          <Plus className="w-4 h-4" />
        </button>
        {semitones !== 0 && (
          <button className={btn} onClick={() => onTranspose(0)} title="Tonalidad original">
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="w-px h-6 bg-[#E5E7EB] mx-1" />

      <button
        onClick={() => onAutoScroll(!autoScroll)}
        className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${
          autoScroll ? 'bg-[#F97316] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:text-[#1F2937]'
        }`}
      >
        Auto-scroll
      </button>

      <div className="w-px h-6 bg-[#E5E7EB] mx-1" />

      <div className="flex items-center gap-1">
        <span className="text-[#6B7280] text-xs mr-1">Tamaño:</span>
        <button className={btn} onClick={() => onFontSize(Math.max(10, fontSize - 1))} style={{ fontSize: 11 }}>
          A-
        </button>
        <button className={btn} onClick={() => onFontSize(Math.min(24, fontSize + 1))} style={{ fontSize: 13 }}>
          A+
        </button>
      </div>

      <div className="w-px h-6 bg-[#E5E7EB] mx-1" />

      <button
        onClick={() => onShowDiagrams(!showDiagrams)}
        className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors ${
          showDiagrams ? 'bg-[#F97316] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:text-[#1F2937]'
        }`}
      >
        Diagramas
      </button>
    </div>
  );
}