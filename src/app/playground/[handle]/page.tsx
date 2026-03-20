'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LiveThemePreview from '@/components/LiveThemePreview';
import SubscribeButton from '@/components/SubscribeButton';
import { savePlaygroundDraft, publishSite } from '@/app/actions/playground';

type TemplateId = 'retro' | 'modern-cart' | 'ai-video-store' | 'latest-posts' | 'blank';

const COMPONENT_OPTIONS = [
  { id: 'grok-grid', label: 'Grok Video Grid' },
  { id: 'product-showcase', label: 'Product Showcase' },
  { id: 'subscriber-hero', label: 'Big $4 Subscriber CTA' },
];

export default function PlaygroundPage() {
  const params = useParams<{ handle: string }>();
  const handle = useMemo(() => (params?.handle || '').replace(/^@+/, ''), [params?.handle]);

  const [templateId, setTemplateId] = useState<TemplateId>('blank');
  const [customCSS, setCustomCSS] = useState('');
  const [addedComponents, setAddedComponents] = useState<string[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!handle) return;

    const timer = setTimeout(async () => {
      try {
        setSavingDraft(true);
        await savePlaygroundDraft(handle, templateId, customCSS, addedComponents);
        setStatus('Draft auto-saved.');
      } catch {
        setStatus('Could not auto-save draft.');
      } finally {
        setSavingDraft(false);
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [addedComponents, customCSS, handle, templateId]);

  const addComponent = (componentId: string) => {
    setAddedComponents((prev) => [...prev, componentId]);
  };

  const handlePublish = async () => {
    if (!handle) return;

    try {
      setPublishing(true);
      setStatus('');
      await publishSite(handle, templateId, customCSS, addedComponents);
      window.alert(`Site published to rareimagery.net/shop/${handle}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed.';
      setStatus(message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <div className="w-80 overflow-auto border-r border-zinc-800 p-6">
        <h2 className="mb-6 text-2xl font-bold">Playground - @{handle || 'creator'}</h2>

        <div className="mb-8">
          <p className="mb-3 text-sm text-gray-400">Base Template</p>
          <select
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value as TemplateId)}
            className="w-full rounded-xl bg-zinc-900 p-3"
          >
            <option value="retro">Retro Memories</option>
            <option value="modern-cart">Modern Cart</option>
            <option value="ai-video-store">AI Video Store</option>
            <option value="latest-posts">Latest Posts</option>
            <option value="blank">Blank Canvas (free build)</option>
          </select>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-sm text-gray-400">Add Sections</p>
          {COMPONENT_OPTIONS.map((component) => (
            <Button
              key={component.id}
              variant="outline"
              className="mb-2 w-full justify-start"
              onClick={() => addComponent(component.id)}
            >
              + {component.label}
            </Button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm text-gray-400">Custom CSS (advanced)</p>
          <textarea
            value={customCSS}
            onChange={(event) => setCustomCSS(event.target.value)}
            className="h-40 w-full rounded-xl bg-zinc-900 p-4 font-mono text-sm"
            placeholder="body { background: linear-gradient(...); }"
          />
        </div>

        <Button
          onClick={() => void handlePublish()}
          className="mt-8 w-full bg-green-500 py-8 text-xl text-black hover:bg-green-400"
          disabled={publishing || !handle}
        >
          {publishing ? 'Publishing...' : 'Publish to My Shop + Enable Subscribers'}
        </Button>

        <p className="mt-3 text-xs text-zinc-400">{savingDraft ? 'Saving draft...' : status}</p>
      </div>

      <div className="flex-1 overflow-auto bg-white/5 p-8">
        <div className="border-b border-zinc-800 bg-black p-4 text-center text-xs text-gray-400">
          LIVE PREVIEW - rareimagery.net/shop/@{handle}
        </div>
        <LiveThemePreview
          templateId={templateId}
          handle={handle}
          extraComponents={addedComponents}
          customCSS={customCSS}
        />
        <div className="mt-8 text-center">
          <SubscribeButton creatorHandle={handle} />
        </div>
      </div>
    </div>
  );
}
