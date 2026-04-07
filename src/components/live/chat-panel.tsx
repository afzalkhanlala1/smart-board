"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind, RoomEvent } from "livekit-client";
import { Send, MessageSquare, Paperclip, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  type: "TEXT" | "SYSTEM" | "HAND_RAISE" | "FILE";
  createdAt: string;
  fileName?: string;
  fileUrl?: string;
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
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            fileName: data.fileName,
            fileUrl: data.fileUrl,
          };
          setMessages((prev) => [...prev, msg]);
        }
      } catch {
        // Ignore non-JSON data messages
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
          }).catch((err) => {
            console.error("Failed to persist chat message:", err);
          });
        }
      } catch (err) {
        console.error("Failed to send message:", err);
      } finally {
        setIsSending(false);
      }
    },
    [input, isSending, userId, userName, room, liveSessionId]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be under 10MB");
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        const { path: filePath } = await uploadRes.json();
        const fileUrl = `/api/files/${filePath}`;

        const localMsg: ChatMessage = {
          id: `local-${Date.now()}`,
          userId,
          userName,
          content: file.name,
          type: "FILE",
          createdAt: new Date().toISOString(),
          fileName: file.name,
          fileUrl,
        };
        setMessages((prev) => [...prev, localMsg]);

        const payload = encoder.encode(
          JSON.stringify({
            type: "chat",
            content: file.name,
            userName,
            messageType: "FILE",
            fileName: file.name,
            fileUrl,
          })
        );
        await room.localParticipant.publishData(payload, { reliable: true });

        if (liveSessionId) {
          fetch("/api/livekit/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              liveSessionId,
              content: JSON.stringify({ fileName: file.name, fileUrl }),
              type: "FILE",
            }),
          }).catch((err) => {
            console.error("Failed to persist file message:", err);
          });
        }

        toast.success("File shared");
      } catch {
        toast.error("Failed to upload file");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [userId, userName, room, liveSessionId]
  );

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <MessageSquare className="h-4 w-4 text-white/40" />
        <span className="text-sm font-medium text-white/80">Chat</span>
        <span className="text-xs text-white/30">({messages.length})</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-white/25">No messages yet</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.type === "SYSTEM" ? (
              <div className="my-2 text-center">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/40">
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
                  "group rounded-lg px-3 py-1.5 hover:bg-white/5",
                  msg.userId === userId && "bg-white/[0.03]"
                )}
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      msg.userId === userId
                        ? "text-emerald-400"
                        : "text-white/70"
                    )}
                  >
                    {msg.userId === userId ? "You" : msg.userName}
                  </span>
                  <span className="text-[10px] text-white/25">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                {msg.type === "FILE" && msg.fileUrl ? (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-sky-400 shrink-0" />
                    <span className="flex-1 truncate">
                      {msg.fileName || msg.content}
                    </span>
                    <Download className="h-3.5 w-3.5 text-white/40 shrink-0" />
                  </a>
                ) : (
                  <p className="text-sm text-white/80 break-words">
                    {msg.content}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="flex gap-2 border-t border-white/10 px-3 py-2.5"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center justify-center h-9 w-9 shrink-0 rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors"
          title="Share file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="inline-flex items-center justify-center h-9 w-9 shrink-0 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
