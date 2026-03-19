'use client';

import { useState } from 'react';
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
  onChange,
}: {
  current: string;
  sellerHandle: string;
  onChange?: (templateId: TemplateId) => void;
}) {
  const [selected, setSelected] = useState<TemplateId>(normalizeCurrentTemplate(current));
  const [saving, setSaving] = useState(false);

  const handleSelect = (templateId: TemplateId) => {
    setSelected(templateId);
    onChange?.(templateId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTemplate(sellerHandle, selected);
      alert('Template live on rareimagery.net - preview your @handle shop now!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="mb-4 text-base font-semibold text-white">Template Picker</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`cursor-pointer rounded-xl border-2 p-4 text-center transition ${
              selected === t.id
                ? 'border-[#1DA1F2] bg-zinc-900'
                : 'border-zinc-700 bg-zinc-950/60 hover:border-zinc-500'
            }`}
            onClick={() => handleSelect(t.id)}
          >
            <div className="mb-3 text-5xl">{t.emoji}</div>
            <h4 className="text-sm font-bold text-white">{t.label}</h4>
          </button>
        ))}
      </div>

      {!onChange && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full rounded-md bg-[#1DA1F2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f8bd6] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Save & Publish to rareimagery.net'}
        </button>
      )}
    </div>
  );
}
