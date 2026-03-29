"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { Hand, Mic, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RaisedHand {
  participantId: string;
  participantName: string;
  timestamp: number;
}

interface RaiseHandProps {
  lectureId: string;
  userId: string;
  userName: string;
  isTeacher: boolean;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function RaiseHand({
  lectureId,
  userId,
  userName,
  isTeacher,
}: RaiseHandProps) {
  const room = useRoomContext();
  const [handRaised, setHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState<RaisedHand[]>([]);
  const [grantingId, setGrantingId] = useState<string | null>(null);

  useEffect(() => {
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: { identity?: string; name?: string }
    ) => {
      try {
        const decoded = decoder.decode(payload);
        const data = JSON.parse(decoded);

        if (data.type === "hand-raise") {
          const hand: RaisedHand = {
            participantId: participant?.identity || data.participantId,
            participantName: data.participantName || participant?.name || "Unknown",
            timestamp: Date.now(),
          };

          setRaisedHands((prev) => {
            const exists = prev.find(
              (h) => h.participantId === hand.participantId
            );
            if (exists) return prev;
            return [...prev, hand];
          });
        }

        if (data.type === "hand-lower") {
          const id = participant?.identity || data.participantId;
          setRaisedHands((prev) =>
            prev.filter((h) => h.participantId !== id)
          );
        }

        if (data.type === "hand-dismissed" && data.participantId === userId) {
          setHandRaised(false);
          toast.info("Your hand was dismissed by the teacher");
        }

        if (data.type === "hand-accepted" && data.participantId === userId) {
          setHandRaised(false);
          toast.success("You can now speak! Your microphone has been enabled.");
        }
      } catch {
        // Ignore non-JSON data
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, userId]);

  const raiseHand = useCallback(async () => {
    try {
      const payload = encoder.encode(
        JSON.stringify({
          type: "hand-raise",
          participantId: userId,
          participantName: userName,
        })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
      setHandRaised(true);
    } catch (err) {
      console.error("Failed to raise hand:", err);
      toast.error("Failed to raise hand");
    }
  }, [room, userId, userName]);

  const lowerHand = useCallback(async () => {
    try {
      const payload = encoder.encode(
        JSON.stringify({
          type: "hand-lower",
          participantId: userId,
        })
      );
      await room.localParticipant.publishData(payload, { reliable: true });
      setHandRaised(false);
    } catch (err) {
      console.error("Failed to lower hand:", err);
    }
  }, [room, userId]);

  const allowToSpeak = useCallback(
    async (participantId: string) => {
      setGrantingId(participantId);
      try {
        const res = await fetch("/api/livekit/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lectureId,
            participantId,
            canPublish: true,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to grant permission");
        }

        const payload = encoder.encode(
          JSON.stringify({
            type: "hand-accepted",
            participantId,
          })
        );
        await room.localParticipant.publishData(payload, { reliable: true });

        setRaisedHands((prev) =>
          prev.filter((h) => h.participantId !== participantId)
        );
        toast.success("Speak permission granted");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to grant permission");
      } finally {
        setGrantingId(null);
      }
    },
    [lectureId, room]
  );

  const dismissHand = useCallback(
    async (participantId: string) => {
      try {
        const payload = encoder.encode(
          JSON.stringify({
            type: "hand-dismissed",
            participantId,
          })
        );
        await room.localParticipant.publishData(payload, { reliable: true });

        setRaisedHands((prev) =>
          prev.filter((h) => h.participantId !== participantId)
        );
      } catch (err) {
        console.error("Failed to dismiss hand:", err);
      }
    },
    [room]
  );

  const revokeSpeak = useCallback(
    async (participantId: string) => {
      try {
        await fetch("/api/livekit/session", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lectureId,
            participantId,
            canPublish: false,
          }),
        });
        toast.info("Speak permission revoked");
      } catch {
        toast.error("Failed to revoke permission");
      }
    },
    [lectureId]
  );

  if (!isTeacher) {
    return (
      <Button
        variant="outline"
        onClick={handRaised ? lowerHand : raiseHand}
        className={cn(
          "gap-2",
          handRaised
            ? "border-yellow-500 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 hover:text-yellow-300"
            : "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
        )}
      >
        <Hand
          className={cn("h-4 w-4", handRaised && "animate-bounce")}
        />
        {handRaised ? "Lower Hand" : "Raise Hand"}
      </Button>
    );
  }

  if (raisedHands.length === 0) return null;

  return (
    <div className="border-b border-gray-800">
      <div className="flex items-center gap-2 px-4 py-2">
        <Hand className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-medium text-gray-200">Raised Hands</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {raisedHands.length}
        </Badge>
      </div>
      <div className="max-h-40 overflow-y-auto px-3 pb-2 space-y-1">
        {raisedHands.map((hand) => (
          <div
            key={hand.participantId}
            className="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Hand className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-sm text-gray-300 truncate max-w-[120px]">
                {hand.participantName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => allowToSpeak(hand.participantId)}
                disabled={grantingId === hand.participantId}
                className="h-7 gap-1 px-2 text-xs text-green-400 hover:bg-green-500/20 hover:text-green-300"
              >
                {grantingId === hand.participantId ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Mic className="h-3 w-3" />
                )}
                Allow
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissHand(hand.participantId)}
                className="h-7 w-7 p-0 text-gray-500 hover:bg-red-500/20 hover:text-red-400"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
