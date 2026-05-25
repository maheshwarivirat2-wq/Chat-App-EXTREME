'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { subscribeToRoomMessages } from '@/lib/realtime/messages-channel';
import { useMessagesStore } from '@/stores/messages-store';
import type { ChatMessage } from '@/lib/types/chat';

type MessageRowWithProfile = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

type MessageInsertRow = {
  id: string;
  room_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type RoomThemeRow = {
  theme_key: string | null;
};

type ThemeStyle = {
  pageBg: string;
  headerBg: string;
  border: string;
  mineBubble: string;
  otherBubble: string;
  inputBg: string;
};

const ROOM_THEME_STYLES: Record<string, ThemeStyle> = {
  'neo-violet': {
    pageBg: 'bg-[#0B0F19]',
    headerBg: 'bg-[#121826]',
    border: 'border-slate-800',
    mineBubble: 'bg-indigo-500/90 text-indigo-50',
    otherBubble: 'bg-slate-700/80 text-slate-100',
    inputBg: 'bg-[#121826]'
  },
  'neo-cyan': {
    pageBg: 'bg-[#071821]',
    headerBg: 'bg-[#0C2430]',
    border: 'border-cyan-900/70',
    mineBubble: 'bg-cyan-500/85 text-cyan-50',
    otherBubble: 'bg-slate-700/80 text-slate-100',
    inputBg: 'bg-[#0C2430]'
  }
};

const mapMessage = (row: MessageRowWithProfile): ChatMessage => ({
  id: row.id,
  roomId: row.room_id,
  senderId: row.sender_id,
  senderDisplayName: row.profiles?.full_name?.trim() || 'Unknown User',
  body: row.body,
  createdAt: row.created_at
});

export default function RoomChatPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const roomId = params.id;
  const roomName = searchParams.get('name')?.trim() || `Room ${roomId.slice(0, 8)}`;

  const supabase = useMemo(() => createClient(), []);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [themeKey, setThemeKey] = useState<string>('neo-violet');
  const { byRoom, setActiveRoom, upsertMessage } = useMessagesStore();
  const messages = byRoom[roomId] ?? [];
  const theme = ROOM_THEME_STYLES[themeKey] ?? ROOM_THEME_STYLES['neo-violet'];

  useEffect(() => {
    setActiveRoom(roomId);

    const { channel, ready } = subscribeToRoomMessages(
      supabase,
      roomId,
      async (payload) => {
        const inserted = (payload as RealtimePostgresInsertPayload<MessageInsertRow>).new;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', inserted.sender_id)
          .maybeSingle();

        upsertMessage(
          mapMessage({
            ...inserted,
            profiles: { full_name: profile?.full_name ?? null }
          })
        );
      }
    );

    const bootstrapRoom = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      try {
        await ready;
      } catch {
        return;
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(full_name)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error || !data) return;
      (data as MessageRowWithProfile[]).forEach((row) => upsertMessage(mapMessage(row)));

      const { data: roomTheme } = await supabase.from('rooms').select('theme_key').eq('id', roomId).maybeSingle();
      setThemeKey((roomTheme as RoomThemeRow | null)?.theme_key ?? 'neo-violet');
    };

    void bootstrapRoom();

    return () => {
      setActiveRoom(null);
      void supabase.removeChannel(channel);
    };
  }, [roomId, setActiveRoom, supabase, upsertMessage]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendError(null);

    const body = messageInput.trim();
    if (!body) return;

    if (!currentUserId) {
      setSendError('Unable to send message. Please sign in again.');
      return;
    }

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: currentUserId,
      body
    });

    if (error) {
      setSendError(error.message);
      return;
    }

    setMessageInput('');
  };

  return (
    <main className={`min-h-screen text-white ${theme.pageBg}`}>
      <header className={`sticky top-0 z-20 border-b ${theme.border} ${theme.headerBg}`}>
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-3 sm:px-4">
          <Link aria-label="Back to rooms" className="rounded-md p-2 text-xl text-slate-200 hover:bg-slate-700/50" href="/rooms">
            ←
          </Link>

          <Link
            className="max-w-[70%] truncate rounded-md px-3 py-1 text-base font-semibold text-slate-100 hover:bg-slate-700/50"
            href={`/rooms/${roomId}/settings?name=${encodeURIComponent(roomName)}`}
          >
            {roomName}
          </Link>

          <button aria-label="Room settings" className="rounded-md p-2 text-xl leading-none text-slate-200 hover:bg-slate-700/50">
            ⋮
          </button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-3 pb-28 pt-4 sm:px-4">
        {messages.map((message) => {
          const isMe = message.senderId === currentUserId;

          return (
            <article key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] sm:max-w-[72%]">
                {!isMe ? <p className="mb-1 px-1 text-xs text-slate-400">{message.senderDisplayName}</p> : null}
                <div
                  className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                    isMe
                      ? `rounded-br-md ${theme.mineBubble}`
                      : `rounded-bl-md ${theme.otherBubble}`
                  }`}
                >
                  {message.body}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <form className={`fixed bottom-0 left-0 right-0 z-20 border-t px-3 py-3 sm:px-4 ${theme.border} ${theme.inputBg}`} onSubmit={sendMessage}>
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2 sm:gap-3">
          <input
            className="w-full rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm text-black placeholder-gray-500 outline-none ring-indigo-500 transition focus:ring-2"
            placeholder="Write a message..."
            type="text"
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
          />
          <button className="rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400" type="submit">
            Send
          </button>
        </div>
        {sendError ? <p className="mx-auto mt-2 w-full max-w-4xl text-sm text-rose-300">{sendError}</p> : null}
      </form>
    </main>
  );
}
