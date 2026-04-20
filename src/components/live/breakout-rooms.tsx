"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoomContext, useParticipants } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import {
  Users,
  Plus,
  Play,
  ArrowLeft,
  Clock,
  Megaphone,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BreakoutRoom {
  id: string;
  name: string;
  participants: string[];
}

interface BreakoutRoomsProps {
  lectureId: string;
  userId: string;
  isTeacher: boolean;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function BreakoutRooms({
  lectureId,
  userId,
  isTeacher,
}: BreakoutRoomsProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [timerMinutes, setTimerMinutes] = useState("10");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          toast.info("Breakout rooms time is up!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingSeconds]);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === "breakout-start") {
          setRooms(data.rooms);
          setIsActive(true);
          const myRoom = data.rooms.find((r: BreakoutRoom) =>
            r.participants.includes(userId)
          );
          if (myRoom) {
            setCurrentRoom(myRoom.id);
            toast.info(`You've been assigned to ${myRoom.name}`);
          }
          if (data.timerSeconds) {
            setRemainingSeconds(data.timerSeconds);
          }
        }

        if (data.type === "breakout-end") {
          setIsActive(false);
          setCurrentRoom(null);
          setRooms([]);
          setRemainingSeconds(0);
          toast.info("Breakout rooms ended. Returning to main session.");
        }

        if (data.type === "breakout-broadcast") {
          toast.info(`Teacher: ${data.message}`, { duration: 8000 });
        }
      } catch {
        // ignore
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, userId]);

  const createRooms = useCallback(
    (count: number) => {
      const nonTeachers = participants.filter(
        (p) => p.identity !== room.localParticipant.identity
      );
      const newRooms: BreakoutRoom[] = Array.from({ length: count }, (_, i) => ({
        id: `room-${i + 1}`,
        name: `Group ${i + 1}`,
        participants: [],
      }));

      nonTeachers.forEach((p, i) => {
        newRooms[i % count].participants.push(p.identity);
      });

      setRooms(newRooms);
    },
    [participants, room]
  );

  const startBreakout = useCallback(async () => {
    if (rooms.length === 0) {
      toast.error("Create rooms first");
      return;
    }

    const timerSeconds = Math.max(1, parseInt(timerMinutes) || 10) * 60;

    try {
      const payload = encoder.encode(
        JSON.stringify({
          type: "breakout-start",
          rooms,
          timerSeconds,
        })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
      setIsActive(true);
      setRemainingSeconds(timerSeconds);
      toast.success("Breakout rooms started");
    } catch {
      toast.error("Failed to start breakout rooms");
    }
  }, [room, rooms, timerMinutes]);

  const endBreakout = useCallback(async () => {
    try {
      const payload = encoder.encode(
        JSON.stringify({ type: "breakout-end" })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
      setIsActive(false);
      setCurrentRoom(null);
      setRooms([]);
      setRemainingSeconds(0);
      toast.success("Breakout rooms ended");
    } catch {
      toast.error("Failed to end breakout rooms");
    }
  }, [room]);

  const broadcast = useCallback(async () => {
    if (!broadcastMsg.trim()) return;
    try {
      const payload = encoder.encode(
        JSON.stringify({
          type: "breakout-broadcast",
          message: broadcastMsg,
        })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
      setBroadcastMsg("");
      toast.success("Message broadcast to all rooms");
    } catch {
      toast.error("Failed to broadcast");
    }
  }, [room, broadcastMsg]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Student view: show current breakout room assignment
  if (!isTeacher) {
    if (!isActive) return null;
    const myRoom = rooms.find((r) => r.participants.includes(userId));
    return (
      <div className="border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-medium text-violet-400">
            {myRoom?.name || "Main Room"}
          </span>
          {remainingSeconds > 0 && (
            <Badge className="ml-auto bg-white/10 text-white/70 text-xs border-white/10">
              <Clock className="h-3 w-3 mr-1" />
              {formatTimer(remainingSeconds)}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // Teacher view
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-2 hover:bg-white/5 transition-colors"
      >
        <Users className="h-4 w-4 text-violet-400" />
        <span className="text-sm font-medium text-white/80">Breakout Rooms</span>
        {isActive && (
          <Badge className="ml-1 bg-violet-500/20 text-violet-400 text-xs border-violet-500/30">
            Active
          </Badge>
        )}
        {isOpen ? (
          <ChevronUp className="h-3 w-3 text-white/40 ml-auto" />
        ) : (
          <ChevronDown className="h-3 w-3 text-white/40 ml-auto" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          {!isActive ? (
            <>
              <div className="flex gap-1">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => createRooms(n)}
                    className={cn(
                      "flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors",
                      rooms.length === n
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-white/5 text-white/50 hover:bg-white/10"
                    )}
                  >
                    {n} rooms
                  </button>
                ))}
              </div>

              {rooms.length > 0 && (
                <div className="space-y-1">
                  {rooms.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs"
                    >
                      <span className="text-white/60 font-medium">{r.name}</span>
                      <span className="text-white/30 ml-1">
                        ({r.participants.length} participant
                        {r.participants.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(e.target.value)}
                  className="w-14 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white text-center outline-none"
                />
                <span className="text-xs text-white/40">min</span>
                <Button
                  size="sm"
                  onClick={startBreakout}
                  disabled={rooms.length === 0}
                  className="ml-auto bg-violet-600 hover:bg-violet-700 text-white h-7 text-xs"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Start
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs flex items-center justify-between"
                  >
                    <span className="text-white/60 font-medium">{r.name}</span>
                    <span className="text-white/30">
                      {r.participants.length}
                    </span>
                  </div>
                ))}
              </div>

              {remainingSeconds > 0 && (
                <div className="text-center">
                  <Badge className="bg-white/10 text-white/70 text-xs border-white/10">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimer(remainingSeconds)} remaining
                  </Badge>
                </div>
              )}

              <div className="flex gap-1">
                <input
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Broadcast message..."
                  className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder:text-white/30 outline-none"
                  onKeyDown={(e) => e.key === "Enter" && broadcast()}
                />
                <button
                  type="button"
                  onClick={broadcast}
                  className="rounded bg-white/10 px-2 py-1 text-xs text-white/60 hover:bg-white/20 transition-colors"
                >
                  <Megaphone className="h-3 w-3" />
                </button>
              </div>

              <Button
                size="sm"
                variant="destructive"
                onClick={endBreakout}
                className="w-full h-7 text-xs"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                End Breakout Rooms
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
