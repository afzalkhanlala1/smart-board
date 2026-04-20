"use client";

import { useCallback, useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { BackgroundBlur } from "@livekit/track-processors";
import {
  EyeOff,
  ImageIcon,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BgOption = "none" | "blur-light" | "blur-heavy";

interface VirtualBackgroundProps {
  isVisible: boolean;
  onClose: () => void;
}

const OPTIONS: { id: BgOption; label: string; icon: React.ElementType; description: string }[] = [
  { id: "none", label: "None", icon: X, description: "No background effect" },
  { id: "blur-light", label: "Light Blur", icon: EyeOff, description: "Subtle background blur" },
  { id: "blur-heavy", label: "Heavy Blur", icon: ImageIcon, description: "Strong background blur" },
];

export function VirtualBackground({ isVisible, onClose }: VirtualBackgroundProps) {
  const { localParticipant } = useLocalParticipant();
  const [selected, setSelected] = useState<BgOption>("none");
  const [isApplying, setIsApplying] = useState(false);

  const applyBackground = useCallback(
    async (option: BgOption) => {
      setIsApplying(true);
      try {
        const cameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
        const track = cameraPub?.track;

        if (!track) {
          toast.error("Camera must be enabled first");
          setIsApplying(false);
          return;
        }

        if (option === "none") {
          await track.stopProcessor();
        } else {
          const blurRadius = option === "blur-light" ? 10 : 20;
          const processor = BackgroundBlur(blurRadius);
          await track.setProcessor(processor);
        }

        setSelected(option);
        toast.success(
          option === "none" ? "Background effect removed" : "Background effect applied"
        );
      } catch (err) {
        console.error("Failed to apply background:", err);
        toast.error("Failed to apply background effect. Your browser may not support this feature.");
      } finally {
        setIsApplying(false);
      }
    },
    [localParticipant]
  );

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 w-72 rounded-xl border border-white/10 bg-[#0d1320] p-3 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white/80">Virtual Background</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-1.5">
        {OPTIONS.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            type="button"
            onClick={() => applyBackground(id)}
            disabled={isApplying}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
              selected === id
                ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                : "text-white/60 hover:bg-white/5 hover:text-white/80"
            )}
          >
            <div
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                selected === id ? "bg-emerald-500/20" : "bg-white/5"
              )}
            >
              {isApplying && selected !== id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : selected === id ? (
                <Check className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs opacity-60">{description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
