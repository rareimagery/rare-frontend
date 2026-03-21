'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LiveThemePreview from '@/components/LiveThemePreview';
import SubscribeButton from '@/components/SubscribeButton';
import { AIBubble } from '@/components/AIBubble';
import DraggableLibrary from '@/components/DraggableLibrary';
import { fetchDrupalDataForCreator } from '@/app/actions/drupalContext';
import { savePlaygroundDraft, publishSite } from '@/app/actions/playground';

type TemplateId = 'retro' | 'modern-cart' | 'ai-video-store' | 'latest-posts' | 'blank';

type PreviewState = {
  templateId: TemplateId;
  extraComponents: string[];
  customCSS: string;
};

const QUICK_BUILD_IDEAS: Array<{ label: string; id: TemplateId }> = [
  { label: 'AI Video Store (Grok-first)', id: 'ai-video-store' },
  { label: 'Modern Shopping Cart + Subs', id: 'modern-cart' },
  { label: 'Retro Memories Feed', id: 'retro' },
  { label: 'Latest X Posts + $4 CTA', id: 'latest-posts' },
  { label: 'Blank Canvas (AI will fill)', id: 'blank' },
];

export default function PlaygroundPage() {
  const params = useParams<{ handle: string }>();
  const handle = useMemo(() => (params?.handle || '').replace(/^@+/, ''), [params?.handle]);

  const [previewData, setPreviewData] = useState<PreviewState>({
    templateId: 'blank',
    extraComponents: [],
    customCSS: '',
  });
  const [drupalContext, setDrupalContext] = useState<unknown>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState('');
  const [dropActive, setDropActive] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!handle) return;

    let active = true;
    (async () => {
      try {
        const data = await fetchDrupalDataForCreator(handle);
        if (!active) return;
        setDrupalContext(data);
      } catch {
        if (!active) return;
        setDrupalContext(null);
      }
    })();

    return () => { active = false; };
  }, [handle]);

  useEffect(() => {
    if (!handle) return;

    const timer = setTimeout(async () => {
      try {
        setSavingDraft(true);
        await savePlaygroundDraft(handle, previewData.templateId, previewData.customCSS, previewData.extraComponents);
        setStatus('Draft auto-saved.');
      } catch {
        setStatus('Could not auto-save draft.');
      } finally {
        setSavingDraft(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [handle, previewData]);

  const addComponent = (id: string) => {
    setPreviewData((prev) => ({
      ...prev,
      extraComponents: Array.from(new Set([...prev.extraComponents, id])),
    }));
  };

  const addFromTemplate = (templateId: TemplateId) => {
    setPreviewData((prev) => ({
      ...prev,
      templateId,
      extraComponents: Array.from(new Set([...prev.extraComponents, 'subscriber-hero'])),
    }));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropActive(false);
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      addComponent(id);
      setStatus(`Added: ${id}`);
    }
  };

  const handlePublish = async () => {
    if (!handle) return;
    try {
      setPublishing(true);
      setStatus('');
      await publishSite(handle, previewData.templateId, previewData.customCSS, previewData.extraComponents);
      window.alert(`Site published to rareimagery.net/shop/${handle}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Publish failed.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      {/* Left panel: Draggable blocks + template picker */}
      <div className="flex flex-col overflow-hidden border-r border-zinc-800 bg-zinc-900 text-zinc-100">
        <DraggableLibrary />

        <div className="border-t border-zinc-800 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Templates</p>
          <div className="space-y-2">
            {QUICK_BUILD_IDEAS.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className="h-auto w-full justify-start py-3 text-left text-xs"
                onClick={() => addFromTemplate(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-800 p-4">
          <div className="mb-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
            {savingDraft ? 'Saving draft…' : status || 'AI Studio ready.'}
          </div>
          <Button
            onClick={() => void handlePublish()}
            className="w-full bg-green-500 text-sm font-bold text-black hover:bg-green-400"
            disabled={publishing || !handle}
          >
            {publishing ? 'Publishing…' : 'Publish to My Shop'}
          </Button>
        </div>
      </div>

      {/* Center: drop zone + preview */}
      <div
        ref={dropZoneRef}
        className={`flex flex-1 items-center justify-center overflow-auto p-8 transition-colors ${
          dropActive ? 'bg-[#1DA1F2]/10 ring-inset ring-2 ring-[#1DA1F2]/40' : 'bg-zinc-950'
        }`}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropActive(true); }}
        onDragLeave={(e) => { if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) setDropActive(false); }}
        onDrop={handleDrop}
      >
        {dropActive && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border-2 border-dashed border-[#1DA1F2]/60 bg-[#1DA1F2]/5 px-8 py-6 text-sm font-semibold text-[#1DA1F2]">
              Drop to add section
            </div>
          </div>
        )}

        <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-zinc-800 bg-white shadow-2xl">
          <div className="flex h-12 items-center bg-black px-4 text-xs text-white">
            rareimagery.net/@{handle || 'creator'}
          </div>

          <LiveThemePreview
            templateId={previewData.templateId}
            handle={handle}
            extraComponents={previewData.extraComponents}
            customCSS={previewData.customCSS}
            avatar={(drupalContext as Record<string, unknown>)?.avatar as string | undefined}
          />

          <div className="border-t bg-zinc-50 p-6">
            <SubscribeButton creatorHandle={handle} />
          </div>
        </div>
      </div>

      <AIBubble
        handle={handle}
        drupalContext={drupalContext}
        onSuggestion={(newCSS, newComponents) => {
          setPreviewData((prev) => ({
            ...prev,
            customCSS: newCSS || prev.customCSS,
            extraComponents: Array.from(new Set([...prev.extraComponents, ...(newComponents || [])])),
          }));
          setStatus('Applied AI suggestion.');
        }}
      />
    </div>
  );
}
