"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Puck } from "@measured/puck";
import type { Data } from "@measured/puck";
import type { Config } from "@measured/puck";
import { MessageCircle, Send, X } from "lucide-react";
import "@measured/puck/puck.css";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

const puckConfig: Config = {
  components: {
    Hero: {
      fields: {
        title: { type: "text" },
        subtitle: { type: "text" },
        ctaLabel: { type: "text" },
      },
      defaultProps: {
        title: "Creator Store",
        subtitle: "Products + X Money Donations",
        ctaLabel: "Shop New Drop",
      },
      render: (props: unknown) => {
        const { title, subtitle, ctaLabel } = (props || {}) as {
          title?: string;
          subtitle?: string;
          ctaLabel?: string;
        };

        return (
      <div className="flex h-96 items-center justify-center bg-gradient-to-br from-indigo-700 via-violet-600 to-zinc-900 px-6 text-white">
        <div className="text-center max-w-3xl">
            <h1 className="text-5xl font-bold sm:text-6xl">{title || "Creator Store"}</h1>
            <p className="mt-4 text-xl sm:text-2xl">{subtitle || "Products + X Money Donations"}</p>
            <button className="mt-8 rounded-full bg-white px-6 py-2 text-sm font-semibold text-black hover:bg-zinc-100">
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
      },
      defaultProps: {
        heading: "Featured Collection",
        subheading: "Ready to wear, signed drops, and exclusive edits.",
      },
      render: (props: unknown) => {
        const { heading, subheading } = (props || {}) as {
          heading?: string;
          subheading?: string;
        };

        return (
      <section className="bg-zinc-900 p-8">
        <h2 className="text-2xl font-semibold text-white">{heading || "Featured Collection"}</h2>
        <p className="mt-2 text-sm text-zinc-400">{subheading || "Ready to wear, signed drops, and exclusive edits."}</p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {["Drop Tee", "Poster Pack", "Limited Print"].map((name) => (
            <article key={name} className="rounded-xl border border-zinc-700 bg-zinc-800 p-4">
              <div className="h-40 rounded-lg bg-zinc-700" />
              <p className="mt-4 text-sm font-medium text-zinc-100">{name}</p>
              <p className="text-xs text-zinc-400">$49.00</p>
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
      },
      defaultProps: {
        title: "Support with X Money",
        progressText: "62% to monthly goal",
      },
      render: (props: unknown) => {
        const { title, progressText } = (props || {}) as {
          title?: string;
          progressText?: string;
        };

        return (
      <section className="bg-emerald-600 p-8 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-2xl font-bold">{title || "Support with X Money"}</p>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-emerald-900/50">
            <div className="h-full w-[62%] bg-white" />
          </div>
          <p className="mt-2 text-sm text-emerald-100">{progressText || "62% to monthly goal"}</p>
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

async function streamThemeChat(message: string, theme: string, onChunk: (value: string) => void) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, theme }),
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

function BuilderPopupInner() {
  const searchParams = useSearchParams();
  const initialTheme = searchParams.get("theme") || "xai3";
  const initialTemplate = searchParams.get("template") || "Template";
  const initialPrompt = searchParams.get("prompt") || "";
  const storeSlug = searchParams.get("store") || "";
  const handleParam = searchParams.get("handle") || (storeSlug ? `@${storeSlug}` : "@rareimagery");
  const handle = handleParam.startsWith("@") ? handleParam : `@${handleParam}`;
  const pfp = searchParams.get("pfp") || "https://picsum.photos/id/64/80/80";
  const banner = searchParams.get("banner") || "https://picsum.photos/id/1015/1920/400";

  const [data, setData] = useState<Data>({
    content: [
      { type: "Hero", props: { title: `${handle} Store`, subtitle: "Products + X Money Donations", ctaLabel: "Shop New Drop" } },
      { type: "ProductGrid", props: { heading: "Featured Collection", subheading: "Ready to wear, signed drops, and exclusive edits." } },
      { type: "DonationBar", props: { title: "Support with X Money", progressText: "62% to monthly goal" } },
    ],
    root: { props: {} },
  });
  const [chatOpen, setChatOpen] = useState(true);
  const [message, setMessage] = useState(initialPrompt);
  const [sending, setSending] = useState(false);
  const [saveLabel, setSaveLabel] = useState(`${initialTemplate} Draft`);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi. I am your Tailwind + Next.js builder bot. Ask for changes like: Add a floating X Money donate button and make the hero full-bleed with my PFP on the left.",
    },
  ]);

  const activeBanner = useMemo(() => ({ backgroundImage: `url(${banner})`, backgroundSize: "cover" }), [banner]);

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
      "You are an expert Tailwind + Next.js storefront builder for X creators.",
      "Return either strict JSON for Puck data updates or concise code suggestions.",
      `Current store handle: ${handle}.`,
      "If returning JSON, include at minimum a top-level content array.",
    ].join(" ");

    const stitchedMessage = `${systemPrompt}\n\nConversation:\n${nextHistory
      .map((entry) => `${entry.role}: ${entry.content}`)
      .join("\n")}`;

    try {
      const reply = await streamThemeChat(stitchedMessage, initialTheme, (chunk) => {
        setChatHistory((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: chunk };
          return updated;
        });
      });

      try {
        const parsed = JSON.parse(reply);
        if (isPuckData(parsed)) {
          setData(parsed);
          setStatus("Applied AI JSON update to canvas.");
        }
      } catch {
        // Non-JSON responses are treated as guidance text.
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

  async function applyStore() {
    if (!saveLabel.trim()) return;

    setSaving(true);
    setStatus("");

    try {
      const code = JSON.stringify(
        {
          type: "puck",
          version: 1,
          theme: initialTheme,
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

      setStatus(`Store build saved for ${handle}.`);
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          {
            type: "ri-builder-build-saved",
            label: saveLabel.trim(),
          },
          window.location.origin
        );
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Apply failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
          <div className="flex items-center gap-4">
            <Image src={pfp} alt="Profile" width={32} height={32} unoptimized className="h-8 w-8 rounded-full" />
            <div className="text-xl font-bold">{handle} Store Builder</div>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={saveLabel}
              onChange={(event) => setSaveLabel(event.target.value)}
              className="h-9 rounded-full border border-zinc-700 bg-zinc-800 px-4 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              placeholder="Build name"
            />
            <button
              onClick={() => void applyStore()}
              disabled={saving || !saveLabel.trim()}
              className="rounded-full bg-white px-6 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Apply & Create My Store"}
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

      {chatOpen ? (
        <div className="fixed bottom-8 right-8 z-50 flex h-[500px] w-96 flex-col rounded-3xl border border-zinc-700 bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between rounded-t-3xl bg-zinc-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-semibold">
                G
              </div>
              <div>
                <div className="font-semibold">Grok Store Builder</div>
                <div className="text-xs text-emerald-400">Live Tailwind editor</div>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-zinc-300 hover:text-white" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-6 text-sm">
            {chatHistory.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={entry.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[80%] rounded-2xl px-4 py-3 ${
                    entry.role === "user" ? "bg-blue-600" : "bg-zinc-800"
                  }`}
                >
                  {entry.content || (sending && index === chatHistory.length - 1 ? "Thinking..." : "")}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 border-t border-zinc-700 p-4">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void sendToAssistant();
              }}
              placeholder="Make the donation bar glow emerald..."
              className="flex-1 rounded-full bg-zinc-800 px-6 py-3 text-sm focus:outline-none"
            />
            <button
              onClick={() => void sendToAssistant()}
              disabled={sending || !message.trim()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black hover:bg-emerald-400 disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500"
          aria-label="Open chat"
        >
          <MessageCircle size={20} />
        </button>
      )}

      {status && (
        <div className="fixed left-6 bottom-6 z-50 rounded-xl border border-zinc-700 bg-zinc-900/95 px-4 py-2 text-xs text-zinc-200">
          {status}
        </div>
      )}
    </div>
  );
}

export default function BuilderPopupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 p-6 text-sm text-zinc-400">Loading builder workspace...</div>}>
      <BuilderPopupInner />
    </Suspense>
  );
}
