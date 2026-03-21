'use client';

import { use, useEffect, useState } from 'react';
import DraggableLibrary from '@/components/DraggableLibrary';
import LiveThemePreview from '@/components/LiveThemePreview';
import { AIBubble } from '@/components/AIBubble';
import SubscribeButton from '@/components/SubscribeButton';
import { fetchDrupalDataForCreator } from '@/app/actions/drupalContext';
import { Button } from '@/components/ui/button';

type TemplateId = 'retro' | 'modern-cart' | 'ai-video-store' | 'latest-posts' | 'blank';

const QUICK_BUILD_IDEAS: Array<{ label: string; id: TemplateId }> = [
  { label: '🎥 AI Video Store (Grok-first)', id: 'ai-video-store' },
  { label: '🛒 Modern Shopping Cart + Subs', id: 'modern-cart' },
  { label: '📼 Retro Memories Feed', id: 'retro' },
  { label: '📜 Latest X Posts + $4 CTA', id: 'latest-posts' },
  { label: '✨ Blank Canvas (AI will fill)', id: 'blank' },
];

export default function CreatorStudio({ params }: { params: Promise<{ handle: string }> }) {
  const { handle: rawHandle } = use(params);
  const handle = rawHandle.replace(/^@+/, '');

  const [sections, setSections] = useState<string[]>(['subscriber-hero']);
  const [templateId, setTemplateId] = useState<TemplateId>('blank');
  const [customCSS, setCustomCSS] = useState('');
  const [drupalContext, setDrupalContext] = useState<unknown>(null);
  const [dropActive, setDropActive] = useState(false);

  useEffect(() => {
    if (!handle) return;
    fetchDrupalDataForCreator(handle)
      .then(setDrupalContext)
      .catch(() => setDrupalContext(null));
  }, [handle]);

  const addSection = (id: string) => {
    setSections((prev) => Array.from(new Set([...prev, id])));
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s !== id));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropActive(false);
    const blockType = e.dataTransfer.getData('text/plain');
    if (blockType) addSection(blockType);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* LEFT: Draggable block library */}
      <DraggableLibrary onDragStart={() => setDropActive(true)} />

      {/* CENTER: Drop zone + live preview */}
      <div
        className={`relative flex flex-1 items-start justify-center overflow-auto p-8 transition-colors ${
          dropActive ? 'bg-[#1DA1F2]/10 ring-inset ring-2 ring-[#1DA1F2]/40' : ''
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropActive(true); }}
        onDragLeave={(e) => { if (!(e.currentTarget as Node).contains(e.relatedTarget as Node)) setDropActive(false); }}
      >
        {dropActive && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-2xl border-2 border-dashed border-[#1DA1F2]/60 bg-[#1DA1F2]/5 px-8 py-6 text-sm font-semibold text-[#1DA1F2]">
              Drop to add section
            </div>
          </div>
        )}

        <div className="w-full max-w-[420px] overflow-hidden rounded-3xl border border-zinc-800 bg-white shadow-2xl">
          <div className="flex h-12 items-center bg-black px-4 text-xs text-white">
            rareimagery.net/@{handle || 'creator'}
          </div>

          <LiveThemePreview
            templateId={templateId}
            handle={handle}
            sections={sections}
            customCSS={customCSS}
            avatar={(drupalContext as Record<string, unknown>)?.avatar as string | undefined}
            drupalContext={drupalContext as Record<string, unknown> | undefined}
          />

          {/* Active sections list — click × to remove */}
          {sections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
              {sections.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSection(s)}
                    className="ml-0.5 text-zinc-500 hover:text-zinc-900"
                    aria-label={`Remove ${s}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="sticky bottom-0 border-t bg-zinc-50 p-6">
            <SubscribeButton creatorHandle={handle} />
          </div>
        </div>
      </div>

      {/* RIGHT: Quick Build Ideas */}
      <div className="flex w-72 shrink-0 flex-col overflow-auto border-l border-zinc-800 bg-zinc-900 p-5 text-zinc-100">
        <h2 className="mb-1 text-lg font-bold">Quick Build Ideas</h2>
        <p className="mb-4 text-xs text-zinc-500">Sets a template + subscriber CTA</p>

        <div className="space-y-2">
          {QUICK_BUILD_IDEAS.map((item) => (
            <Button
              key={item.id}
              variant="outline"
              className="h-auto w-full justify-start py-3 text-left text-sm"
              onClick={() => {
                setTemplateId(item.id);
                addSection('subscriber-hero');
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="mt-auto pt-6">
          <Button
            className="w-full bg-green-500 font-bold text-black hover:bg-green-400"
            onClick={() => alert(`Publish: rareimagery.net/shop/${handle}`)}
          >
            Publish to My Shop
          </Button>
        </div>
      </div>

      {/* FLOATING AI BUBBLE */}
      <AIBubble
        handle={handle}
        drupalContext={drupalContext}
        onSuggestion={(newCSS, newComponents) => {
          if (newCSS) setCustomCSS(newCSS);
          newComponents.forEach(addSection);
        }}
      />
    </div>
  );
}
