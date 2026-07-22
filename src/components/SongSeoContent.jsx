import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

function Section({ title, children }) {
  return (
    <section className="pt-6" style={{ borderTop: '1px solid #272C2F' }}>
      <h2 className="text-base font-bold mb-3" style={{ color: '#F4F4F2' }}>{title}</h2>
      {children}
    </section>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: '#272C2F' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <span className="text-sm font-medium" style={{ color: '#F4F4F2' }}>{question}</span>
        {open
          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#747B7F' }} />
          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#747B7F' }} />
        }
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm" style={{ color: '#A7ACAE' }}>{answer}</p>
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
          <p className="text-sm leading-relaxed" style={{ color: '#A7ACAE' }}>{song.seo_intro}</p>
        </Section>
      )}

      {song.seo_how_to_play && (
        <Section title="Cómo tocarla">
          <p className="text-sm leading-relaxed" style={{ color: '#A7ACAE' }}>{song.seo_how_to_play}</p>
        </Section>
      )}

      {song.seo_chord_explanation && (
        <Section title="Los acordes">
          <p className="text-sm leading-relaxed" style={{ color: '#A7ACAE' }}>{song.seo_chord_explanation}</p>
        </Section>
      )}

      {song.seo_beginner_tips?.length > 0 && (
        <Section title="Consejos para principiantes">
          <ul className="space-y-2">
            {song.seo_beginner_tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm" style={{ color: '#A7ACAE' }}>
                <span style={{ color: '#FF7200' }} className="shrink-0 mt-0.5">•</span>
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