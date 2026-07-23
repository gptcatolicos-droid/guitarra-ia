export default function SongMeta({ song }) {
  const items = [];
  if (song.original_key) items.push({ label: 'Tonalidad', value: song.original_key });
  if (song.capo) items.push({ label: 'Capo', value: `Traste ${song.capo}` });
  if (song.tuning) items.push({ label: 'Afinación', value: song.tuning });
  if (song.difficulty) items.push({ label: 'Dificultad', value: song.difficulty });

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-[#20242a] border border-[#2b3138] rounded-xl p-3 min-w-0"
        >
          <p className="text-[#a7afb8] text-xs mb-1">{item.label}</p>
          <p className="text-white text-sm font-medium break-words">{item.value}</p>
        </div>
      ))}
    </div>
  );
}