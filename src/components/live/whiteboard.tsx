"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  type TLRecord,
  type TldrawEditor,
} from "tldraw";
import "tldraw/tldraw.css";
import { PenLine, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhiteboardProps {
  isTeacher: boolean;
  userId: string;
  isVisible: boolean;
  onClose: () => void;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function Whiteboard({
  isTeacher,
  userId,
  isVisible,
  onClose,
}: WhiteboardProps) {
  const room = useRoomContext();
  const editorRef = useRef<TldrawEditor | null>(null);
  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils })
  );
  const isRemoteUpdate = useRef(false);

  const broadcastChanges = useCallback(
    (changes: { added?: Record<string, TLRecord>; updated?: Record<string, [TLRecord, TLRecord]>; removed?: Record<string, TLRecord> }) => {
      if (isRemoteUpdate.current) return;
      try {
        const payload = encoder.encode(
          JSON.stringify({
            type: "whiteboard-sync",
            changes: {
              added: changes.added ? Object.values(changes.added) : [],
              updated: changes.updated
                ? Object.values(changes.updated).map(([, after]) => after)
                : [],
              removed: changes.removed
                ? Object.values(changes.removed).map((r) => r.id)
                : [],
            },
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

  useEffect(() => {
    const unsub = store.listen(
      ({ changes }) => {
        broadcastChanges(changes);
      },
      { source: "user", scope: "document" }
    );

    return unsub;
  }, [store, broadcastChanges]);

  useEffect(() => {
    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(decoder.decode(payload));
        if (data.type !== "whiteboard-sync" || data.userId === userId) return;

        isRemoteUpdate.current = true;
        store.mergeRemoteChanges(() => {
          if (data.changes.added?.length) {
            for (const record of data.changes.added) {
              store.put([record]);
            }
          }
          if (data.changes.updated?.length) {
            for (const record of data.changes.updated) {
              store.put([record]);
            }
          }
          if (data.changes.removed?.length) {
            for (const id of data.changes.removed) {
              if (store.has(id as any)) {
                store.remove([id as any]);
              }
            }
          }
        });
        isRemoteUpdate.current = false;
      } catch {
        isRemoteUpdate.current = false;
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, store, userId]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-20 bg-white dark:bg-[#1e1e1e]">
      <div className="absolute top-2 right-2 z-30 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 rounded-lg bg-black/70 px-3 py-1.5 text-xs text-white hover:bg-black/80 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Close
        </button>
      </div>
      <Tldraw
        store={store}
        onMount={(editor) => {
          editorRef.current = editor;
          if (!isTeacher) {
            editor.updateInstanceState({ isReadonly: true });
          }
        }}
        autoFocus
      />
    </div>
  );
}

interface WhiteboardToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export function WhiteboardToggle({ isActive, onToggle }: WhiteboardToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center justify-center h-10 w-10 rounded-full transition-colors",
        isActive
          ? "bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/50 hover:bg-violet-500/30"
          : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/20"
      )}
      aria-label={isActive ? "Close whiteboard" : "Open whiteboard"}
    >
      <PenLine className="h-5 w-5" />
    </button>
  );
}
