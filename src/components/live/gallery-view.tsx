"use client";

import {
  VideoTrack,
  useTracks,
  useParticipants,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryViewProps {
  isActive: boolean;
}

export function GalleryView({ isActive }: GalleryViewProps) {
  const participants = useParticipants();
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  );

  if (!isActive) return null;

  const cols =
    participants.length <= 1
      ? 1
      : participants.length <= 4
      ? 2
      : participants.length <= 9
      ? 3
      : 4;

  return (
    <div
      className={cn(
        "absolute inset-0 z-10 grid gap-1 p-2 bg-[#0a0e17]"
      )}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
      }}
    >
      {tracks.map((trackRef) => {
        const hasVideo = trackRef.publication && !trackRef.publication.isMuted;
        const name =
          trackRef.participant.name || trackRef.participant.identity;

        return (
          <div
            key={trackRef.participant.identity}
            className="relative rounded-lg overflow-hidden bg-[#0d1320] border border-white/10 flex items-center justify-center"
          >
            {hasVideo ? (
              <VideoTrack
                trackRef={trackRef as any}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-white/30" />
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
              <p className="text-xs text-white/80 truncate">{name}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
