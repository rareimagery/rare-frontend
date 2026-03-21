"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Puck } from "@measured/puck";
import type { Data, Config } from "@measured/puck";
import "@measured/puck/puck.css";
import TemplateStarterPanel from "@/components/builder/TemplateStarterPanel";
import {
  EMPTY_CANVAS,
  TEMPLATE_STARTERS,
  type TemplateStarter,
  type TemplatePreviewPayload,
} from "@/components/builder/templateStarters";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type JsonRecord = Record<string, unknown>;

const LAYOUT_SCHEMA_VERSION = 1;

const puckConfig: Config = {
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        ctaLabel: { type: "text" },
        stylePreset: { type: "text" },
        avatarUrl: { type: "text" },
        bannerUrl: { type: "text" },
      },
      defaultProps: {
        title: "Creator Store",
        subtitle: "Products + Support in one place",
        ctaLabel: "Shop New Drop",
        stylePreset: "studio",
        avatarUrl: "",
        bannerUrl: "",
      },
      render: (props: unknown) => {
        const { title, subtitle, ctaLabel, stylePreset, avatarUrl, bannerUrl } = (props || {}) as {
          title?: string;
          subtitle?: string;
          ctaLabel?: string;
          stylePreset?: string;
          avatarUrl?: string;
          bannerUrl?: string;
        };

        const preset = stylePreset || "studio";
        const overlay =
          preset === "drop"
            ? "rgba(124, 45, 18, .58), rgba(15, 23, 42, .78)"
            : preset === "editorial"
              ? "rgba(30, 41, 59, .58), rgba(17, 24, 39, .78)"
              : preset === "members"
                ? "rgba(6, 78, 59, .58), rgba(6, 95, 70, .76)"
                : "rgba(17,24,39,.55), rgba(17,24,39,.75)";

        const fallbackGradient =
          preset === "drop"
            ? "linear-gradient(to bottom right, rgb(251 146 60), rgb(220 38 38), rgb(41 37 36))"
            : preset === "editorial"
              ? "linear-gradient(to bottom right, rgb(100 116 139), rgb(30 41 59), rgb(23 23 23))"
              : preset === "members"
                ? "linear-gradient(to bottom right, rgb(16 185 129), rgb(5 150 105), rgb(6 78 59))"
                : "linear-gradient(to bottom right, rgb(67 56 202), rgb(124 58 237), rgb(24 24 27))";

        const buttonClass =
          preset === "drop"
            ? "bg-amber-300 text-black hover:bg-amber-200"
            : preset === "members"
              ? "bg-emerald-100 text-emerald-950 hover:bg-emerald-50"
              : "bg-white text-black hover:bg-zinc-100";

        return (
          <div
            className="flex h-96 items-center justify-center px-6 text-white"
            style={{
              backgroundImage: bannerUrl
                ? `linear-gradient(${overlay}), url(${bannerUrl})`
                : fallbackGradient,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="max-w-3xl text-center">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Creator avatar"
                  className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-white/80 object-cover shadow-lg"
                />
              ) : null}
              <h1 className="text-5xl font-bold sm:text-6xl">{title || "Creator Store"}</h1>
              <p className="mt-4 text-xl sm:text-2xl">{subtitle || "Products + Support in one place"}</p>
              <button className={`mt-8 rounded-full px-6 py-2 text-sm font-semibold ${buttonClass}`}>
                {ctaLabel || "Shop New Drop"}
              </button>
            </div>
          </div>
        );
      },
    },
    ProductGrid: {
      fields: {
        heading: { type: "text" },
        subheading: { type: "text" },
        stylePreset: { type: "text" },
      },
      defaultProps: {
        heading: "Featured Collection",
        subheading: "Ready to wear, signed drops, and exclusive edits.",
        stylePreset: "studio",
      },
      render: (props: unknown) => {
        const { heading, subheading, stylePreset, productCards } = (props || {}) as {
          heading?: string;
          subheading?: string;
          stylePreset?: string;
          productCards?: Array<{ id?: string; title?: string; price?: number; image?: string }>;
        };

        const preset = stylePreset || "studio";
        const sectionClass =
          preset === "drop"
            ? "bg-stone-900"
            : preset === "editorial"
              ? "bg-slate-950"
              : preset === "members"
                ? "bg-emerald-950"
                : "bg-zinc-900";

        const cardClass =
          preset === "drop"
            ? "border-amber-700/40 bg-stone-800"
            : preset === "editorial"
              ? "border-slate-700 bg-slate-900"
              : preset === "members"
                ? "border-emerald-700/40 bg-emerald-900/40"
                : "border-zinc-700 bg-zinc-800";

        const cards = Array.isArray(productCards) && productCards.length
          ? productCards.slice(0, 3)
          : [
              { id: "drop-tee", title: "Drop Tee", price: 49 },
              { id: "poster-pack", title: "Poster Pack", price: 49 },
              { id: "limited-print", title: "Limited Print", price: 49 },
            ];

        return (
          <section className={`${sectionClass} p-8`}>
            <h2 className="text-2xl font-semibold text-white">{heading || "Featured Collection"}</h2>
            <p className="mt-2 text-sm text-zinc-400">
              {subheading || "Ready to wear, signed drops, and exclusive edits."}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {cards.map((card, index) => (
                <article key={card.id || `card-${index}`} className={`rounded-xl border p-4 ${cardClass}`}>
                  {card.image ? (
                    <img src={card.image} alt={card.title || "Product"} className="h-40 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="h-40 rounded-lg bg-zinc-700" />
                  )}
                  <p className="mt-4 text-sm font-medium text-zinc-100">{card.title || "Untitled product"}</p>
                  <p className="text-xs text-zinc-400">${Number(card.price ?? 49).toFixed(2)}</p>
                </article>
              ))}
            </div>
          </section>
        );
      },
    },
    DonationBar: {
      fields: {
        title: { type: "text" },
        progressText: { type: "text" },
        stylePreset: { type: "text" },
      },
      defaultProps: {
        title: "Support this creator",
        progressText: "62% to monthly goal",
        stylePreset: "studio",
      },
      render: (props: unknown) => {
        const { title, progressText, stylePreset } = (props || {}) as {
          title?: string;
          progressText?: string;
          stylePreset?: string;
        };

        const preset = stylePreset || "studio";
        const sectionClass =
          preset === "drop"
            ? "bg-amber-600"
            : preset === "editorial"
              ? "bg-slate-700"
              : preset === "members"
                ? "bg-emerald-700"
                : "bg-emerald-600";

        return (
          <section className={`${sectionClass} p-8 text-white`}>
            <div className="mx-auto max-w-4xl">
              <p className="text-2xl font-bold">{title || "Support this creator"}</p>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-emerald-900/50">
                <div className="h-full w-[62%] bg-white" />
              </div>
              <p className="mt-2 text-sm text-emerald-100">{progressText || "62% to monthly goal"}</p>
            </div>
          </section>
        );
      },
    },
    PostsList: {
      fields: {
        heading: { type: "text" },
        stylePreset: { type: "text" },
      },
      defaultProps: {
        heading: "Latest Posts",
        stylePreset: "studio",
      },
      render: (props: unknown) => {
        const { heading, stylePreset } = (props || {}) as {
          heading?: string;
          stylePreset?: string;
        };

        const preset = stylePreset || "studio";
        const sectionClass =
          preset === "drop"
            ? "bg-stone-950"
            : preset === "editorial"
              ? "bg-slate-950"
              : preset === "members"
                ? "bg-emerald-950"
                : "bg-zinc-950";

        const cardClass =
          preset === "drop"
            ? "border-amber-900/60 bg-stone-900"
            : preset === "editorial"
              ? "border-slate-800 bg-slate-900"
              : preset === "members"
                ? "border-emerald-900/60 bg-emerald-900/40"
                : "border-zinc-800 bg-zinc-900";

        return (
          <section className={`${sectionClass} p-8 text-zinc-100`}>
            <h2 className="text-2xl font-semibold text-white">{heading || "Latest Posts"}</h2>
            <div className="mt-4 space-y-3">
              <article className={`rounded-xl border p-4 text-sm ${cardClass}`}>
                Drop is live now. Grab early access before midnight.
              </article>
              <article className={`rounded-xl border p-4 text-sm ${cardClass}`}>
                New creator bundle coming this weekend.
              </article>
              <article className={`rounded-xl border p-4 text-sm ${cardClass}`}>
                Subscribers unlocked a behind-the-scenes update.
              </article>
            </div>
          </section>
        );
      },
    },
  },
};

function isPuckData(value: unknown): value is Data {
  return Boolean(
    value &&
      typeof value === "object" &&
      "content" in (value as Record<string, unknown>) &&
      Array.isArray((value as { content: unknown[] }).content)
  );
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeAiPuckData(value: unknown): Data | null {
  if (!isPuckData(value)) return null;

  const allowedTypes = new Set(Object.keys(puckConfig.components));
  const raw = value as JsonRecord;
  const rawContent = raw.content;

  if (!Array.isArray(rawContent)) return null;

  const sanitizedContent: Data["content"] = [];

  for (const item of rawContent) {
    if (!isJsonRecord(item)) return null;

    const type = item.type;
    if (typeof type !== "string" || !allowedTypes.has(type)) {
      return null;
    }

    const props = isJsonRecord(item.props) ? item.props : {};
    sanitizedContent.push({ type, props });
  }

  const root = isJsonRecord(raw.root) && isJsonRecord(raw.root.props) ? { props: raw.root.props } : { props: {} };
  return { content: sanitizedContent, root };
}

function parseAiLayoutResponse(value: unknown): { data: Data; version: number } | null {
  const directData = sanitizeAiPuckData(value);
  if (directData) {
    return { data: directData, version: LAYOUT_SCHEMA_VERSION };
  }

  if (!isJsonRecord(value)) return null;

  const rawVersion = value.layoutSchemaVersion;
  const rawData = value.data;

  if (typeof rawVersion !== "number" || !Number.isInteger(rawVersion)) {
    return null;
  }

  if (rawVersion !== LAYOUT_SCHEMA_VERSION) {
    return null;
  }

  const sanitized = sanitizeAiPuckData(rawData);
  if (!sanitized) return null;

  return { data: sanitized, version: rawVersion };
}

async function streamBuilderChat(message: string, onChunk: (value: string) => void) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, theme: "template-builder" }),
  });

  if (response.status === 429) {
    throw new Error("Rate limit reached. Try again in an hour.");
  }

  if (!response.ok || !response.body) {
    throw new Error("Chat request failed.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
    onChunk(fullText);
  }

  return fullText;
}

function mapTemplateToStarter(template: string): string {
  const lookup: Record<string, string> = {
    retro: "subscriber-funnel",
    "modern-cart": "modern-store",
    "ai-video-store": "product-drop",
    "latest-posts": "content-commerce",
    blank: "blank",
  };

  return lookup[template] || "modern-store";
}

function BuilderNewTabInner() {
  const searchParams = useSearchParams();
  const initialTemplate = searchParams.get("template") || "modern-cart";
  const storeSlug = searchParams.get("store") || "";
  const handleParam = searchParams.get("handle") || (storeSlug ? `@${storeSlug}` : "@rareimagery");
  const handle = handleParam.startsWith("@") ? handleParam : `@${handleParam}`;
  const pfp = searchParams.get("pfp") || "https://picsum.photos/id/64/80/80";
  const banner = searchParams.get("banner") || "https://picsum.photos/id/1015/1920/400";
  const normalizedHandle = handle.replace(/^@/, "").toLowerCase();

  const [data, setData] = useState<Data>(EMPTY_CANVAS);
  const [message, setMessage] = useState("Build a modern conversion-focused storefront using profile data.");
  const [sending, setSending] = useState(false);
  const [saveLabel, setSaveLabel] = useState(`${normalizedHandle || "creator"} Build`);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [previewPayload, setPreviewPayload] = useState<TemplatePreviewPayload | null>(null);
  const [activeStarterId, setActiveStarterId] = useState<string>("blank");
  const [autoIncludeProfileMedia, setAutoIncludeProfileMedia] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Profile data is loading. Pick a template on the right, or ask AI to generate sections.",
    },
  ]);

  const initialStarterApplied = useRef(false);
  const activeBanner = useMemo(() => ({ backgroundImage: `url(${banner})`, backgroundSize: "cover" }), [banner]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ri:autoIncludeProfileMedia:v2");
      if (saved === "true") setAutoIncludeProfileMedia(true);
      if (saved === "false") setAutoIncludeProfileMedia(false);
    } catch {
      // Ignore storage access failures (e.g., private mode restrictions).
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("ri:autoIncludeProfileMedia:v2", autoIncludeProfileMedia ? "true" : "false");
    } catch {
      // Ignore storage write failures.
    }
  }, [autoIncludeProfileMedia]);

  useEffect(() => {
    let mounted = true;

    async function loadPreviewPayload() {
      try {
        const res = await fetch(`/api/template-preview/${encodeURIComponent(normalizedHandle)}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const payload = (await res.json()) as TemplatePreviewPayload;
        if (!mounted) return;
        setPreviewPayload(payload);
      } catch {
        if (!mounted) return;
        setPreviewPayload(null);
      }
    }

    void loadPreviewPayload();
    return () => {
      mounted = false;
    };
  }, [normalizedHandle]);

  function applyStarter(starter: TemplateStarter) {
    const input = {
      handle: normalizedHandle,
      bio: previewPayload?.bio || "",
      avatar: autoIncludeProfileMedia ? previewPayload?.avatar || pfp : "",
      banner: autoIncludeProfileMedia ? previewPayload?.banner || banner : "",
      products: previewPayload?.products || [],
      posts: previewPayload?.posts || [],
    };

    setData(starter.createData(input));
    setActiveStarterId(starter.id);
    setStatus(`Applied template: ${starter.name}`);
  }

  useEffect(() => {
    if (initialStarterApplied.current) return;
    if (!previewPayload) return;

    const starterId = mapTemplateToStarter(initialTemplate);
    const starter = TEMPLATE_STARTERS.find((item) => item.id === starterId) || TEMPLATE_STARTERS[0];

    const input = {
      handle: normalizedHandle,
      bio: previewPayload?.bio || "",
      avatar: autoIncludeProfileMedia ? previewPayload?.avatar || pfp : "",
      banner: autoIncludeProfileMedia ? previewPayload?.banner || banner : "",
      products: previewPayload?.products || [],
      posts: previewPayload?.posts || [],
    };

    setData(starter.createData(input));
    setActiveStarterId(starter.id);
    setStatus(`Applied template: ${starter.name}`);
    initialStarterApplied.current = true;
  }, [autoIncludeProfileMedia, banner, initialTemplate, normalizedHandle, pfp, previewPayload]);

  async function sendToAssistant() {
    if (!message.trim() || sending) return;

    const userMessage: ChatMessage = { role: "user", content: message.trim() };
    const nextHistory = [...chatHistory, userMessage];
    setChatHistory(nextHistory);
    setMessage("");
    setSending(true);
    setStatus("");

    setChatHistory((prev) => [...prev, { role: "assistant", content: "" }]);

    const systemPrompt = [
      "You are an expert Next.js and Tailwind storefront builder.",
      "Return strict JSON only when producing a Puck data update.",
      `Preferred JSON format: { \"layoutSchemaVersion\": ${LAYOUT_SCHEMA_VERSION}, \"data\": { \"content\": [...] } }.`,
      "Backward-compatible format with top-level content array is accepted but not preferred.",
      `Creator handle: ${handle}.`,
      autoIncludeProfileMedia
        ? `Profile avatar URL: ${previewPayload?.avatar || pfp}. Profile banner URL: ${previewPayload?.banner || banner}. Include these automatically in hero and branding sections unless user asks otherwise.`
        : "Do not automatically include avatar or banner unless the user explicitly asks for them.",
      `Known products: ${(previewPayload?.products || []).map((p) => p.title).join(", ") || "none"}`,
      `Known posts: ${(previewPayload?.posts || []).map((p) => p.text).join(" | ") || "none"}`,
    ].join(" ");

    const stitchedMessage = `${systemPrompt}\n\nConversation:\n${nextHistory
      .map((entry) => `${entry.role}: ${entry.content}`)
      .join("\n")}`;

    try {
      const reply = await streamBuilderChat(stitchedMessage, (chunk) => {
        setChatHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: chunk };
          return updated;
        });
      });

      try {
        const parsed = JSON.parse(reply);
        const layout = parseAiLayoutResponse(parsed);
        if (layout) {
          setData(layout.data);
          setStatus(`Applied AI JSON update to canvas (schema v${layout.version}).`);
        } else {
          setStatus("AI returned JSON, but it did not match the builder schema.");
        }
      } catch {
        // Non-JSON responses remain as guidance in chat history.
      }
    } catch (err) {
      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: err instanceof Error ? err.message : "Could not reach assistant.",
        };
        return updated;
      });
    } finally {
      setSending(false);
    }
  }

  async function saveBuild() {
    if (!saveLabel.trim()) return;

    setSaving(true);
    setStatus("");

    try {
      const code = JSON.stringify(
        {
          type: "puck",
          version: 1,
          handle,
          store: storeSlug || null,
          data,
        },
        null,
        2
      );

      const response = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: saveLabel.trim(),
          code,
        }),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json?.error || "Could not save builder state.");
      }

      setStatus(`Build saved for ${handle}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
          <div className="flex items-center gap-4">
            <Image src={previewPayload?.avatar || pfp} alt="Profile" width={32} height={32} unoptimized className="h-8 w-8 rounded-full" />
            <div className="text-xl font-bold">{handle} Builder</div>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={saveLabel}
              onChange={(event) => setSaveLabel(event.target.value)}
              className="h-9 rounded-full border border-zinc-700 bg-zinc-800 px-4 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              placeholder="Build name"
            />
            <button
              onClick={() => applyStarter(TEMPLATE_STARTERS[0])}
              className="rounded-full border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500"
            >
              Blank
            </button>
            <button
              onClick={() => void saveBuild()}
              disabled={saving || !saveLabel.trim()}
              className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Build"}
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-20" style={activeBanner} />
          <div className="relative z-10 h-full puck-root overflow-auto bg-zinc-950/80 p-3">
            <Puck config={puckConfig} data={data} onChange={setData} />
          </div>
        </div>
      </div>

      <TemplateStarterPanel
        starters={TEMPLATE_STARTERS}
        activeStarterId={activeStarterId}
        onSelectStarter={applyStarter}
        autoIncludeProfileMedia={autoIncludeProfileMedia}
        onAutoIncludeProfileMediaChange={setAutoIncludeProfileMedia}
        chatHistory={chatHistory}
        message={message}
        sending={sending}
        onMessageChange={setMessage}
        onSend={() => void sendToAssistant()}
        handle={normalizedHandle}
        productCount={(previewPayload?.products || []).length}
        postCount={(previewPayload?.posts || []).length}
      />

      {status && (
        <div className="fixed bottom-6 left-6 z-50 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-xs text-zinc-200">
          {status}
        </div>
      )}
    </div>
  );
}

export default function BuilderNewTabPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 p-6 text-sm text-zinc-400">Loading builder workspace...</div>}>
      <BuilderNewTabInner />
    </Suspense>
  );
}
