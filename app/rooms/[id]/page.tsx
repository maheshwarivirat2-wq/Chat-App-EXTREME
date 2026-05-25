import Link from 'next/link';

type RoomChatPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ name?: string }>;
};

const demoMessages = [
  { id: '1', sender: 'Ava', text: 'Hey team, ready for tonight?', isMe: false },
  { id: '2', sender: 'Me', text: 'Yep, I am online and ready to go 🚀', isMe: true },
  { id: '3', sender: 'Noah', text: 'I can join in 5 minutes.', isMe: false },
  { id: '4', sender: 'Me', text: 'Perfect, we can start when you arrive.', isMe: true },
  { id: '5', sender: 'Ava', text: 'Great, I will post updates in this room.', isMe: false }
];

export default async function RoomChatPage({ params, searchParams }: RoomChatPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const roomName = resolvedSearchParams?.name?.trim() || `Room ${id.slice(0, 8)}`;

  return (
    <main className="min-h-screen bg-[#0B0F19] text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-[#121826]">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-3 sm:px-4">
          <Link aria-label="Back to rooms" className="rounded-md p-2 text-xl text-slate-200 hover:bg-slate-700/50" href="/rooms">
            ←
          </Link>

          <button className="max-w-[70%] truncate rounded-md px-3 py-1 text-base font-semibold text-slate-100 hover:bg-slate-700/50">
            {roomName}
          </button>

          <button aria-label="Room settings" className="rounded-md p-2 text-xl leading-none text-slate-200 hover:bg-slate-700/50">
            ⋮
          </button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-3 pb-28 pt-4 sm:px-4">
        {demoMessages.map((message) => (
          <article key={message.id} className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] sm:max-w-[72%]">
              {!message.isMe ? <p className="mb-1 px-1 text-xs text-slate-400">{message.sender}</p> : null}
              <div
                className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                  message.isMe
                    ? 'rounded-br-md bg-indigo-500/90 text-indigo-50'
                    : 'rounded-bl-md bg-slate-700/80 text-slate-100'
                }`}
              >
                {message.text}
              </div>
            </div>
          </article>
        ))}
      </section>

      <form className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800 bg-[#121826] px-3 py-3 sm:px-4">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2 sm:gap-3">
          <input
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-black placeholder-gray-500 outline-none ring-indigo-500 transition focus:ring-2"
            placeholder="Write a message..."
            type="text"
          />
          <button className="rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400" type="button">
            Send
          </button>
        </div>
      </form>
    </main>
  );
}
