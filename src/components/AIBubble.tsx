'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AIBubbleProps = {
  handle: string;
  drupalContext: unknown;
  onSuggestion: (css: string, components: string[]) => void;
};

export function AIBubble({ handle, drupalContext, onSuggestion }: AIBubbleProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const sendToGrok = async () => {
    if (!prompt.trim() || loading) return;

    try {
      setLoading(true);
      const res = await fetch('/api/ai-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, handle, drupalContext }),
      });

      if (!res.ok) {
        throw new Error(`AI request failed (${res.status})`);
      }

      const json = (await res.json()) as {
        tailwindCode?: string;
        componentsToAdd?: string[];
      };

      onSuggestion(json.tailwindCode || '', json.componentsToAdd || []);
      setOpen(false);
      setPrompt('');
    } catch (error) {
      console.error('AIBubble request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-50 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-[#1DA1F2] text-2xl shadow-2xl transition-all hover:scale-110"
        role="button"
        aria-label="Open AI Studio"
      >
        AI
      </div>

      {open && (
        <div className="fixed bottom-24 right-8 z-50 w-96 overflow-hidden rounded-3xl border border-[#1DA1F2] bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between border-b bg-black p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">AI</div>
              <div>
                <div className="font-bold">Grok AI Studio</div>
                <div className="text-xs text-green-400">Uses your Drupal context + Next.js layout hints</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white"
              aria-label="Close AI Studio"
            >
              <X size={16} />
            </button>
          </div>

          <div className="h-96 overflow-auto p-4 text-sm">
            Example prompt ideas:
            <ul className="mt-4 space-y-2 text-xs">
              <li>- Make the top section a hero with my latest video and a $4 subscribe CTA.</li>
              <li>- Add a grid of my top 3 products with checkout-focused copy.</li>
              <li>- Give this a retro social profile vibe with bold subscriber messaging.</li>
            </ul>
          </div>

          <div className="border-t bg-zinc-950 p-4">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell Grok what to build..."
              className="w-full rounded-2xl bg-zinc-800 p-4 text-white"
            />
            <Button
              onClick={() => void sendToGrok()}
              disabled={loading || !prompt.trim()}
              className="mt-4 w-full bg-[#1DA1F2] text-black hover:bg-[#1A8CD8]"
            >
              {loading ? 'Generating...' : 'Generate Next.js + Tailwind code'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
