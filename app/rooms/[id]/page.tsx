'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { subscribeToRoomMessages } from '@/lib/realtime/messages-channel';
import { useMessagesStore } from '@/stores/messages-store';
import type { ChatMessage } from '@/lib/types/chat';
import { ThemePresetKey, themePresets } from '@/lib/theme/tokens';
import { Settings } from 'lucide-react';

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
  theme_key: ThemePresetKey | null;
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
  const [themeKey, setThemeKey] = useState<ThemePresetKey>('neo-violet');
  const { byRoom, setActiveRoom, upsertMessage } = useMessagesStore();
  const messages = byRoom[roomId] ?? [];
  const chatThemeClasses =
    themeKey === 'neo-cyan'
      ? {
          mainBg: 'bg-cyan-950',
          headerBg: 'bg-cyan-950',
          headerBorder: 'border-cyan-900',
          myBubble: 'rounded-br-md bg-cyan-400 text-cyan-950',
          otherBubble: 'rounded-bl-md bg-slate-800 text-cyan-50',
          senderName: 'text-cyan-200/80',
          formBg: 'bg-cyan-950',
          formBorder: 'border-cyan-900',
          input: 'border-cyan-800 bg-slate-900 text-white placeholder-cyan-200/60 focus:ring-cyan-400',
          sendButton: 'bg-cyan-500 text-cyan-950 hover:bg-cyan-400'
        }
      : {
          mainBg: 'bg-[#0B0F19]',
          headerBg: 'bg-[#121826]',
          headerBorder: 'border-slate-800',
          myBubble: 'rounded-br-md bg-indigo-500/90 text-indigo-50',
          otherBubble: 'rounded-bl-md bg-slate-700/80 text-slate-100',
          senderName: 'text-slate-400',
          formBg: 'bg-[#121826]',
          formBorder: 'border-slate-800',
          input: 'border-slate-300 bg-white text-black placeholder-gray-500 focus:ring-indigo-500',
          sendButton: 'bg-indigo-500 text-white hover:bg-indigo-400'
        };

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

      const { data: roomData } = await supabase.from('rooms').select('theme_key').eq('id', roomId).maybeSingle();
      const roomTheme = (roomData as RoomThemeRow | null)?.theme_key;
      if (roomTheme && roomTheme in themePresets) {
        setThemeKey(roomTheme as ThemePresetKey);
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(full_name)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error || !data) return;
      (data as MessageRowWithProfile[]).forEach((row) => upsertMessage(mapMessage(row)));
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
    <main className={`min-h-screen text-white ${chatThemeClasses.mainBg}`}>
      <header className={`sticky top-0 z-20 border-b ${chatThemeClasses.headerBorder} ${chatThemeClasses.headerBg}`}>
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-3 sm:px-4">
          <Link aria-label="Back to rooms" className="rounded-md p-2 text-xl text-slate-200 hover:bg-slate-700/50" href="/rooms">
            ←
          </Link>

          <Link
            className="max-w-[70%] cursor-pointer truncate rounded-md px-3 py-1 text-base font-semibold text-slate-100 hover:bg-slate-700/50"
            href={`/rooms/${roomId}/settings`}
          >
            {roomName}
          </Link>

          <Link
            aria-label="Room settings"
            className="cursor-pointer rounded-md p-2 text-slate-200 hover:bg-slate-700/50"
            href={`/rooms/${roomId}/settings`}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-3 pb-28 pt-4 sm:px-4">
        {messages.map((message) => {
          const isMe = message.senderId === currentUserId;

          return (
            <article key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] sm:max-w-[72%]">
                {!isMe ? <p className={`mb-1 px-1 text-xs ${chatThemeClasses.senderName}`}>{message.senderDisplayName}</p> : null}
                <div
                  className={`rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm ${
                    isMe ? chatThemeClasses.myBubble : chatThemeClasses.otherBubble
                  }`}
                                  >
                  {message.body}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <form className={`fixed bottom-0 left-0 right-0 z-20 border-t px-3 py-3 sm:px-4 ${chatThemeClasses.formBorder} ${chatThemeClasses.formBg}`} onSubmit={sendMessage}>
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2 sm:gap-3">
          <input
            className={`w-full rounded-full border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${chatThemeClasses.input}`}
            placeholder="Write a message..."
            type="text"
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
                      />
          <button className={`rounded-full px-4 py-2.5 text-sm font-semibold ${chatThemeClasses.sendButton}`} type="submit">
            Send
          </button>
        </div>
        {sendError ? <p className="mx-auto mt-2 w-full max-w-4xl text-sm text-rose-300">{sendError}</p> : null}
      </form>
    </main>
  );
}
