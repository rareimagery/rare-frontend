"use client";
import { useState } from "react";

const THEMES = [
  {
    id: "xai3",
    name: "Xai3 (Default)",
    description: "X-feed style center column with cart, tabs, and premium typography",
    preview: "bg-black",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, light design with lots of whitespace",
    preview: "bg-gray-50",
  },
  {
    id: "neon",
    name: "Neon",
    description: "Dark glassmorphism with purple and cyan accents",
    preview: "bg-[#0a0a0f]",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Warm magazine-style with serif typography",
    preview: "bg-[#f8f6f1]",
  },
  {
    id: "myspace",
    name: "MySpace",
    description: "Retro 2007 nostalgia with glitter, marquees, and music",
    preview: "bg-[#000033]",
  },
  {
    id: "xmimic",
    name: "X Profile",
    description: "Exact X/Twitter profile clone — 3-column layout with Store tab",
    preview: "bg-black",
  },
];

interface ThemeSelectorProps {
  profileNodeId: string;
  currentTheme: string;
}

export default function ThemeSelector({
  profileNodeId,
  currentTheme,
}: ThemeSelectorProps) {
  const [selected, setSelected] = useState(currentTheme || "xai3");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/stores/select-theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileNodeId, theme: selected }),
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
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelected(t.id)}
            className={`rounded-xl border-2 p-4 text-left transition ${
              selected === t.id
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-600"
            }`}
          >
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-lg ${t.preview} border border-zinc-700`}
              />
              <span className="font-semibold text-white">{t.name}</span>
              {selected === t.id && (
                <span className="ml-auto text-xs text-indigo-400">
                  Selected
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">{t.description}</p>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || selected === currentTheme}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : saved ? "Saved!" : "Apply Theme"}
        </button>
        {selected === currentTheme && (
          <span className="text-xs text-zinc-500">
            This is the current theme
          </span>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}
