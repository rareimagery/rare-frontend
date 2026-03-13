"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface StoreTheme {
  bgColor: string;
  bgTile: string;
  bgTileCustomUrl: string;
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
  // Full bot config stored alongside for future renderer upgrades
  botConfig?: Record<string, unknown>;
}

// ─── PRESETS ──────────────────────────────────────────────────────────────────

const QUICK_PRESETS: Record<string, Partial<StoreTheme>> = {
  "Y2K Pink": {
    bgColor: "#1a0010",
    accentColor: "#ff69b4",
    secondColor: "#ff00ff",
    tableBorderColor: "#ff1493",
    tableBgColor: "#2d0020",
    font: "comic",
    bgTile: "hearts",
  },
  "Dark Emo": {
    bgColor: "#0d0d0d",
    accentColor: "#8b0000",
    secondColor: "#4b0082",
    tableBorderColor: "#8b0000",
    tableBgColor: "#1a0000",
    font: "impact",
    bgTile: "skulls",
  },
  "Neon Cyber": {
    bgColor: "#000022",
    accentColor: "#00ffff",
    secondColor: "#ff00ff",
    tableBorderColor: "#00ffff",
    tableBgColor: "#000044",
    font: "impact",
    bgTile: "stars",
  },
  "Scene Gold": {
    bgColor: "#1a1000",
    accentColor: "#ffd700",
    secondColor: "#ff6600",
    tableBorderColor: "#ffd700",
    tableBgColor: "#2a1a00",
    font: "comic",
    bgTile: "stars",
  },
};

const DEFAULT_THEME: StoreTheme = {
  bgColor: "#000033",
  bgTile: "stars",
  bgTileCustomUrl: "",
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

const COLOR_FIELDS: [string, keyof StoreTheme][] = [
  ["Background Color", "bgColor"],
  ["Accent Color", "accentColor"],
  ["Second Color", "secondColor"],
  ["Text Color", "textColor"],
  ["Panel Border", "tableBorderColor"],
  ["Panel Background", "tableBgColor"],
];

// ─── QUIZ CONFIG (from MYSPACE_THEME_BOT_RULES.md Section 7) ─────────────────

const QUIZ_QUESTIONS = [
  {
    key: "vibe",
    question: "Pick a vibe",
    options: ["Dark & moody", "Loud & chaotic", "Clean & minimal", "Soft & warm", "Bold & aggressive"],
  },
  {
    key: "color",
    question: "Pick a color",
    options: ["Black", "Pink", "Neon", "Earth tones", "White + one pop"],
  },
  {
    key: "store_type",
    question: "Your store is…",
    options: ["A stage", "A shop", "A vibe"],
  },
  {
    key: "known_for",
    question: "Your audience mostly knows you for…",
    options: ["Music", "Looks / fashion", "Thoughts / takes", "Products / merch"],
  },
];

const SUBCULTURE_PRESETS = [
  { label: "Emo / Dark Emo", value: "emo" },
  { label: "Scene Kid / Scene Queen", value: "scene" },
  { label: "Pop Princess", value: "pop princess" },
  { label: "Hip-Hop / Rap", value: "hip-hop" },
  { label: "Indie / Alt", value: "indie" },
  { label: "Gamer / Neon Cyber", value: "gamer" },
  { label: "Cottagecore / Soft", value: "cottagecore" },
  { label: "Y2K / McBling", value: "y2k" },
  { label: "Goth / Dark Romantic", value: "goth" },
  { label: "Skate / Streetwear", value: "skate" },
];

// ─── BOT CONFIG → STORE THEME MAPPER ─────────────────────────────────────────

function botConfigToTheme(bot: Record<string, unknown>): Partial<StoreTheme> {
  const colors = (bot.colors as Record<string, string>) || {};
  const bg = (bot.background as Record<string, unknown>) || {};
  const typo = (bot.typography as Record<string, string>) || {};
  const deco = (bot.decorations as Record<string, unknown>) || {};
  const header = (bot.header as Record<string, unknown>) || {};

  // Map Google Font name → existing font key (best effort)
  const fontMap: Record<string, string> = {
    "Boogaloo": "comic",
    "Pacifico": "comic",
    "Comic Sans MS": "comic",
    "Quicksand": "comic",
    "Nunito": "comic",
    "Bebas Neue": "impact",
    "Impact": "impact",
    "Black Han Sans": "impact",
    "Orbitron": "impact",
    "Dancing Script": "cursive",
    "Brush Script MT": "cursive",
    "Cinzel": "times",
    "Cinzel Decorative": "times",
    "Playfair Display": "times",
    "IM Fell English": "times",
    "Special Elite": "times",
    "Lora": "times",
  };

  const fontHeading = typo.font_heading || "";
  const mappedFont = fontMap[fontHeading] || "comic";

  // Map pattern_style → bgTile
  const patternMap: Record<string, string> = {
    stars: "stars",
    hearts: "hearts",
    skulls: "skulls",
    dots: "stars",
    lightning: "stars",
    plaid: "stars",
  };
  const bgPattern = bg.pattern_style as string;
  const bgType = bg.type as string;
  const bgTile =
    bgType === "tiled_pattern" && bgPattern && patternMap[bgPattern]
      ? patternMap[bgPattern]
      : "stars";

  // Extract mood from header
  const moodIcon = (header.mood_icon as string) || "";
  const moodText = (header.mood_text as string) || "";
  const profileMood = [moodIcon, moodText].filter(Boolean).join(" ") || "🎵 Feeling it";

  // Marquee from subculture vibe
  const meta = (bot.meta as Record<string, string>) || {};
  const subculture = meta.subculture || "";
  const marqueeMap: Record<string, string> = {
    scene: "✨ Welcome to my store! ✨ Scene forever! ✨ xoxo ✨",
    emo: "💔 Welcome to my store 💔 Stay true 💔",
    goth: "🖤 Darkness welcomes you 🖤 Browse at your peril 🖤",
    "hip-hop": "🔥 Welcome to the drop 🔥 Stay RARE 🔥",
    indie: "✦ Welcome in ✦ Thanks for stopping by ✦",
    gamer: "// LOADING STORE... >> WELCOME >> RARE >>",
    cottagecore: "🌿 Welcome to my little shop 🌿 Made with love 🌿",
    y2k: "✨ OMG welcome!! ✨ U found my store!! ✨",
    "pop princess": "💖 Welcome to my world 💖 xoxo 💖",
    skate: "DROP INCOMING >> WELCOME TO THE SHOP >> STAY RARE",
  };
  const marqueeText =
    marqueeMap[subculture] ||
    "✨ Welcome to my store! ✨ Thanks for visiting! ✨";

  return {
    bgColor: colors.page_bg || "#000033",
    accentColor: colors.accent_primary || "#ff00ff",
    secondColor: colors.accent_secondary || "#00ffff",
    textColor: colors.text_body || "#ffffff",
    tableBorderColor: colors.border || colors.accent_primary || "#ff00ff",
    tableBgColor: colors.card_bg || colors.content_bg || "#000066",
    font: mappedFont,
    bgTile,
    glitterText: Array.isArray(deco.glitter_text_on)
      ? (deco.glitter_text_on as string[]).includes("username")
      : false,
    cursorTrail: (deco.cursor_style as string) === "star" || (deco.cursor_style as string) === "heart",
    marqueeText,
    profileMood,
    botConfig: bot,
  };
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ThemeEditorPage() {
  const params = useParams<{ id: string }>();
  const storeId = params.id;

  const [theme, setTheme] = useState<StoreTheme>(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [selectedPreset, setSelectedPreset] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [lastGenerated, setLastGenerated] = useState<Record<string, unknown> | null>(null);

  const applyQuickPreset = (presetName: string) => {
    const preset = QUICK_PRESETS[presetName];
    if (preset) setTheme((t) => ({ ...t, ...preset }));
  };

  const generateTheme = async () => {
    setGenerating(true);
    setGenError("");
    try {
      const res = await fetch("/api/stores/generate-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizAnswers,
          preset: selectedPreset || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const botConfig = data.themeConfig as Record<string, unknown>;
      setLastGenerated(botConfig);
      const mapped = botConfigToTheme(botConfig);
      setTheme((t) => ({ ...t, ...mapped }));
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/stores/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, theme }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🎨 MySpace Theme Editor</h1>
        <div className="flex items-center gap-4">
          <Link
            href={`/console/stores/${storeId}/theme/chat`}
            className="rounded-lg bg-fuchsia-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-600"
          >
            💬 Chat Builder
          </Link>
          <Link
            href={`/console/stores/${storeId}`}
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            ← Back to Store
          </Link>
        </div>
      </div>

      {/* ── AI THEME GENERATOR ── */}
      <section className="rounded-xl border border-fuchsia-800/50 bg-fuchsia-950/20 p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h2 className="text-lg font-bold text-fuchsia-300">AI Theme Generator</h2>
            <p className="text-sm text-zinc-400">
              Answer 4 questions and pick a vibe — AI generates your full MySpace theme.
            </p>
          </div>
        </div>

        {/* Subculture preset */}
        <div className="mb-5">
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Subculture Preset (optional — overrides quiz signals)
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPreset("")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedPreset === ""
                  ? "bg-fuchsia-600 text-white"
                  : "border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500"
              }`}
            >
              Auto-detect
            </button>
            {SUBCULTURE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setSelectedPreset(p.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedPreset === p.value
                    ? "bg-fuchsia-600 text-white"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mood quiz */}
        <div className="mb-5 grid gap-4 sm:grid-cols-2">
          {QUIZ_QUESTIONS.map((q) => (
            <div key={q.key}>
              <p className="mb-2 text-sm font-medium text-zinc-300">{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() =>
                      setQuizAnswers((prev) => ({
                        ...prev,
                        [q.question]: opt,
                      }))
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      quizAnswers[q.question] === opt
                        ? "bg-fuchsia-600 text-white"
                        : "border border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-fuchsia-700 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={generateTheme}
            disabled={generating}
            className="rounded-lg bg-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
          >
            {generating ? "⏳ Generating..." : "✨ Generate Theme"}
          </button>
          {lastGenerated && (
            <span className="text-sm text-green-400">
              ✓ Theme generated — scroll down to fine-tune or save
            </span>
          )}
          {genError && (
            <span className="text-sm text-red-400">{genError}</span>
          )}
        </div>

        {lastGenerated && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
              View full bot config JSON
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-zinc-900 p-3 text-xs text-zinc-400">
              {JSON.stringify(lastGenerated, null, 2)}
            </pre>
          </details>
        )}
      </section>

      {/* ── QUICK PRESETS ── */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-300">
          Quick Presets
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(QUICK_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => applyQuickPreset(name)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-700"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* ── MANUAL EDITOR ── */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Colors */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-300">Colors</h3>
          {COLOR_FIELDS.map(([label, key]) => (
            <div key={key} className="mb-3 flex items-center gap-3">
              <label className="w-36 text-sm text-zinc-400">{label}</label>
              <input
                type="color"
                value={theme[key] as string}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, [key]: e.target.value }))
                }
                className="h-8 w-10 cursor-pointer rounded border border-zinc-700"
              />
              <code className="text-xs text-zinc-500">
                {theme[key] as string}
              </code>
            </div>
          ))}
        </section>

        {/* Options */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-300">Options</h3>

          <div className="mb-3">
            <label className="mb-1 block text-sm text-zinc-400">Font</label>
            <select
              value={theme.font}
              onChange={(e) =>
                setTheme((t) => ({ ...t, font: e.target.value }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            >
              <option value="comic">Comic Sans</option>
              <option value="impact">Impact</option>
              <option value="cursive">Brush Script</option>
              <option value="times">Times New Roman</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm text-zinc-400">
              Background Tile
            </label>
            <select
              value={theme.bgTile}
              onChange={(e) =>
                setTheme((t) => ({ ...t, bgTile: e.target.value }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            >
              <option value="stars">⭐ Stars</option>
              <option value="hearts">💗 Hearts</option>
              <option value="skulls">💀 Skulls</option>
              <option value="custom">Custom URL</option>
            </select>
          </div>

          {theme.bgTile === "custom" && (
            <input
              placeholder="Tile image URL"
              value={theme.bgTileCustomUrl}
              onChange={(e) =>
                setTheme((t) => ({ ...t, bgTileCustomUrl: e.target.value }))
              }
              className="mb-3 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            />
          )}

          <div className="mb-2">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={theme.glitterText}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, glitterText: e.target.checked }))
                }
              />
              Glitter Text on Name
            </label>
          </div>

          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={theme.cursorTrail}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, cursorTrail: e.target.checked }))
                }
              />
              Sparkle Cursor Trail
            </label>
          </div>

          <div className="mb-2">
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input
                type="checkbox"
                checked={theme.onlineNow}
                onChange={(e) =>
                  setTheme((t) => ({ ...t, onlineNow: e.target.checked }))
                }
              />
              Show Online Badge
            </label>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm text-zinc-400">
              Marquee Message
            </label>
            <input
              value={theme.marqueeText}
              onChange={(e) =>
                setTheme((t) => ({ ...t, marqueeText: e.target.value }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm text-zinc-400">Mood</label>
            <input
              value={theme.profileMood}
              onChange={(e) =>
                setTheme((t) => ({ ...t, profileMood: e.target.value }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-400">
              Visitor Counter Seed
            </label>
            <input
              type="number"
              value={theme.visitorCount}
              onChange={(e) =>
                setTheme((t) => ({
                  ...t,
                  visitorCount: parseInt(e.target.value) || 0,
                }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            />
          </div>
        </section>

        {/* Music */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-300">
            🎵 Music Player
          </h3>

          <div className="mb-3">
            <label className="mb-1 block text-sm text-zinc-400">
              Song URL (.mp3 or .ogg)
            </label>
            <input
              placeholder="https://..."
              value={theme.songUrl}
              onChange={(e) =>
                setTheme((t) => ({ ...t, songUrl: e.target.value }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-sm text-zinc-400">Song Title</label>
            <input
              value={theme.songTitle}
              onChange={(e) =>
                setTheme((t) => ({ ...t, songTitle: e.target.value }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-400">Artist</label>
            <input
              value={theme.songArtist}
              onChange={(e) =>
                setTheme((t) => ({ ...t, songArtist: e.target.value }))
              }
              className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
            />
          </div>
        </section>
      </div>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg px-8 py-3 text-sm font-bold text-white transition"
          style={{
            background: saved ? "#00aa00" : "#ff00ff",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : saved ? "✔ SAVED!" : "💾 Save Theme"}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
