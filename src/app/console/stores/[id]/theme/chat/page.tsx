"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface StoreTheme {
  bgColor: string;
  bgTile: string;
  bgTileCustomUrl?: string;
  accentColor: string;
  secondColor: string;
  textColor: string;
  tableBorderColor: string;
  tableBgColor: string;
  font: string;
  glitterText: boolean;
  cursorTrail: boolean;
  marqueeText: string;
  profileMood: string;
  onlineNow: boolean;
  visitorCount: number;
  songUrl: string;
  songTitle: string;
  songArtist: string;
}

interface SavedTheme {
  id: string;
  name: string;
  theme: StoreTheme;
  createdAt: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SECTIONS = ["background", "profile", "pfp", "top8", "music"] as const;
type Section = (typeof SECTIONS)[number];

const SECTION_LABELS: Record<Section, string> = {
  background: "Background",
  profile: "Profile",
  pfp: "Pic",
  top8: "Top 8",
  music: "Music",
};

const SECTION_ICONS: Record<Section, string> = {
  background: "🎨",
  profile: "👤",
  pfp: "🖼️",
  top8: "🛍️",
  music: "🎵",
};

const DEFAULT_THEME: StoreTheme = {
  bgColor: "#000033",
  bgTile: "stars",
  accentColor: "#ff00ff",
  secondColor: "#00ffff",
  textColor: "#ffffff",
  tableBorderColor: "#ff00ff",
  tableBgColor: "#000066",
  font: "comic",
  glitterText: true,
  cursorTrail: true,
  marqueeText: "✨ Welcome to my store! ✨",
  profileMood: "🎵 Feeling creative",
  onlineNow: true,
  visitorCount: 1000,
  songUrl: "",
  songTitle: "My Song",
  songArtist: "Unknown",
};

const STARTER_MESSAGE: ChatMessage = {
  role: "assistant",
  content: JSON.stringify({
    message:
      "omg hey!! 👋✨ i'm ur MySpace theme bot!! i'm gonna help u build ur storefront vibe section by section — let's start with the BACKGROUND. what kinda energy r we going for?? dark & moody? neon chaos? soft & cute? cottagecore? skate drop? or just describe it in ur own words!",
    themeUpdate: null,
    completedSection: null,
    nextSection: "background",
  }),
};

// ─── PREVIEW SWATCH ──────────────────────────────────────────────────────────

function ThemePreview({ theme }: { theme: StoreTheme }) {
  const FONT_MAP: Record<string, string> = {
    comic: '"Comic Sans MS", cursive',
    impact: "Impact, sans-serif",
    cursive: '"Brush Script MT", cursive',
    times: '"Times New Roman", serif',
  };

  return (
    <div
      className="overflow-hidden rounded-xl border-2"
      style={{
        borderColor: theme.accentColor,
        boxShadow: `0 0 20px ${theme.accentColor}40`,
        fontFamily: FONT_MAP[theme.font] || "sans-serif",
      }}
    >
      {/* Mini marquee */}
      <div
        className="overflow-hidden px-2 py-1 text-xs font-bold"
        style={{
          background: `linear-gradient(90deg, #000, ${theme.accentColor}, #000)`,
          color: "#fff",
        }}
      >
        {theme.marqueeText}
      </div>

      {/* Mini profile */}
      <div
        className="flex items-center gap-3 p-3"
        style={{ background: theme.bgColor }}
      >
        {/* PFP placeholder */}
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center text-xl font-bold"
          style={{
            border: `3px solid ${theme.accentColor}`,
            boxShadow: `0 0 10px ${theme.accentColor}`,
            background: theme.tableBgColor,
            color: theme.accentColor,
          }}
        >
          X
        </div>
        <div>
          <div
            className="text-sm font-bold"
            style={{
              color: theme.accentColor,
              textShadow: `0 0 8px ${theme.secondColor}`,
            }}
          >
            @yourcreatorname
          </div>
          <div className="text-xs" style={{ color: theme.secondColor }}>
            {theme.profileMood}
          </div>
          {theme.onlineNow && (
            <span
              className="mt-0.5 inline-block rounded px-1 text-[9px] font-bold text-white"
              style={{ background: "#00aa00" }}
            >
              ● ONLINE
            </span>
          )}
        </div>
      </div>

      {/* Mini panel */}
      <div
        className="mx-2 mb-2 rounded"
        style={{ border: `2px solid ${theme.tableBorderColor}` }}
      >
        <div
          className="px-2 py-1 text-xs font-bold text-white"
          style={{
            background: `linear-gradient(90deg, ${theme.tableBorderColor}, ${theme.secondColor})`,
          }}
        >
          🛍️ MY SHOP
        </div>
        <div
          className="grid grid-cols-3 gap-1 p-2"
          style={{ background: theme.tableBgColor }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded"
              style={{
                background: `linear-gradient(135deg, ${theme.bgColor}, ${theme.tableBgColor})`,
                border: `1px solid ${theme.tableBorderColor}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Color swatches */}
      <div className="flex gap-1 px-2 pb-2">
        {[
          theme.bgColor,
          theme.accentColor,
          theme.secondColor,
          theme.textColor,
          theme.tableBorderColor,
          theme.tableBgColor,
        ].map((color, i) => (
          <div
            key={i}
            className="h-4 flex-1 rounded"
            style={{ background: color }}
            title={color}
          />
        ))}
      </div>

      {/* Settings row */}
      <div
        className="flex gap-3 border-t px-2 py-1.5 text-[9px]"
        style={{
          borderColor: theme.tableBorderColor,
          background: theme.tableBgColor,
          color: theme.secondColor,
        }}
      >
        <span>font: {theme.font}</span>
        <span>tile: {theme.bgTile}</span>
        {theme.glitterText && <span>✨ glitter</span>}
        {theme.cursorTrail && <span>🌟 cursor</span>}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ThemeChatPage() {
  const params = useParams<{ id: string }>();
  const storeId = params.id;

  const [messages, setMessages] = useState<ChatMessage[]>([STARTER_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<StoreTheme>(DEFAULT_THEME);
  const [completedSections, setCompletedSections] = useState<Section[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storageKey = `rare_myspace_themes_${storeId}`;

  // Load saved themes from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setSavedThemes(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const parseAssistantContent = (content: string) => {
    try {
      const json = JSON.parse(content);
      return json as {
        message: string;
        themeUpdate: Record<string, unknown> | null;
        completedSection: string | null;
        nextSection: string | null;
      };
    } catch {
      return { message: content, themeUpdate: null, completedSection: null, nextSection: null };
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Send history with assistant messages unwrapped to their display text
      const apiMessages = newMessages.map((m) => {
        if (m.role === "assistant") {
          const parsed = parseAssistantContent(m.content);
          return { role: "assistant" as const, content: parsed.message };
        }
        return m;
      });

      const res = await fetch("/api/stores/theme-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: JSON.stringify(data),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (data.themeUpdate) {
        setTheme((t) => ({ ...t, ...data.themeUpdate }));
      }
      if (data.completedSection && SECTIONS.includes(data.completedSection as Section)) {
        setCompletedSections((prev) =>
          prev.includes(data.completedSection as Section)
            ? prev
            : [...prev, data.completedSection as Section]
        );
      }
      if (data.nextSection === "done") {
        setIsDone(true);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: JSON.stringify({
            message: `omg something went wrong 😭 — ${errMsg} — try again!`,
            themeUpdate: null,
            completedSection: null,
            nextSection: null,
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Save active theme to Drupal
  const activateTheme = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/stores/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, theme }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSavedMsg("✓ Applied to your store!");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch {
      setSavedMsg("Save failed — try again");
    } finally {
      setSaving(false);
    }
  };

  // Save to local theme library
  const saveToLibrary = () => {
    const name = saveNameInput.trim() || `Theme ${new Date().toLocaleDateString()}`;
    const entry: SavedTheme = {
      id: `t_${Date.now()}`,
      name,
      theme: { ...theme },
      createdAt: Date.now(),
    };
    const updated = [...savedThemes, entry];
    setSavedThemes(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setSaveNameInput("");
    setShowSaveForm(false);
  };

  const deleteFromLibrary = (id: string) => {
    const updated = savedThemes.filter((t) => t.id !== id);
    setSavedThemes(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const applyFromLibrary = (saved: SavedTheme) => {
    setTheme(saved.theme);
  };

  const resetChat = () => {
    setMessages([STARTER_MESSAGE]);
    setTheme(DEFAULT_THEME);
    setCompletedSections([]);
    setIsDone(false);
  };

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">🎨 MySpace Theme Builder</h1>
          <p className="text-sm text-zinc-500">Chat your way through 5 sections</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/console/stores/${storeId}/theme`}
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            Manual Editor →
          </Link>
        </div>
      </div>

      {/* Section Progress */}
      <div className="flex shrink-0 gap-2">
        {SECTIONS.map((s) => {
          const done = completedSections.includes(s);
          return (
            <div
              key={s}
              className="flex flex-1 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition"
              style={{
                borderColor: done ? theme.accentColor : "#3f3f46",
                background: done ? `${theme.accentColor}20` : "transparent",
                color: done ? theme.accentColor : "#71717a",
                boxShadow: done ? `0 0 8px ${theme.accentColor}40` : "none",
              }}
            >
              <span>{SECTION_ICONS[s]}</span>
              <span>{SECTION_LABELS[s]}</span>
              {done && <span className="ml-auto">✓</span>}
            </div>
          );
        })}
      </div>

      {/* Main layout: chat left, preview right */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Chat panel */}
        <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-zinc-800 bg-zinc-900/60">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => {
              const isBot = msg.role === "assistant";
              const parsed = isBot ? parseAssistantContent(msg.content) : null;
              const displayText = parsed ? parsed.message : msg.content;

              return (
                <div
                  key={i}
                  className={`flex gap-2 ${isBot ? "justify-start" : "justify-end"}`}
                >
                  {isBot && (
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
                      style={{ background: theme.accentColor }}
                    >
                      🤖
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      isBot
                        ? "rounded-tl-sm bg-zinc-800 text-zinc-100"
                        : "rounded-tr-sm bg-fuchsia-600 text-white"
                    }`}
                  >
                    {displayText}
                    {parsed?.completedSection && (
                      <div
                        className="mt-1.5 text-xs opacity-70"
                        style={{ color: theme.accentColor }}
                      >
                        ✓ {parsed.completedSection} section done
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm"
                  style={{ background: theme.accentColor }}
                >
                  🤖
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
                  <span className="animate-pulse">typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Done banner */}
          {isDone && (
            <div
              className="mx-3 mb-2 rounded-lg px-3 py-2 text-center text-sm font-bold"
              style={{
                background: `linear-gradient(90deg, ${theme.accentColor}30, ${theme.secondColor}30)`,
                border: `1px solid ${theme.accentColor}`,
                color: theme.accentColor,
              }}
            >
              🎉 All 5 sections done! Apply it to your store →
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 border-t border-zinc-800 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="describe ur vibe..."
                disabled={loading}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="rounded-lg px-4 py-2 text-sm font-bold text-white transition disabled:opacity-40"
                style={{ background: theme.accentColor }}
              >
                Send
              </button>
            </div>
            <button
              onClick={resetChat}
              className="mt-1.5 text-xs text-zinc-600 hover:text-zinc-400"
            >
              ↺ Start over
            </button>
          </div>
        </div>

        {/* Right panel: preview + actions */}
        <div className="flex w-64 shrink-0 flex-col gap-3">
          {/* Live preview */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-500">Live Preview</p>
            <ThemePreview theme={theme} />
          </div>

          {/* Apply to store */}
          <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-xs font-medium text-zinc-400">Apply to Store</p>
            <button
              onClick={activateTheme}
              disabled={saving}
              className="w-full rounded-lg py-2 text-sm font-bold text-white transition disabled:opacity-60"
              style={{ background: theme.accentColor }}
            >
              {saving ? "Applying..." : "💾 Set as Active Theme"}
            </button>
            {savedMsg && (
              <p className={`text-xs ${savedMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
                {savedMsg}
              </p>
            )}
          </div>

          {/* Save to library */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="mb-2 text-xs font-medium text-zinc-400">Save to Library</p>
            {showSaveForm ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={saveNameInput}
                  onChange={(e) => setSaveNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveToLibrary()}
                  placeholder="Theme name..."
                  className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
                />
                <div className="flex gap-1">
                  <button
                    onClick={saveToLibrary}
                    className="flex-1 rounded bg-fuchsia-700 py-1 text-xs font-medium text-white hover:bg-fuchsia-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowSaveForm(false)}
                    className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveForm(true)}
                className="w-full rounded-lg border border-zinc-700 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-zinc-500 hover:text-white"
              >
                + Save current theme
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Saved Themes Library */}
      {savedThemes.length > 0 && (
        <div className="shrink-0">
          <p className="mb-2 text-xs font-medium text-zinc-500">
            Saved Themes ({savedThemes.length})
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {savedThemes.map((saved) => (
              <div
                key={saved.id}
                className="flex w-44 shrink-0 flex-col gap-2 rounded-xl border p-2 transition"
                style={{ borderColor: saved.theme.accentColor + "60" }}
              >
                {/* Mini swatch strip */}
                <div className="flex gap-0.5 overflow-hidden rounded">
                  {[
                    saved.theme.bgColor,
                    saved.theme.accentColor,
                    saved.theme.secondColor,
                    saved.theme.tableBgColor,
                  ].map((c, i) => (
                    <div key={i} className="h-4 flex-1" style={{ background: c }} />
                  ))}
                </div>
                <p
                  className="truncate text-xs font-medium"
                  style={{ color: saved.theme.accentColor }}
                >
                  {saved.name}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => applyFromLibrary(saved)}
                    className="flex-1 rounded py-1 text-[10px] font-medium text-white"
                    style={{ background: saved.theme.accentColor }}
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => deleteFromLibrary(saved.id)}
                    className="rounded px-1.5 py-1 text-[10px] text-zinc-600 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
