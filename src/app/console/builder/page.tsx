"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConsole } from "@/components/ConsoleContext";

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
  const { hasStore, storeSlug } = useConsole();
  const router = useRouter();

  const [visuals, setVisuals] = useState<InsightsVisualData | null>(null);
  const [launchingTitle, setLaunchingTitle] = useState<string | null>(null);

  const dynamicOptions = STYLE_OPTIONS.map((option) => {
    const promptContext = [
      option.prompt,
      "Use a template-first structure and keep code valid for Next.js + Tailwind.",
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

  function launchWorkspace(title: string, prompt: string) {
    setLaunchingTitle(title);
    const params = new URLSearchParams({
      template: title,
      prompt,
    });
    if (storeSlug) {
      params.set("store", storeSlug);
    }

    router.push(`/builder/new-tab?${params.toString()}`);
  }

  if (!hasStore) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Builder</h1>
        <p className="text-zinc-400">Create your store first to use the Page Builder.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Page Builder</h1>
          <p className="text-zinc-400 text-sm">Template-first builder with blank canvas workflow.</p>
        </div>
        {storeSlug && (
          <a
            href={`/stores/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            Open on live store
          </a>
        )}
      </div>

      <div className="mb-8">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Pick a template to start in popup</h2>
              <p className="text-xs text-zinc-500">Click any large preview to open the full AI editing workspace.</p>
            </div>
            <span className="text-xs text-zinc-500">{dynamicOptions.length} templates</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dynamicOptions.map((option) => (
              <button
                key={option.title}
                type="button"
                onClick={() => launchWorkspace(option.title, option.prompt)}
                className="group rounded-2xl border border-zinc-800 bg-zinc-950/70 p-2 text-left transition hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900"
              >
                <div
                  className={`relative h-52 overflow-hidden rounded-xl border border-white/10 ${option.previewClassName}`}
                  style={{
                    backgroundImage: visuals?.bannerUrl
                      ? `linear-gradient(to top, rgba(9,9,11,0.8), rgba(9,9,11,0.1)), url(${visuals.bannerUrl})`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-200">
                    Launch
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    {visuals?.profilePictureUrl ? (
                      <div
                        className="h-9 w-9 rounded-full border border-white/60"
                        style={{
                          backgroundImage: `url(${visuals.profilePictureUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full border border-zinc-700 bg-zinc-800" />
                    )}
                    <span className="text-sm font-semibold text-white/95">{option.title}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-1 pt-2 pb-1">
                    <span className="text-xs text-zinc-400">Open full builder workspace</span>
                  <span className="text-xs font-medium text-zinc-200 transition group-hover:text-white">Select</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 text-sm text-zinc-300">
        <p className="font-medium text-zinc-100">New flow</p>
        <p className="mt-1 text-xs text-zinc-400">
          Pick a template above to launch the full builder workspace. Prompt edits, AI refinement, generation, preview, and save actions now happen in the same flow.
        </p>
        {launchingTitle && (
          <p className="mt-2 text-xs text-indigo-300">Opening {launchingTitle} workspace...</p>
        )}
      </div>
    </div>
  );
}
