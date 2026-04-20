"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { Timer, Play, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SessionTimerProps {
  isTeacher: boolean;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function SessionTimer({ isTeacher }: SessionTimerProps) {
  const room = useRoomContext();
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [inputMinutes, setInputMinutes] = useState("5");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            toast.info("Timer finished!");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, seconds]);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === "timer-start") {
          setSeconds(data.seconds);
          setIsRunning(true);
        }

        if (data.type === "timer-stop") {
          setIsRunning(false);
        }

        if (data.type === "timer-reset") {
          setIsRunning(false);
          setSeconds(0);
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

  const startTimer = useCallback(async () => {
    const totalSeconds = Math.max(1, parseInt(inputMinutes) || 5) * 60;
    setSeconds(totalSeconds);
    setIsRunning(true);

    try {
      const payload = encoder.encode(
        JSON.stringify({ type: "timer-start", seconds: totalSeconds })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
    } catch {
      // best-effort
    }
  }, [room, inputMinutes]);

  const stopTimer = useCallback(async () => {
    setIsRunning(false);
    try {
      const payload = encoder.encode(
        JSON.stringify({ type: "timer-stop" })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
    } catch {
      // best-effort
    }
  }, [room]);

  const resetTimer = useCallback(async () => {
    setIsRunning(false);
    setSeconds(0);
    try {
      const payload = encoder.encode(
        JSON.stringify({ type: "timer-reset" })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
    } catch {
      // best-effort
    }
  }, [room]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isTeacher && !isRunning && seconds === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {isRunning || seconds > 0 ? (
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-bold ${
            seconds <= 10 && isRunning
              ? "bg-red-500/20 text-red-400 animate-pulse"
              : "bg-white/10 text-white/80"
          }`}
        >
          <Timer className="h-3.5 w-3.5" />
          {formatTime(seconds)}
        </div>
      ) : null}

      {isTeacher && (
        <>
          {!isRunning && seconds === 0 && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="120"
                value={inputMinutes}
                onChange={(e) => setInputMinutes(e.target.value)}
                className="w-12 rounded border border-white/10 bg-white/5 px-1.5 py-1 text-xs text-white text-center outline-none focus:border-white/20"
              />
              <span className="text-xs text-white/40">min</span>
              <button
                type="button"
                onClick={startTimer}
                className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                aria-label="Start timer"
              >
                <Play className="h-3 w-3" />
              </button>
            </div>
          )}
          {isRunning && (
            <button
              type="button"
              onClick={stopTimer}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              aria-label="Stop timer"
            >
              <Square className="h-3 w-3" />
            </button>
          )}
          {!isRunning && seconds > 0 && (
            <button
              type="button"
              onClick={resetTimer}
              className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
              aria-label="Reset timer"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
