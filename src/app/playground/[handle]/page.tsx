'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LiveThemePreview from '@/components/LiveThemePreview';
import SubscribeButton from '@/components/SubscribeButton';
import { AIBubble } from '@/components/AIBubble';
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

    return () => {
      active = false;
    };
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

  const addFromTemplate = (templateId: TemplateId) => {
    setPreviewData((prev) => ({
      ...prev,
      templateId,
      extraComponents: Array.from(new Set([...prev.extraComponents, 'subscriber-hero'])),
    }));
  };

  const handlePublish = async () => {
    if (!handle) return;

    try {
      setPublishing(true);
      setStatus('');
      await publishSite(handle, previewData.templateId, previewData.customCSS, previewData.extraComponents);
      window.alert(`Site published to rareimagery.net/shop/${handle}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed.';
      setStatus(message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950">
      <div className="w-80 overflow-auto border-r border-zinc-800 bg-zinc-900 p-6 text-zinc-100">
        <h2 className="mb-6 text-2xl font-bold">Quick Build Ideas</h2>
        <div className="space-y-4">
          {QUICK_BUILD_IDEAS.map((item) => (
            <Button
              key={item.id}
              variant="outline"
              className="h-auto w-full justify-start py-6 text-left"
              onClick={() => addFromTemplate(item.id)}
            >
              <div>
                <div className="font-semibold">{item.label}</div>
                <div className="text-xs text-gray-400">Auto-adds subscriber CTA + your live context</div>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-xs text-zinc-400">
          {savingDraft ? 'Saving draft...' : status || 'AI Studio ready.'}
        </div>

        <Button
          onClick={() => void handlePublish()}
          className="mt-4 w-full bg-green-500 py-4 text-base text-black hover:bg-green-400"
          disabled={publishing || !handle}
        >
          {publishing ? 'Publishing...' : 'Publish to My Shop'}
        </Button>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto bg-zinc-950 p-8">
        <div className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-zinc-800 bg-white shadow-2xl">
          <div className="flex h-12 items-center bg-black px-4 text-xs text-white">
            rareimagery.net/@{handle || 'creator'}
          </div>

          <LiveThemePreview
            templateId={previewData.templateId}
            handle={handle}
            extraComponents={previewData.extraComponents}
            customCSS={previewData.customCSS}
            avatar={(drupalContext as any)?.avatar}
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
