'use client';

import type { TemplatePreviewProps } from './types';

export function RetroTemplate({ handle, avatar, bio, products }: TemplatePreviewProps) {
  return (
    <div className="min-h-full rounded-2xl border border-pink-300/40 bg-[linear-gradient(135deg,#1f1147,#5f0f69_40%,#0ea5e9)] p-5 text-white">
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/20 bg-black/30 p-3">
        {avatar ? (
          <img src={avatar} alt={handle} className="h-12 w-12 rounded-full border border-white/40 object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/40 text-sm font-bold">
            @{handle.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-bold">@{handle}</p>
          <p className="text-xs text-pink-100">{bio || 'Retro profile vibes and glitter energy.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.slice(0, 4).map((product) => (
          <div key={product.id} className="rounded-xl border border-white/30 bg-white/10 p-4 text-sm">
            {product.title}
          </div>
        ))}
      </div>
    </div>
  );
}
