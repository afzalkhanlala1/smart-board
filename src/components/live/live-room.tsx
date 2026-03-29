"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  useRoomContext,
  useTracks,
  useParticipants,
  useLocalParticipant,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RoomEvent } from "livekit-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  Users,
  Radio,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatPanel } from "@/components/live/chat-panel";
import { RaiseHand } from "@/components/live/raise-hand";
import { toast } from "sonner";

interface LiveRoomProps {
  lectureId: string;
  roomName: string;
  userName: string;
  userId: string;
  isTeacher: boolean;
  courseTitle: string;
  lectureTitle: string;
  liveSessionId?: string;
}

export function LiveRoom({
  lectureId,
  roomName,
  userName,
  userId,
  isTeacher,
  courseTitle,
  lectureTitle,
  liveSessionId: initialSessionId,
}: LiveRoomProps) {
  const [token, setToken] = useState<string>("");
  const [liveSessionId, setLiveSessionId] = useState(initialSessionId ?? "");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lectureId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to get token");
        }

        const data = await res.json();
        setToken(data.token);
        setLiveSessionId(data.liveSessionId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to connect");
      } finally {
        setIsLoading(false);
      }
    }

    fetchToken();
  }, [lectureId]);

  if (isLoading) {
    return <LiveRoomSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive text-lg font-medium">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      options={{
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: true,
        },
      }}
      onDisconnected={() => {
        toast.info("Disconnected from the live session");
      }}
      onError={(err) => {
        console.error("LiveKit error:", err);
        toast.error("Connection error occurred");
      }}
    >
      <RoomContent
        lectureId={lectureId}
        roomName={roomName}
        userName={userName}
        userId={userId}
        isTeacher={isTeacher}
        courseTitle={courseTitle}
        lectureTitle={lectureTitle}
        liveSessionId={liveSessionId}
      />
    </LiveKitRoom>
  );
}

interface RoomContentProps {
  lectureId: string;
  roomName: string;
  userName: string;
  userId: string;
  isTeacher: boolean;
  courseTitle: string;
  lectureTitle: string;
  liveSessionId: string;
}

function RoomContent({
  lectureId,
  roomName,
  userName,
  userId,
  isTeacher,
  courseTitle,
  lectureTitle,
  liveSessionId,
}: RoomContentProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [sessionActive, setSessionActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const screenShareTrack = tracks.find(
    (t) => t.source === Track.Source.ScreenShare && t.publication
  );

  const remoteCameraTrack = tracks.find(
    (t) =>
      t.source === Track.Source.Camera &&
      t.publication &&
      t.participant.identity !== localParticipant.identity
  );

  const localCameraTrack = tracks.find(
    (t) =>
      t.source === Track.Source.Camera &&
      t.publication &&
      t.participant.identity === localParticipant.identity
  );

  // Priority: screen share > remote camera > local camera (so teacher sees themselves)
  const primaryTrack = screenShareTrack || remoteCameraTrack || localCameraTrack;

  const handleStartSession = useCallback(async () => {
    setIsStarting(true);
    try {
      const res = await fetch("/api/livekit/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start session");
      }

      setSessionActive(true);
      toast.success("Live session started");

      await localParticipant.setCameraEnabled(true);
      await localParticipant.setMicrophoneEnabled(true);
      setIsCameraOff(false);
      setIsMuted(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start");
    } finally {
      setIsStarting(false);
    }
  }, [lectureId, localParticipant]);

  const handleEndSession = useCallback(async () => {
    setIsEnding(true);
    try {
      const res = await fetch("/api/livekit/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to end session");
      }

      setSessionActive(false);
      toast.success("Live session ended");
      await localParticipant.setCameraEnabled(false);
      await localParticipant.setMicrophoneEnabled(false);
      setIsCameraOff(true);
      setIsMuted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to end");
    } finally {
      setIsEnding(false);
    }
  }, [lectureId, localParticipant]);

  const toggleMic = useCallback(async () => {
    await localParticipant.setMicrophoneEnabled(isMuted);
    setIsMuted(!isMuted);
  }, [localParticipant, isMuted]);

  const toggleCamera = useCallback(async () => {
    await localParticipant.setCameraEnabled(isCameraOff);
    setIsCameraOff(!isCameraOff);
  }, [localParticipant, isCameraOff]);

  const toggleScreenShare = useCallback(async () => {
    await localParticipant.setScreenShareEnabled(!isScreenSharing);
    setIsScreenSharing(!isScreenSharing);
  }, [localParticipant, isScreenSharing]);

  useEffect(() => {
    const handleTrackMuted = () => {
      setIsMuted(!localParticipant.isMicrophoneEnabled);
      setIsCameraOff(!localParticipant.isCameraEnabled);
    };

    room.on(RoomEvent.TrackMuted, handleTrackMuted);
    room.on(RoomEvent.TrackUnmuted, handleTrackMuted);
    room.on(RoomEvent.LocalTrackPublished, handleTrackMuted);

    return () => {
      room.off(RoomEvent.TrackMuted, handleTrackMuted);
      room.off(RoomEvent.TrackUnmuted, handleTrackMuted);
      room.off(RoomEvent.LocalTrackPublished, handleTrackMuted);
    };
  }, [room, localParticipant]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#0a0f1a]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0d1320] px-4 py-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/50 hover:text-white hover:bg-white/10"
            asChild
          >
            <Link href={`/courses/${lectureId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-sm font-semibold text-white">
              Live: {lectureTitle}
            </h1>
            <p className="text-xs text-white/50">{courseTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sessionActive && (
            <Badge variant="destructive" className="animate-pulse gap-1.5">
              <Radio className="h-3 w-3" />
              LIVE
            </Badge>
          )}
          <Badge className="gap-1.5 bg-white/10 text-white/80 border-white/10 hover:bg-white/15">
            <Users className="h-3 w-3" />
            {participants.length}
          </Badge>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className="flex flex-1 flex-col">
          <div className="relative flex flex-1 items-center justify-center bg-[#0a0e17]">
            {primaryTrack && primaryTrack.publication ? (
              <VideoTrack
                trackRef={primaryTrack as any}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-white/30">
                <Video className="h-16 w-16" />
                <p className="text-lg">
                  {isTeacher
                    ? sessionActive
                      ? "Your camera is off"
                      : "Start the session to begin broadcasting"
                    : "Waiting for the teacher to start..."}
                </p>
              </div>
            )}
          </div>

          {/* Controls bar */}
          <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-[#0d1320] px-4 py-3">
            {isTeacher ? (
              <>
                {!sessionActive ? (
                  <Button
                    onClick={handleStartSession}
                    disabled={isStarting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isStarting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Radio className="mr-2 h-4 w-4" />
                    )}
                    Start Session
                  </Button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`inline-flex items-center justify-center h-10 w-10 rounded-full transition-colors ${
                        isMuted
                          ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50 hover:bg-red-500/30"
                          : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                      }`}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? (
                        <MicOff className="h-5 w-5" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className={`inline-flex items-center justify-center h-10 w-10 rounded-full transition-colors ${
                        isCameraOff
                          ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50 hover:bg-red-500/30"
                          : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                      }`}
                      aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
                    >
                      {isCameraOff ? (
                        <VideoOff className="h-5 w-5" />
                      ) : (
                        <Video className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={toggleScreenShare}
                      className={`inline-flex items-center justify-center h-10 w-10 rounded-full transition-colors ${
                        isScreenSharing
                          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50 hover:bg-emerald-500/30"
                          : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
                      }`}
                      aria-label={isScreenSharing ? "Stop sharing" : "Share screen"}
                    >
                      <MonitorUp className="h-5 w-5" />
                    </button>
                    <div className="mx-2 h-6 w-px bg-white/10" />
                    <Button
                      variant="destructive"
                      onClick={handleEndSession}
                      disabled={isEnding}
                      className="rounded-full px-5"
                    >
                      {isEnding ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <PhoneOff className="mr-2 h-4 w-4" />
                      )}
                      End Session
                    </Button>
                  </>
                )}
              </>
            ) : (
              <RaiseHand
                lectureId={lectureId}
                userId={userId}
                userName={userName}
                isTeacher={false}
              />
            )}
          </div>
        </div>

        {/* Right sidebar: Chat + Raise Hand (teacher) */}
        <div className="flex w-80 flex-col border-l border-white/10 bg-[#0d1320] lg:w-96">
          {isTeacher && (
            <RaiseHand
              lectureId={lectureId}
              userId={userId}
              userName={userName}
              isTeacher={true}
            />
          )}
          <ChatPanel
            lectureId={lectureId}
            liveSessionId={liveSessionId}
            userId={userId}
            userName={userName}
          />
        </div>
      </div>
    </div>
  );
}

function LiveRoomSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-[#0a0f1a]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0d1320] px-4 py-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded bg-white/5" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-40 bg-white/5" />
            <Skeleton className="h-3 w-24 bg-white/5" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 bg-white/5" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 items-center justify-center bg-[#0a0e17]">
          <Loader2 className="h-12 w-12 animate-spin text-white/20" />
        </div>
        <div className="w-80 border-l border-white/10 bg-[#0d1320] lg:w-96">
          <Skeleton className="m-3 h-full bg-white/5" />
        </div>
      </div>
    </div>
  );
}
