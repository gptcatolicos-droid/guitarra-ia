import { Volume2, VolumeX } from 'lucide-react';
import { useChordSound } from '@/lib/audio/useChordSound';

// Global control: enable/disable chord sound and switch strum/arpeggio.
// Discreet, does not clutter the UI. Reusable anywhere.
export default function ChordSoundToggle({ compact = false }) {
  const { settings, setSettings } = useChordSound();

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setSettings({ enabled: !settings.enabled })}
        aria-label={settings.enabled ? 'Desactivar sonido de acordes' : 'Activar sonido de acordes'}
        aria-pressed={settings.enabled}
        className="inline-flex items-center gap-1.5 px-2.5 min-h-9 rounded-lg text-xs font-medium transition-colors"
        style={{
          backgroundColor: settings.enabled ? 'rgba(255,114,0,0.12)' : '#171A1C',
          border: `1px solid ${settings.enabled ? 'rgba(255,114,0,0.45)' : '#303538'}`,
          color: settings.enabled ? '#FF7200' : '#747B7F',
        }}
      >
        {settings.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        {!compact && (settings.enabled ? 'Sonido' : 'Silencio')}
      </button>

      {settings.enabled && (
        <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid #303538' }}>
          {[
            { id: 'strum', label: 'Rasgueo' },
            { id: 'arpeggio', label: 'Arpegio' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setSettings({ mode: m.id })}
              aria-pressed={settings.mode === m.id}
              className="px-2.5 min-h-9 text-xs font-medium transition-colors"
              style={{
                backgroundColor: settings.mode === m.id ? '#FF7200' : '#171A1C',
                color: settings.mode === m.id ? '#fff' : '#747B7F',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}