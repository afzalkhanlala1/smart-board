"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind, RoomEvent } from "livekit-client";
import { Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  type: "TEXT" | "SYSTEM" | "HAND_RAISE";
  createdAt: string;
}

interface ChatPanelProps {
  lectureId: string;
  liveSessionId: string;
  userId: string;
  userName: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function ChatPanel({
  lectureId,
  liveSessionId,
  userId,
  userName,
}: ChatPanelProps) {
  const room = useRoomContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/livekit/chat?lectureId=${lectureId}`);
        if (res.ok) {
          const data = await res.json();
          const formatted: ChatMessage[] = data.map(
            (m: {
              id: string;
              userId: string;
              user: { name: string };
              content: string;
              type: "TEXT" | "SYSTEM" | "HAND_RAISE";
              createdAt: string;
            }) => ({
              id: m.id,
              userId: m.userId,
              userName: m.user.name,
              content: m.content,
              type: m.type,
              createdAt: m.createdAt,
            })
          );
          setMessages(formatted);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    }

    loadMessages();
  }, [lectureId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleDataReceived = (
      payload: Uint8Array,
      participant?: { identity?: string; name?: string }
    ) => {
      try {
        const decoded = decoder.decode(payload);
        const data = JSON.parse(decoded);

        if (data.type === "chat") {
          const msg: ChatMessage = {
            id: `${Date.now()}-${Math.random()}`,
            userId: participant?.identity || "unknown",
            userName: data.userName || participant?.name || "Unknown",
            content: data.content,
            type: data.messageType || "TEXT",
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, msg]);
        }
      } catch {
        // Ignore non-JSON data messages (e.g. raise-hand signals)
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || isSending) return;

      setIsSending(true);
      setInput("");

      const localMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        userId,
        userName,
        content: trimmed,
        type: "TEXT",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, localMsg]);

      try {
        const payload = encoder.encode(
          JSON.stringify({
            type: "chat",
            content: trimmed,
            userName,
            messageType: "TEXT",
          })
        );
        await room.localParticipant.publishData(payload, {
          reliable: true,
        });

        if (liveSessionId) {
          fetch("/api/livekit/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              liveSessionId,
              content: trimmed,
              type: "TEXT",
            }),
          }).catch(() => {});
        }
      } catch (err) {
        console.error("Failed to send message:", err);
      } finally {
        setIsSending(false);
      }
    },
    [input, isSending, userId, userName, room, liveSessionId]
  );

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-gray-800 px-4 py-2.5">
        <MessageSquare className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-200">Chat</span>
        <span className="text-xs text-gray-500">({messages.length})</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-gray-500">No messages yet</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.type === "SYSTEM" ? (
              <div className="my-2 text-center">
                <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-400">
                  {msg.content}
                </span>
              </div>
            ) : msg.type === "HAND_RAISE" ? (
              <div className="my-2 text-center">
                <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                  ✋ {msg.userName} raised their hand
                </span>
              </div>
            ) : (
              <div
                className={cn(
                  "group rounded-lg px-3 py-1.5 hover:bg-gray-800/50",
                  msg.userId === userId && "bg-gray-800/30"
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      msg.userId === userId
                        ? "text-emerald-400"
                        : "text-gray-300"
                    )}
                  >
                    {msg.userId === userId ? "You" : msg.userName}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-300 break-words">
                  {msg.content}
                </p>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t border-gray-800 px-3 py-2.5"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border-gray-700 bg-gray-800 text-gray-200 placeholder:text-gray-500 focus-visible:ring-gray-600"
          maxLength={2000}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || isSending}
          className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
