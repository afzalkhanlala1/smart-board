"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onProgress?: (percent: number) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function VideoPlayer({ videoUrl, title, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowVolumeSlider(false);
      }
    }, 3000);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    setVolume(val);
    if (val === 0) {
      v.muted = true;
      setIsMuted(true);
    } else if (v.muted) {
      v.muted = false;
      setIsMuted(false);
    }
  }, []);

  const handleSpeedChange = useCallback((speed: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    setPlaybackRate(speed);
    setShowSpeedMenu(false);
  }, []);

  const seek = useCallback((clientX: number) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pct * videoRef.current.duration;
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const skipBack = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
  }, []);

  const skipForward = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      videoRef.current.duration,
      videoRef.current.currentTime + 10
    );
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      if (v.duration && onProgress) {
        onProgress((v.currentTime / v.duration) * 100);
      }
    };
    const onLoaded = () => setDuration(v.duration);
    const onPlay = () => { setIsPlaying(true); resetHideTimer(); };
    const onPause = () => { setIsPlaying(false); setShowControls(true); };
    const onBufferProgress = () => {
      if (v.buffered.length > 0 && v.duration) {
        setBufferedPercent((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
      }
    };

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("progress", onBufferProgress);

    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("progress", onBufferProgress);
    };
  }, [onProgress, resetHideTimer]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          skipBack();
          break;
        case "arrowright":
          e.preventDefault();
          skipForward();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, skipBack, skipForward, toggleMute, toggleFullscreen]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => seek(e.clientX);
    const onMouseUp = () => setIsDragging(false);

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, seek]);

  const playPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative group bg-black rounded-lg overflow-hidden select-none"
      onMouseMove={resetHideTimer}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
          setShowSpeedMenu(false);
        }
      }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full aspect-video cursor-pointer"
        onClick={togglePlay}
        playsInline
        title={title}
      />

      {/* Center play overlay */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors"
          aria-label="Play video"
        >
          <div className="bg-white/15 backdrop-blur-md rounded-full p-5 hover:bg-white/25 transition-colors">
            <Play className="h-12 w-12 text-white fill-white" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-3 px-4 transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-4 group/bar hover:h-2.5 transition-all"
          onMouseDown={(e) => {
            setIsDragging(true);
            seek(e.clientX);
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-white/25 rounded-full pointer-events-none"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full pointer-events-none"
            style={{ width: `${playPercent}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white scale-0 group-hover/bar:scale-100 transition-transform shadow-md" />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-1 text-white">
          <button
            onClick={togglePlay}
            className="hover:bg-white/15 rounded-md p-1.5 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 fill-white" />
            )}
          </button>

          <button
            onClick={skipBack}
            className="hover:bg-white/15 rounded-md p-1.5 transition-colors"
            aria-label="Skip back 10 seconds"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            onClick={skipForward}
            className="hover:bg-white/15 rounded-md p-1.5 transition-colors"
            aria-label="Skip forward 10 seconds"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          {/* Volume */}
          <div
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              onClick={toggleMute}
              className="hover:bg-white/15 rounded-md p-1.5 transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                showVolumeSlider ? "w-20 opacity-100 ml-1" : "w-0 opacity-0"
              )}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full h-1 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          <span className="text-xs tabular-nums text-white/80 ml-2 whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="text-xs font-medium px-2 py-1 hover:bg-white/15 rounded-md transition-colors"
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm rounded-lg py-1 shadow-2xl border border-white/10 min-w-[80px]">
                {SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={cn(
                      "block w-full text-xs px-4 py-1.5 text-left hover:bg-white/10 transition-colors",
                      playbackRate === speed
                        ? "text-emerald-400 font-medium"
                        : "text-white/80"
                    )}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download */}
          <a
            href={`${videoUrl}${videoUrl.includes("?") ? "&" : "?"}download=true`}
            className="hover:bg-white/15 rounded-md p-1.5 transition-colors"
            aria-label="Download video"
          >
            <Download className="h-4 w-4" />
          </a>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="hover:bg-white/15 rounded-md p-1.5 transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
