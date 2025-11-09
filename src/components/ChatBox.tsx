import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getToken } from "../utils/auth";
import { ChatAPI, getApiBaseUrl } from "../utils/api";
import { FiPaperclip, FiSend } from "react-icons/fi";

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
  // Open/close state
  const [open, setOpen] = useState(false);
  const openRef = useRef<boolean>(false);
  useEffect(() => { openRef.current = open; }, [open]);
  const [unread, setUnread] = useState(0);
  const openChat = () => { if (!openRef.current) { setOpen(true); setUnread(0); } };
  const closeChat = () => { if (openRef.current) setOpen(false); };
  const toggleChat = () => setOpen((v) => { const nv = !v; if (nv) setUnread(0); return nv; });

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Header event integration
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

  // Auth
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

  // Merge helper (stable UI)
  const mergeMessages = (prev: ChatMessage[], incoming: ChatMessage[]) => {
    const map = new Map<string, ChatMessage>();
    for (const m of prev) map.set(m.id, m);
    for (const m of incoming) map.set(m.id, m);
    return Array.from(map.values()).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  // Initial load flag
  const hasLoadedRef = useRef(false);

  // Load history
  const loadRecent = async () => {
    if (!token) return;
    try {
      const data = await ChatAPI.list({ limit: 50 }, token);
      setMessages((prev) => mergeMessages(prev, data));
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        requestAnimationFrame(() => {
          listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "auto" });
        });
      }
    } catch {}
  };

  // Viewport tracking
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  
  useEffect(() => {
    const onResize = () => { 
      setVw(window.innerWidth); 
      setVh(window.innerHeight); 
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Button and Panel position (linked together)
  const btnSize = 56;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const panelWidth = Math.min(380, vw - 16);
  const panelHeight = 500;
  const gap = 16; // Gap between button and panel
  
  const getDefaultBtnPos = (viewportWidth: number, viewportHeight: number) => ({
    x: viewportWidth - btnSize - 24,  // Right side with padding
    y: viewportHeight - btnSize - 100  // Bottom with padding
  });

  const readBtnPos = (viewportWidth: number, viewportHeight: number) => {
    try {
      const raw = localStorage.getItem('chat_btn_pos');
      if (raw) {
        const p = JSON.parse(raw);
        return { 
          x: clamp(p.x, 8, viewportWidth - btnSize - 8), 
          y: clamp(p.y, 8, viewportHeight - btnSize - 8) 
        };
      }
    } catch {}
    return getDefaultBtnPos(viewportWidth, viewportHeight);
  };

  const [btnPos, setBtnPos] = useState(() => readBtnPos(vw, vh));
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Clamp to keep button within viewport bounds
    setBtnPos(p => ({ 
      x: clamp(p.x, 8, vw - btnSize - 8), 
      y: clamp(p.y, 8, vh - btnSize - 8) 
    }));
  }, [vw, vh]);

  const persistBtnPos = (p: { x: number; y: number }) => {
    try { 
      localStorage.setItem('chat_btn_pos', JSON.stringify(p)); 
    } catch {}
  };

  // Calculate panel position based on button position
  const getPanelPos = () => {
    // Panel appears to the right of button
    let panelX = btnPos.x + btnSize + gap;
    let panelY = btnPos.y;

    // If panel would overflow right edge, show it to the left of button
    if (panelX + panelWidth > vw - 8) {
      panelX = btnPos.x - panelWidth - gap;
    }

    // Clamp panel Y to viewport
    panelY = clamp(panelY, 8, vh - panelHeight - 8);

    return { x: panelX, y: panelY };
  };

  // SSE always-on to count unread
  useEffect(() => {
    if (!token) return;
    if (esRef.current) return;
    const es = new EventSource(`${getApiBaseUrl()}/chat/stream?token=${encodeURIComponent(token)}`);
    es.addEventListener('message', (ev) => {
      try {
        const msg = JSON.parse((ev as MessageEvent).data);
        setMessages((prev) => mergeMessages(prev, [msg]));
        if (openRef.current) {
          setTimeout(() => {
            if (listRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = listRef.current;
              const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
              if (isNearBottom) listRef.current.scrollTo({ top: scrollHeight, behavior: 'smooth' });
            }
          }, 50);
        } else {
          setUnread((n) => Math.min(999, n + 1));
        }
      } catch {}
    });
    esRef.current = es;
    return () => { es.close(); esRef.current = null; };
  }, [token]);

  // Open → load history
  useEffect(() => {
    if (!open) return;
    hasLoadedRef.current = false;
    loadRecent();
  }, [open]);

  // Send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!input.trim() && !file) return;
    if (file && file.size > 10 * 1024 * 1024) { 
      alert('Giới hạn tệp là 10MB'); 
      return; 
    }
    try {
      setLoading(true);
      await ChatAPI.send({ 
        content: input.trim() || undefined, 
        file: file || undefined 
      }, token);
      setInput("");
      setFile(null);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
      });
    } finally { 
      setLoading(false); 
    }
  };

  // Delete
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
    const fallbackUrl = m.attachmentUrl;

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
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M8 2a2 2 0 00-2 2v9a2 2 0 002 2h4a2 2 0 002-2V8l-4-4H8z" />
        </svg>
        <span className="truncate max-w-[14rem]" title={fileName}>{fileName}</span>
      </a>
    );
  };

  // Drag handlers (both button and panel move together)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const sx = btnPos.x;
    const sy = btnPos.y;
    let hasMoved = false;

    const onMove = (ev: MouseEvent) => {
      hasMoved = true;
      const nx = clamp(sx + (ev.clientX - startX), 8, vw - btnSize - 8);
      const ny = clamp(sy + (ev.clientY - startY), 8, vh - btnSize - 8);
      setBtnPos({ x: nx, y: ny });
    };

    const onUp = () => {
      setIsDragging(false);
      if (hasMoved) {
        persistBtnPos(btnPos);
      } else {
        // Click without drag - toggle chat
        toggleChat();
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    const t = e.touches[0];
    const startX = t.clientX;
    const startY = t.clientY;
    const sx = btnPos.x;
    const sy = btnPos.y;
    let hasMoved = false;

    const onMove = (ev: TouchEvent) => {
      const tt = ev.touches[0];
      if (!tt) return;
      hasMoved = true;
      const nx = clamp(sx + (tt.clientX - startX), 8, vw - btnSize - 8);
      const ny = clamp(sy + (tt.clientY - startY), 8, vh - btnSize - 8);
      setBtnPos({ x: nx, y: ny });
    };

    const onEnd = () => {
      setIsDragging(false);
      if (hasMoved) {
        persistBtnPos(btnPos);
      } else {
        toggleChat();
      }
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  const panelPos = getPanelPos();

  const panel = (
    <>
      {/* Floating button - draggable */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`hidden md:flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-primary-600 text-white hover:bg-primary-700 focus:outline-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        aria-label="Mở chat"
        style={{ 
          position: 'fixed',
          left: `${btnPos.x}px`, 
          top: `${btnPos.y}px`,
          zIndex: 9999,
          touchAction: 'none'
        }}
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 5a3 3 0 013-3h14a3 3 0 013 3v9a3 3 0 01-3 3H9l-5 5v-5H5a3 3 0 01-3-3V5z" />
        </svg>
        {unread > 0 && (
          <span 
            className="min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow-md"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px'
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Chat Panel - linked to button */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          position: 'fixed',
          transition: isDragging ? 'none' : 'opacity 150ms ease-in-out',
          left: `${panelPos.x}px`,
          top: `${panelPos.y}px`,
          width: `${panelWidth}px`,
          zIndex: 9998,
          touchAction: 'none'
        }}
      >
        {/* Header - draggable handle */}
        <div 
          className={`chat-panel-header flex items-center justify-between px-4 py-2 bg-primary-600 text-white ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <div className="font-semibold select-none">Chat box</div>
          <button 
            onClick={closeChat} 
            aria-label="Đóng"
            className="hover:bg-primary-700 rounded p-1"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={listRef} className="h-80 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-900">
          {messages.map((m) => {
            const mine = currentUserId === m.userId;
            return (
              <div key={m.id} className={`w-full flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] rounded-2xl shadow border ${
                    mine 
                      ? 'bg-primary-600 text-white border-primary-700/40 rounded-tr-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 border-slate-200 dark:border-slate-700 rounded-tl-sm'
                  } p-2`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className={`text-[12px] font-medium ${mine ? 'text-white/80' : 'text-slate-600 dark:text-slate-300'}`}>
                      {m.user?.name || m.user?.email?.split("@")[0] || (mine ? 'Bạn' : 'Người dùng')}
                    </div>
                    <div className={`text-[10px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  {m.content && (
                    <div className="text-sm whitespace-pre-wrap break-words mb-1">{m.content}</div>
                  )}
                  {renderAttachment(m)}
                  {mine && (
                    <div className="mt-1 text-right">
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-[10px] underline text-white/80 hover:text-white"
                      >
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
            <label 
              className="cursor-pointer inline-flex items-center justify-center p-2 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" 
              title="Đính kèm tệp"
            >
              <FiPaperclip className="w-5 h-5" />
              <input
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center p-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              title="Gửi"
              aria-label="Gửi"
            >
              <FiSend className="w-5 h-5" />
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