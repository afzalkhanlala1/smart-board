"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import {
  Pencil,
  Circle,
  ArrowRight,
  Type,
  Eraser,
  X,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = "pen" | "circle" | "arrow" | "text" | "eraser";
type DrawPoint = { x: number; y: number };
type DrawElement = {
  id: string;
  tool: Tool;
  points: DrawPoint[];
  color: string;
  text?: string;
};

interface ScreenAnnotationProps {
  isTeacher: boolean;
  userId: string;
  isActive: boolean;
  onClose: () => void;
}

const COLORS = ["#ef4444", "#eab308", "#22c55e", "#3b82f6", "#ffffff"];
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function ScreenAnnotation({
  isTeacher,
  userId,
  isActive,
  onClose,
}: ScreenAnnotationProps) {
  const room = useRoomContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#ef4444");
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentElement = useRef<DrawElement | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const el of elements) {
      if (el.tool === "eraser") continue;
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (el.tool === "pen" && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(
          el.points[0].x * canvas.width,
          el.points[0].y * canvas.height
        );
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(
            el.points[i].x * canvas.width,
            el.points[i].y * canvas.height
          );
        }
        ctx.stroke();
      }

      if (el.tool === "circle" && el.points.length >= 2) {
        const [start, end] = el.points;
        const rx = Math.abs(end.x - start.x) * canvas.width;
        const ry = Math.abs(end.y - start.y) * canvas.height;
        ctx.beginPath();
        ctx.ellipse(
          start.x * canvas.width,
          start.y * canvas.height,
          rx,
          ry,
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }

      if (el.tool === "arrow" && el.points.length >= 2) {
        const [start, end] = el.points;
        const sx = start.x * canvas.width;
        const sy = start.y * canvas.height;
        const ex = end.x * canvas.width;
        const ey = end.y * canvas.height;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();

        const angle = Math.atan2(ey - sy, ex - sx);
        const headLen = 15;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - headLen * Math.cos(angle - Math.PI / 6),
          ey - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - headLen * Math.cos(angle + Math.PI / 6),
          ey - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }

      if (el.tool === "text" && el.text && el.points.length > 0) {
        ctx.font = "16px Inter, sans-serif";
        ctx.fillText(
          el.text,
          el.points[0].x * canvas.width,
          el.points[0].y * canvas.height
        );
      }
    }
  }, [elements]);

  useEffect(() => {
    redraw();
  }, [elements, redraw]);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(decoder.decode(payload));
        if (data.type === "annotation-sync" && data.userId !== userId) {
          setElements(data.elements);
        }
        if (data.type === "annotation-clear") {
          setElements([]);
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

  const broadcastElements = useCallback(
    (els: DrawElement[]) => {
      try {
        const payload = encoder.encode(
          JSON.stringify({
            type: "annotation-sync",
            elements: els,
            userId,
          })
        );
        room.localParticipant.publishData(payload, { reliable: true });
      } catch {
        // best-effort
      }
    },
    [room, userId]
  );

  const getRelativePos = (e: React.MouseEvent<HTMLCanvasElement>): DrawPoint => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTeacher) return;
    const pos = getRelativePos(e);

    if (tool === "text") {
      const text = prompt("Enter text:");
      if (text) {
        const el: DrawElement = {
          id: `${Date.now()}`,
          tool: "text",
          points: [pos],
          color,
          text,
        };
        const updated = [...elements, el];
        setElements(updated);
        broadcastElements(updated);
      }
      return;
    }

    if (tool === "eraser") {
      const threshold = 0.03;
      const filtered = elements.filter((el) => {
        return !el.points.some(
          (p) =>
            Math.abs(p.x - pos.x) < threshold &&
            Math.abs(p.y - pos.y) < threshold
        );
      });
      setElements(filtered);
      broadcastElements(filtered);
      return;
    }

    setIsDrawing(true);
    currentElement.current = {
      id: `${Date.now()}`,
      tool,
      points: [pos],
      color,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement.current || !isTeacher) return;
    const pos = getRelativePos(e);

    if (tool === "pen") {
      currentElement.current.points.push(pos);
    } else {
      currentElement.current.points = [currentElement.current.points[0], pos];
    }

    setElements((prev) => {
      const withoutCurrent = prev.filter(
        (el) => el.id !== currentElement.current!.id
      );
      return [...withoutCurrent, { ...currentElement.current! }];
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentElement.current) return;
    setIsDrawing(false);
    const final = [...elements.filter((el) => el.id !== currentElement.current!.id), currentElement.current];
    setElements(final);
    broadcastElements(final);
    currentElement.current = null;
  };

  const undo = () => {
    const updated = elements.slice(0, -1);
    setElements(updated);
    broadcastElements(updated);
  };

  if (!isActive) return null;

  const tools: { id: Tool; icon: React.ElementType; label: string }[] = [
    { id: "pen", icon: Pencil, label: "Pen" },
    { id: "circle", icon: Circle, label: "Circle" },
    { id: "arrow", icon: ArrowRight, label: "Arrow" },
    { id: "text", icon: Type, label: "Text" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
  ];

  return (
    <div className="absolute inset-0 z-15">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: isTeacher ? "crosshair" : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      {isTeacher && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 rounded-full bg-black/80 px-3 py-1.5 backdrop-blur-sm">
          {tools.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                tool === id
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              )}
              title={label}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <div className="mx-1 h-5 w-px bg-white/20" />
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-5 w-5 rounded-full border-2 transition-transform",
                color === c ? "border-white scale-125" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="mx-1 h-5 w-px bg-white/20" />
          <button
            type="button"
            onClick={undo}
            className="h-8 w-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Close annotations"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
