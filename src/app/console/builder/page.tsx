"use client";

import { useEffect, useState } from "react";
import { useConsole } from "@/components/ConsoleContext";
import BuildLibrary from "@/components/builder/BuildLibrary";
import LivePreview from "@/components/builder/LivePreview";

interface InsightsVisualData {
  profilePictureUrl: string | null;
  bannerUrl: string | null;
  topPosts: Array<{ image_url?: string }>;
}

const STYLE_OPTIONS = [
  {
    title: "Luxury Pulse",
    previewClassName: "bg-[radial-gradient(circle_at_top,rgba(244,244,245,0.18),transparent_45%),linear-gradient(135deg,#111827,#09090b)]",
    prompt:
      "Build a modern luxury storefront landing section for my creator store. Use a cinematic hero, premium typography, disciplined spacing, featured product cards, subtle motion, and a polished mobile-first feel. Make it feel expensive and editorial, not generic SaaS.",
  },
  {
    title: "Minimal Frame",
    previewClassName: "bg-[linear-gradient(180deg,#fafaf9,#e7e5e4)]",
    prompt:
      "Create a modern minimal fashion storefront section with oversized type, neutral tones, crisp spacing, restrained product cards, and a strong grid. It should feel like a contemporary boutique brand launch page.",
  },
  {
    title: "Drop Zone",
    previewClassName: "bg-[linear-gradient(135deg,#18181b,#111827_50%,#1d4ed8)]",
    prompt:
      "Build a modern streetwear drop section with aggressive typography, countdown energy, limited-release product cards, campaign-style callouts, and high-contrast layout. It should feel like a live drop, not a normal shop page.",
  },
  {
    title: "Editorial Drift",
    previewClassName: "bg-[linear-gradient(135deg,#f5f5f4,#d6d3d1)]",
    prompt:
      "Design an editorial storefront section that feels like a luxury campaign spread. Use serif-forward typography, asymmetric layout, immersive storytelling blocks, and product placement that feels curated instead of crowded.",
  },
  {
    title: "MySpace Flash",
    previewClassName: "bg-[linear-gradient(135deg,#ec4899,#60a5fa_45%,#22d3ee)]",
    prompt:
      "Build a chaotic MySpace 2008 style storefront section with glitter accents, custom profile energy, loud gradients, badges, stickers, marquee text, and stacked content boxes. Keep it usable on mobile but let it feel nostalgic, messy, and intentionally overdesigned.",
  },
  {
    title: "Moodboard Night",
    previewClassName: "bg-[linear-gradient(180deg,#1f2937,#111827)]",
    prompt:
      "Create a Tumblr 2012 inspired storefront section with moody editorial typography, image-first storytelling, quote-style blocks, soft spacing, and an artsy indie internet feel. Prioritize atmosphere and visual identity over pure ecommerce utility.",
  },
];

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
  const [visuals, setVisuals] = useState<InsightsVisualData | null>(null);
  const [includeXImages, setIncludeXImages] = useState(true);

  const dynamicOptions = STYLE_OPTIONS.map((option) => {
    const promptContext = [
      option.prompt,
      `Keep the generated section aligned with the ${theme} visual system.`,
      visuals?.profilePictureUrl ? "Use the creator profile image as an identity anchor in the layout." : "",
      visuals?.bannerUrl ? "Use the creator banner image as the dominant background mood." : "",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      ...option,
      prompt: promptContext,
    };
  });

  useEffect(() => {
    let active = true;

    async function loadVisuals() {
      try {
        const res = await fetch("/api/console/insights", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;

        setVisuals({
          profilePictureUrl: data.profilePictureUrl ?? null,
          bannerUrl: data.bannerUrl ?? null,
          topPosts: Array.isArray(data.topPosts) ? data.topPosts : [],
        });
      } catch {
        // non-critical: examples still render without user imagery
      }
    }

    if (hasStore) {
      void loadVisuals();
    }

    return () => {
      active = false;
    };
  }, [hasStore]);

  function buildPromptWithXImages(basePrompt: string): string {
    if (!includeXImages || !visuals) return basePrompt;

    const postImageUrls = visuals.topPosts
      .map((p) => p.image_url)
      .filter((url): url is string => !!url)
      .slice(0, 4);

    const imageContext = [
      "",
      "Use these creator X images as visual references when generating this section:",
      `- Profile image: ${visuals.profilePictureUrl || "not available"}`,
      `- Banner image: ${visuals.bannerUrl || "not available"}`,
      `- Top post images: ${postImageUrls.length > 0 ? postImageUrls.join(", ") : "not available"}`,
      "If an image URL is unavailable, continue without it.",
    ].join("\n");

    return `${basePrompt}${imageContext}`;
  }

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");
    setResult("");

    try {
      const message = buildPromptWithXImages(prompt);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, theme }),
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
          <p className="text-zinc-400 text-sm">Theme: <span className="text-indigo-400">{theme}</span></p>
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

      <div className="mb-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">Pick a direction</h2>
            <span className="text-xs text-zinc-500">6 options</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {dynamicOptions.map((option) => (
              <button
                key={option.title}
                type="button"
                onClick={() => setPrompt(option.prompt)}
                className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-2 text-left transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div
                  className={`relative h-28 overflow-hidden rounded-lg border border-white/10 ${option.previewClassName}`}
                  style={{
                    backgroundImage: visuals?.bannerUrl
                      ? `linear-gradient(to top, rgba(9,9,11,0.8), rgba(9,9,11,0.1)), url(${visuals.bannerUrl})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-2 left-2 flex items-center gap-2">
                    {visuals?.profilePictureUrl ? (
                      <div
                        className="h-8 w-8 rounded-full border border-white/60"
                        style={{
                          backgroundImage: `url(${visuals.profilePictureUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full border border-zinc-700 bg-zinc-800" />
                    )}
                    <span className="text-xs font-medium text-white/95">{option.title}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
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

          <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
            <label className="flex items-center justify-between gap-3 text-xs text-zinc-300">
              <span>Use images from my X profile</span>
              <input
                type="checkbox"
                checked={includeXImages}
                onChange={(e) => setIncludeXImages(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500 focus:ring-indigo-500"
              />
            </label>
          </div>

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
        <div className="[&_p]:text-zinc-400 [&_button]:cursor-pointer [&_.text-gray-800]:text-white [&_.text-gray-400]:text-zinc-500 [&_.text-gray-500]:text-zinc-500 [&_.bg-gray-100]:bg-zinc-800 [&_.bg-purple-700]:bg-indigo-600 [&_.divide-gray-100]:divide-zinc-800">
          <BuildLibrary onLoad={handleLoad} />
        </div>
      </div>
    </div>
  );
}
