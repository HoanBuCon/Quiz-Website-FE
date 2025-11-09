import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getToken } from "../utils/auth";
import { ChatAPI, getApiBaseUrl } from "../utils/api";

interface ChatMessage {
  id: string;
  userId: string;
  content?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: "image" | "video" | "file" | null;
  createdAt: string;
  user?: { id: string; name?: string | null; email: string };
}

const ChatBox: React.FC = () => {
  const [open, setOpen] = useState(false);
  const openRef = useRef<boolean>(false);
  useEffect(() => { openRef.current = open; }, [open]);
  const openChat = () => { if (!openRef.current) setOpen(true); };
  const closeChat = () => { if (openRef.current) setOpen(false); };
  const toggleChat = () => setOpen((v) => !v);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Event-based open/close so Header can trigger
  useEffect(() => {
    const handleChatOpen: EventListener = () => openChat();
    const handleChatClose: EventListener = () => closeChat();
    const handleChatToggle: EventListener = () => toggleChat();

    window.addEventListener("chat:open", handleChatOpen);
    window.addEventListener("chat:close", handleChatClose);
    window.addEventListener("chat:toggle", handleChatToggle);

    return () => {
      window.removeEventListener("chat:open", handleChatOpen);
      window.removeEventListener("chat:close", handleChatClose);
      window.removeEventListener("chat:toggle", handleChatToggle);
    };
  }, []);

  const token = useMemo(() => getToken(), []);
  const currentUserId = useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.sub || null;
    } catch {
      return null;
    }
  }, [token]);

  // Merge helper to avoid flicker (do not replace entire list)
  const mergeMessages = (prev: ChatMessage[], incoming: ChatMessage[]) => {
    const map = new Map<string, ChatMessage>();
    for (const m of prev) map.set(m.id, m);
    for (const m of incoming) map.set(m.id, m);
    return Array.from(map.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  // Flag to track if we've done initial load
  const hasLoadedRef = useRef(false);

  async function loadRecent() {
    if (!token) return;
    try {
      const data = await ChatAPI.list({ limit: 50 }, token);
      setMessages((prev) => mergeMessages(prev, data));
      // Scroll to bottom on initial load only
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        requestAnimationFrame(() => {
          listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "auto" });
        });
      }
    } catch (e) {
      // no-op
    }
  }

  useEffect(() => {
    if (!open || !token) return;
    
    (async () => {
      await loadRecent();
      
      // Setup EventSource only once
      if (!esRef.current) {
        const url = `${getApiBaseUrl()}/chat/stream?token=${encodeURIComponent(token)}`;
        const es = new EventSource(url);
        es.addEventListener("message", (ev) => {
          try {
            const msg = JSON.parse((ev as MessageEvent).data);
            setMessages((prev) => mergeMessages(prev, [msg]));
            // Only smooth scroll for new messages, debounced
            setTimeout(() => {
              if (listRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = listRef.current;
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
                if (isNearBottom) {
                  listRef.current.scrollTo({ top: scrollHeight, behavior: "smooth" });
                }
              }
            }, 50);
          } catch {}
        });
        esRef.current = es;
      }
    })();
    
    return () => {
      // Cleanup when closing chat
      if (!open && esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [open, token]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!input.trim() && !file) return;
    if (file && file.size > 10 * 1024 * 1024) {
      alert("Giới hạn tệp là 10MB");
      return;
    }
    try {
      setLoading(true);
      const created = await ChatAPI.send({ content: input.trim() || undefined, file: file || undefined }, token);
      // Rely on SSE broadcast to append the message, avoid duplicate
      setInput("");
      setFile(null);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await ChatAPI.remove(id, token);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {}
  };

  const renderAttachment = (m: ChatMessage) => {
    if (!m.attachmentUrl) return null;
    const API_BASE = getApiBaseUrl().replace(/\/$/, "");
    const primaryUrl = m.attachmentUrl.startsWith("http")
      ? m.attachmentUrl
      : `${API_BASE}${m.attachmentUrl}`;
    const fallbackUrl = m.attachmentUrl; // absolute path for Apache (prod) or express static (dev) without /api

    if (m.attachmentType === "image") {
      return (
        <a href={primaryUrl} target="_blank" rel="noreferrer">
          <img
            src={primaryUrl}
            alt="attachment"
            className="max-h-48 rounded-md"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (img.src !== fallbackUrl) img.src = fallbackUrl;
            }}
          />
        </a>
      );
    }
    if (m.attachmentType === "video") {
      return (
        <video controls preload="metadata" className="max-h-60 rounded-md bg-black/10">
          <source
            src={primaryUrl}
            onError={(e) => {
              const source = e.currentTarget as HTMLSourceElement;
              if (source.src !== fallbackUrl) {
                source.src = fallbackUrl;
                const video = source.parentElement as HTMLVideoElement | null;
                video?.load();
              }
            }}
          />
        </video>
      );
    }
    const fileUrl = primaryUrl;
    const fileName = (m.attachmentUrl.split("/").pop() || "Tệp").split("?")[0];
    return (
      <a
        href={fileUrl}
        className="inline-flex items-center gap-2 text-blue-600 hover:underline break-all"
        target="_blank"
        rel="noreferrer"
        onClick={(e) => {
          // If primary 404, user can retry by opening fallback directly
          // no-op here; fallback preview is handled only for media
        }}
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 2a2 2 0 00-2 2v9a2 2 0 002 2h4a2 2 0 002-2V8l-4-4H8z" />
        </svg>
        <span className="truncate max-w-[14rem]" title={fileName}>{fileName}</span>
      </a>
    );
  };

  const panel = (
    <>
      {/* Desktop floating button (always fixed, independent of breakpoint) */}
      <button
        onClick={toggleChat}
        className="fixed left-4 bottom-4 z-[60] hidden md:flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-primary-600 text-white hover:bg-primary-700 focus:outline-none"
        aria-label="Mở chat"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 5a3 3 0 013-3h14a3 3 0 013 3v9a3 3 0 01-3 3H9l-5 5v-5H5a3 3 0 01-3-3V5z" />
        </svg>
      </button>

      {/* Panel (always mounted, portal to body to avoid parent reflows) */}
      <div
        className={`fixed z-[55] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{
          transition: 'opacity 150ms ease-in-out',
          left: '1rem',
          bottom: '1rem',
          width: 'min(380px, calc(100vw - 1rem))'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-primary-600 text-white">
          <div className="font-semibold">Chat box</div>
          <button onClick={closeChat} aria-label="Đóng">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-900">
          {messages.map((m) => (
            <div key={m.id} className="bg-white dark:bg-slate-800 rounded-lg p-2 shadow border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  {m.user?.name || m.user?.email?.split("@")[0] || "Người dùng"}
                </div>
                <div className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</div>
              </div>
              {m.content && <div className="text-sm whitespace-pre-wrap break-words mb-1">{m.content}</div>}
              {renderAttachment(m)}
              {token && currentUserId === m.userId && (
                <div className="mt-1 text-right">
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-sm text-slate-500">Chưa có tin nhắn</div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            />
            <label className="cursor-pointer inline-flex items-center justify-center px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm">
              Tệp
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              Gửi
            </button>
          </div>
          {file && (
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
              <span className="truncate max-w-[70%]">{file.name}</span>
              <button type="button" className="text-red-600" onClick={() => setFile(null)}>
                Bỏ chọn
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );

  return createPortal(panel, document.body);
};

export default React.memo(ChatBox);