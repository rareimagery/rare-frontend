"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

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
}

const PRESET_THEMES: Record<string, Partial<StoreTheme>> = {
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

export default function ThemeEditorPage() {
  const params = useParams<{ id: string }>();
  const storeId = params.id;
  const [theme, setTheme] = useState<StoreTheme>(DEFAULT_THEME);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applyPreset = (presetName: string) => {
    const preset = PRESET_THEMES[presetName];
    if (preset) setTheme((t) => ({ ...t, ...preset }));
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🎨 Theme Editor</h1>
        <Link
          href={`/console/stores/${storeId}`}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back to Store
        </Link>
      </div>

      {/* Presets */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-zinc-300">
          Quick Presets
        </h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(PRESET_THEMES).map((name) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-700"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Colors */}
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-300">Colors</h3>
          {COLOR_FIELDS.map(([label, key]) => (
            <div
              key={key}
              className="mb-3 flex items-center gap-3"
            >
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
            <label className="mb-1 block text-sm text-zinc-400">
              Song Title
            </label>
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
