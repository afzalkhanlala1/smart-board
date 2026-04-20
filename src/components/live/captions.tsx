"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { Subtitles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CaptionEntry {
  id: string;
  text: string;
  speaker: string;
  timestamp: number;
}

interface CaptionsOverlayProps {
  isVisible: boolean;
}

const decoder = new TextDecoder();

export function CaptionsOverlay({ isVisible }: CaptionsOverlayProps) {
  const room = useRoomContext();
  const [captions, setCaptions] = useState<CaptionEntry[]>([]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setCaptions((prev) =>
        prev.filter((c) => Date.now() - c.timestamp < 8000)
      );
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  useEffect(() => {
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: { name?: string; identity?: string }
    ) => {
      try {
        const data = JSON.parse(decoder.decode(payload));
        if (data.type === "caption") {
          setCaptions((prev) => [
            ...prev.slice(-5),
            {
              id: `${Date.now()}-${Math.random()}`,
              text: data.text,
              speaker: data.speaker || participant?.name || "Unknown",
              timestamp: Date.now(),
            },
          ]);
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

  if (!isVisible || captions.length === 0) return null;

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 w-[80%] max-w-2xl pointer-events-none">
      <div className="space-y-1">
        {captions.map((cap) => (
          <div
            key={cap.id}
            className="rounded-lg bg-black/80 px-4 py-2 backdrop-blur-sm text-center"
          >
            <span className="text-xs text-white/50 mr-2">{cap.speaker}:</span>
            <span className="text-sm text-white">{cap.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface CaptionsToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export function CaptionsToggle({ isActive, onToggle }: CaptionsToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center justify-center h-10 w-10 rounded-full transition-colors",
        isActive
          ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50 hover:bg-cyan-500/30"
          : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
      )}
      aria-label={isActive ? "Disable captions" : "Enable captions"}
    >
      <Subtitles className="h-5 w-5" />
    </button>
  );
}
