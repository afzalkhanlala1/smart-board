"use client";

import { useCallback, useState } from "react";
import { Circle, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RecordButtonProps {
  lectureId: string;
}

export function RecordButton({ lectureId }: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleRecording = useCallback(async () => {
    setIsLoading(true);
    try {
      const action = isRecording ? "stop" : "start";
      const res = await fetch("/api/livekit/recording", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lectureId, action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action} recording`);
      }

      setIsRecording(!isRecording);
      toast.success(
        isRecording ? "Recording stopped" : "Recording started"
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Recording operation failed"
      );
    } finally {
      setIsLoading(false);
    }
  }, [lectureId, isRecording]);

  return (
    <button
      type="button"
      onClick={toggleRecording}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center justify-center h-10 w-10 rounded-full transition-colors",
        isRecording
          ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50 hover:bg-red-500/30"
          : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
      )}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <Square className="h-4 w-4 fill-current" />
      ) : (
        <Circle className="h-5 w-5 fill-red-500 text-red-500" />
      )}
    </button>
  );
}
