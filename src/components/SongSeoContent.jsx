import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

function Section({ title, children }) {
  return (
    <section className="pt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
      <h2 className="text-base font-bold mb-3" style={{ color: '#1F2937' }}>{title}</h2>
      {children}
    </section>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden bg-white" style={{ borderColor: '#E5E7EB' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F3F4F6]"
      >
        <span className="text-sm font-medium" style={{ color: '#1F2937' }}>{question}</span>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#6B7280' }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#6B7280' }} />
        }
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm" style={{ color: '#6B7280' }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function SongSeoContent({ song }) {
  const hasSeoContent = song?.seo_intro || song?.seo_how_to_play || song?.seo_beginner_tips?.length > 0 || song?.seo_faq?.length > 0;
  if (!hasSeoContent) return null;

  return (
    <div className="mt-8 space-y-0">
      {song.seo_intro && (
        <Section title={song.seo_h1 || `Cómo tocar ${song.title}`}>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{song.seo_intro}</p>
        </Section>
      )}

      {song.seo_how_to_play && (
        <Section title="Cómo tocarla">
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{song.seo_how_to_play}</p>
        </Section>
      )}

      {song.seo_chord_explanation && (
        <Section title="Los acordes">
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>{song.seo_chord_explanation}</p>
        </Section>
      )}

      {song.seo_beginner_tips?.length > 0 && (
        <Section title="Consejos para principiantes">
          <ul className="space-y-2">
            {song.seo_beginner_tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm" style={{ color: '#6B7280' }}>
                <span style={{ color: '#F97316' }} className="shrink-0 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {song.seo_faq?.length > 0 && (
        <Section title="Preguntas frecuentes">
          <div className="space-y-2">
            {song.seo_faq.map((item, i) => (
              <FaqItem key={i} question={item.question} answer={item.answer} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}