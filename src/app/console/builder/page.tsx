"use client";

import { useState } from "react";
import { useConsole } from "@/components/ConsoleContext";
import BuildLibrary from "@/components/builder/BuildLibrary";
import LivePreview from "@/components/builder/LivePreview";

export default function ConsoleBuilderPage() {
  const { hasStore, currentTheme, storeSlug } = useConsole();
  const theme = currentTheme || "xai3";

  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveLabel, setSaveLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setResult("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, theme }),
      });

      if (res.status === 429) {
        setError("Rate limit reached. Try again in an hour.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError("Something went wrong.");
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("No response stream.");
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setResult(accumulated);
      }
    } catch {
      setError("Request failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result || !saveLabel.trim()) return;
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: saveLabel.trim(), code: result }),
      });
      if (res.ok) {
        setSavedMsg("Build saved!");
        setSaveLabel("");
        setTimeout(() => setSavedMsg(""), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleLoad(code: string) {
    setResult(code);
  }

  if (!hasStore) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Page Builder</h1>
        <p className="text-zinc-400">Create your store first to use the Page Builder.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Page Builder</h1>
          <p className="text-zinc-400 text-sm">
            Generate custom components for your storefront using AI.
            Theme: <span className="text-indigo-400">{theme}</span>
          </p>
        </div>
        {storeSlug && (
          <a
            href={`/stores/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Open on live store
          </a>
        )}
      </div>

      {/* Two-column layout: Generate + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left: Generate */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Generate</h2>

          <textarea
            className="w-full h-32 p-3 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white
                       placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Describe the component or section you need..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
            }}
          />

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="mt-3 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium
                       rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? "Generating..." : "Generate Component"}
          </button>

          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

          {/* Code output */}
          {result && (
            <div className="relative mt-4">
              <pre className="p-3 bg-zinc-950 text-zinc-300 text-xs rounded-lg overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto border border-zinc-800">
                {result}
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="absolute top-2 right-2 px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded hover:bg-zinc-700 hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
          )}

          {/* Save */}
          {result && !loading && (
            <div className="flex gap-2 mt-3">
              <input
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-sm text-white
                           placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Name this build..."
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
              />
              <button
                onClick={handleSave}
                disabled={saving || !saveLabel.trim()}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg
                           disabled:opacity-50 transition-colors"
              >
                {saving ? "..." : "Save"}
              </button>
            </div>
          )}
          {savedMsg && (
            <p className="text-xs text-green-400 mt-1">{savedMsg}</p>
          )}
        </div>

        {/* Right: Preview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-white">Preview</h2>
          </div>
          <div className="bg-zinc-950">
            <LivePreview code={result} />
          </div>
        </div>
      </div>

      {/* Saved Builds */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50">
        <div className="px-5 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">Saved Builds</h2>
        </div>
        <div className="[&_p]:text-zinc-400 [&_button]:cursor-pointer [&_.text-gray-800]:text-white [&_.text-gray-400]:text-zinc-500 [&_.text-gray-500]:text-zinc-500 [&_.bg-gray-100]:bg-zinc-800 [&_.bg-purple-700]:bg-indigo-600 [&_.hover\\:bg-purple-800]:hover:bg-indigo-500 [&_.hover\\:bg-gray-200]:hover:bg-zinc-700 [&_.divide-gray-100]:divide-zinc-800">
          <BuildLibrary onLoad={handleLoad} />
        </div>
      </div>
    </div>
  );
}
