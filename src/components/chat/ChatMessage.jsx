import SongResultCard from './SongResultCard';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-[#ff7a00] text-white rounded-br-md'
              : 'bg-[#20242a] text-[#f3f4f6] rounded-bl-md border border-[#2b3138]'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>
        {message.songs && message.songs.length > 0 && (
          <div className="mt-3 w-full space-y-2">
            {message.songs.map((song) => (
              <SongResultCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}