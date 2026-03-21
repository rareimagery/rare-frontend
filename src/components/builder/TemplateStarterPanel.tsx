"use client";

import { Send } from "lucide-react";
import type { TemplateStarter } from "@/components/builder/templateStarters";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type Props = {
  starters: TemplateStarter[];
  activeStarterId: string;
  onSelectStarter: (starter: TemplateStarter) => void;
  autoIncludeProfileMedia: boolean;
  onAutoIncludeProfileMediaChange: (enabled: boolean) => void;
  chatHistory: ChatMessage[];
  message: string;
  sending: boolean;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  handle: string;
  productCount: number;
  postCount: number;
};

export default function TemplateStarterPanel({
  starters,
  activeStarterId,
  onSelectStarter,
  autoIncludeProfileMedia,
  onAutoIncludeProfileMediaChange,
  chatHistory,
  message,
  sending,
  onMessageChange,
  onSend,
  handle,
  productCount,
  postCount,
}: Props) {
  return (
    <aside className="flex h-full w-96 shrink-0 flex-col border-l border-zinc-800 bg-zinc-900/95">
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
          Clickable templates
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Pick a starter to inject into your blank canvas.
        </p>
      </div>

      <div className="space-y-2 overflow-y-auto p-4">
        {starters.map((starter) => (
          <button
            key={starter.id}
            onClick={() => onSelectStarter(starter)}
            className={`w-full rounded-xl border p-3 text-left transition ${
              activeStarterId === starter.id
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-zinc-700 bg-zinc-800/70 hover:border-zinc-600"
            }`}
          >
            <p className="text-sm font-semibold text-white">{starter.name}</p>
            <p className="mt-1 text-xs text-zinc-400">{starter.description}</p>
          </button>
        ))}
      </div>

      <div className="border-t border-zinc-800 p-4">
        <h3 className="text-sm font-semibold text-zinc-200">AI Builder Assistant</h3>
        <p className="mt-1 text-xs text-zinc-400">
          Ask AI to generate or edit sections with creator data.
        </p>

        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/70 px-3 py-2 text-xs text-zinc-200">
          <input
            type="checkbox"
            checked={autoIncludeProfileMedia}
            onChange={(event) => onAutoIncludeProfileMediaChange(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-500 bg-zinc-900 text-emerald-400 focus:ring-emerald-400"
          />
          Auto-include profile avatar + banner
        </label>

        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1 text-xs">
          {chatHistory.map((entry, index) => (
            <div key={`${entry.role}-${index}`} className={entry.role === "user" ? "text-right" : "text-left"}>
              <div
                className={`inline-block max-w-[90%] rounded-lg px-3 py-2 ${
                  entry.role === "user" ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-100"
                }`}
              >
                {entry.content || (sending && index === chatHistory.length - 1 ? "Thinking..." : "")}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSend();
            }}
            placeholder="Build a clean hero with product CTA"
            className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none"
          />
          <button
            onClick={onSend}
            disabled={sending || !message.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black hover:bg-emerald-300 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>

        <p className="mt-2 text-[11px] text-zinc-500">
          Data source: @{handle} | {productCount} products | {postCount} posts
        </p>
      </div>
    </aside>
  );
}
