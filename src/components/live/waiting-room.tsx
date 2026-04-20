"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { Clock, Check, X, Users, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface WaitingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface WaitingRoomProps {
  lectureId: string;
  userId: string;
  userName: string;
  isTeacher: boolean;
  onAdmitted: () => void;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function WaitingRoom({
  lectureId,
  userId,
  userName,
  isTeacher,
  onAdmitted,
}: WaitingRoomProps) {
  const room = useRoomContext();
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([]);
  const [isWaiting, setIsWaiting] = useState(!isTeacher);
  const [admitted, setAdmitted] = useState(isTeacher);

  useEffect(() => {
    if (!isTeacher) {
      const payload = encoder.encode(
        JSON.stringify({
          type: "waiting-room-join",
          userId,
          userName,
        })
      );
      room.localParticipant.publishData(payload, { reliable: true }).catch(() => {});
    }
  }, [room, isTeacher, userId, userName]);

  useEffect(() => {
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: { identity?: string }
    ) => {
      try {
        const data = JSON.parse(decoder.decode(payload));

        if (data.type === "waiting-room-join" && isTeacher) {
          setWaitingUsers((prev) => {
            if (prev.find((u) => u.userId === data.userId)) return prev;
            return [
              ...prev,
              {
                userId: data.userId,
                userName: data.userName,
                timestamp: Date.now(),
              },
            ];
          });
        }

        if (data.type === "waiting-room-admit" && data.userId === userId) {
          setIsWaiting(false);
          setAdmitted(true);
          onAdmitted();
          toast.success("You have been admitted to the session");
        }

        if (data.type === "waiting-room-deny" && data.userId === userId) {
          setIsWaiting(false);
          toast.error("Your request to join was denied");
        }

        if (data.type === "waiting-room-admit-all" && !isTeacher) {
          setIsWaiting(false);
          setAdmitted(true);
          onAdmitted();
          toast.success("You have been admitted to the session");
        }
      } catch {
        // ignore
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, isTeacher, userId, onAdmitted]);

  const admitUser = useCallback(
    async (targetUserId: string) => {
      try {
        const payload = encoder.encode(
          JSON.stringify({
            type: "waiting-room-admit",
            userId: targetUserId,
          })
        );
        await room.localParticipant.publishData(payload, { reliable: true });
        setWaitingUsers((prev) =>
          prev.filter((u) => u.userId !== targetUserId)
        );
        toast.success("User admitted");
      } catch {
        toast.error("Failed to admit user");
      }
    },
    [room]
  );

  const denyUser = useCallback(
    async (targetUserId: string) => {
      try {
        const payload = encoder.encode(
          JSON.stringify({
            type: "waiting-room-deny",
            userId: targetUserId,
          })
        );
        await room.localParticipant.publishData(payload, { reliable: true });
        setWaitingUsers((prev) =>
          prev.filter((u) => u.userId !== targetUserId)
        );
      } catch {
        toast.error("Failed to deny user");
      }
    },
    [room]
  );

  const admitAll = useCallback(async () => {
    try {
      const payload = encoder.encode(
        JSON.stringify({ type: "waiting-room-admit-all" })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
      setWaitingUsers([]);
      toast.success("All users admitted");
    } catch {
      toast.error("Failed to admit all");
    }
  }, [room]);

  // Student waiting screen
  if (!isTeacher && isWaiting) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0a0f1a]">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white/40" />
          </div>
          <h2 className="text-lg font-semibold text-white">Waiting Room</h2>
          <p className="text-sm text-white/50 max-w-xs">
            Please wait for the teacher to admit you to the session.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-white/30">
            <Clock className="h-3.5 w-3.5" />
            Waiting to be admitted...
          </div>
        </div>
      </div>
    );
  }

  // Teacher waiting room management
  if (isTeacher && waitingUsers.length > 0) {
    return (
      <div className="border-b border-white/10">
        <div className="flex items-center gap-2 px-4 py-2">
          <Users className="h-4 w-4 text-sky-400" />
          <span className="text-sm font-medium text-white/80">
            Waiting Room
          </span>
          <Badge className="ml-auto text-xs bg-sky-500/20 text-sky-400 border-sky-500/30">
            {waitingUsers.length}
          </Badge>
          <button
            type="button"
            onClick={admitAll}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Admit All
          </button>
        </div>
        <div className="max-h-32 overflow-y-auto px-3 pb-2 space-y-1">
          {waitingUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
            >
              <span className="text-sm text-white/70 truncate max-w-[140px]">
                {user.userName}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => admitUser(user.userId)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Admit
                </button>
                <button
                  type="button"
                  onClick={() => denyUser(user.userId)}
                  className="inline-flex items-center justify-center h-6 w-6 rounded-md text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
