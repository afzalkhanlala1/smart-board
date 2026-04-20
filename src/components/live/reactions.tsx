"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { cn } from "@/lib/utils";

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  createdAt: number;
}

interface ReactionsProps {
  userId: string;
}

const EMOJIS = [
  { emoji: "\u{1F44D}", label: "thumbs up" },
  { emoji: "\u{1F44F}", label: "clap" },
  { emoji: "\u2764\uFE0F", label: "heart" },
  { emoji: "\u{1F602}", label: "laugh" },
  { emoji: "\u{1F389}", label: "party" },
  { emoji: "\u{1F914}", label: "thinking" },
  { emoji: "\u{1F525}", label: "fire" },
  { emoji: "\u{1F4AF}", label: "100" },
];

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function ReactionsOverlay({ userId }: ReactionsProps) {
  const room = useRoomContext();
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setReactions((prev) =>
        prev.filter((r) => Date.now() - r.createdAt < 3000)
      );
    }, 500);

    return () => clearInterval(cleanup);
  }, []);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(decoder.decode(payload));
        if (data.type === "reaction") {
          const reaction: Reaction = {
            id: `${Date.now()}-${Math.random()}`,
            emoji: data.emoji,
            x: 10 + Math.random() * 80,
            createdAt: Date.now(),
          };
          setReactions((prev) => [...prev.slice(-20), reaction]);
        }
      } catch {
        // ignore
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
      {reactions.map((r) => (
        <span
          key={r.id}
          className="absolute animate-float-up text-3xl"
          style={{
            left: `${r.x}%`,
            bottom: 0,
          }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}

export function ReactionsBar({ userId }: ReactionsProps) {
  const room = useRoomContext();
  const [cooldown, setCooldown] = useState(false);

  const sendReaction = useCallback(
    async (emoji: string) => {
      if (cooldown) return;
      setCooldown(true);
      setTimeout(() => setCooldown(false), 500);

      try {
        const payload = encoder.encode(
          JSON.stringify({ type: "reaction", emoji, userId })
        );
        await room.localParticipant.publishData(payload, { reliable: false });
      } catch {
        // best-effort
      }
    },
    [room, userId, cooldown]
  );

  return (
    <div className="flex items-center gap-1">
      {EMOJIS.map(({ emoji, label }) => (
        <button
          key={label}
          type="button"
          onClick={() => sendReaction(emoji)}
          disabled={cooldown}
          className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center text-lg transition-transform hover:scale-125 active:scale-90",
            cooldown && "opacity-50 cursor-not-allowed"
          )}
          aria-label={label}
          title={label}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
