'use client';

import { useEffect, useState } from 'react';
import LiveThemePreview from './LiveThemePreview';
import { updateTemplate } from '@/app/actions/template';

const templates = [
  { id: 'retro', label: 'Memories MySpace / Old FB / AOL', emoji: '🕹️' },
  { id: 'modern-cart', label: 'Modern Shopping Cart', emoji: '🛒' },
  { id: 'ai-video-store', label: 'AI Video Store', emoji: '🎥' },
  { id: 'latest-posts', label: 'Latest X Posts Feed', emoji: '📜' },
  { id: 'blank', label: 'Blank Canvas (build your own)', emoji: '✨' },
] as const;

type TemplateId = (typeof templates)[number]['id'];

function normalizeCurrentTemplate(current: string): TemplateId {
  if (templates.some((template) => template.id === current)) {
    return current as TemplateId;
  }

  const byTheme: Record<string, TemplateId> = {
    myspace: 'retro',
    xai3: 'modern-cart',
    editorial: 'ai-video-store',
    xmimic: 'latest-posts',
    minimal: 'blank',
  };

  return byTheme[current] || 'modern-cart';
}

export default function TemplatePicker({
  current,
  sellerHandle,
  xAvatar,
  xBio,
  onChange,
}: {
  current: string;
  sellerHandle: string;
  xAvatar?: string;
  xBio?: string;
  onChange?: (templateId: TemplateId) => void;
}) {
  const [selected, setSelected] = useState<TemplateId>(normalizeCurrentTemplate(current));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(normalizeCurrentTemplate(current));
  }, [current]);

  const handleSelect = (templateId: TemplateId) => {
    setSelected(templateId);
    onChange?.(templateId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTemplate(sellerHandle, selected);
      alert(`Preview saved - your site at rareimagery.net/shop/${sellerHandle} will look exactly like this!`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <div className="lg:w-1/3">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`cursor-pointer rounded-xl border-4 p-5 text-center transition-all hover:scale-[1.02] ${
                selected === t.id
                  ? 'border-[#1DA1F2] bg-zinc-900 shadow-xl shadow-[#1DA1F2]/20'
                  : 'border-zinc-700 bg-zinc-900/60 hover:border-zinc-500'
              }`}
              onClick={() => handleSelect(t.id)}
            >
              <div className="mb-3 text-5xl">{t.emoji}</div>
              <h3 className="text-sm font-bold text-white">{t.label}</h3>
            </button>
          ))}
        </div>

        {!onChange && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-8 w-full rounded-md bg-[#1DA1F2] px-4 py-4 text-base font-semibold text-white transition hover:bg-[#0f8bd6] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Save This Theme & Create My Site'}
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-700 bg-zinc-900 shadow-2xl lg:w-2/3">
        <div className="flex items-center gap-3 border-b border-zinc-700 bg-black p-4">
          <div className="flex-1 text-center text-sm text-zinc-400">LIVE PREVIEW - rareimagery.net/shop/@{sellerHandle}</div>
          <div className="rounded-full bg-[#1DA1F2] px-4 py-1 text-xs text-white">X Verified</div>
        </div>
        <div className="h-[520px] overflow-auto bg-white/5 p-8">
          <LiveThemePreview
            templateId={selected}
            handle={sellerHandle}
            avatar={xAvatar}
            bio={xBio}
          />
        </div>
        <div className="border-t border-zinc-700 py-3 text-center text-xs text-zinc-500">
          This is exactly how your site will look to buyers - Grok videos, products, and X Money ready
        </div>
      </div>
    </div>
  );
}
