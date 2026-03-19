'use client';
/* eslint-disable @next/next/no-img-element */

import type { TemplatePreviewProps } from './types';

export function ModernCartTemplate({ handle, avatar, bio, products }: TemplatePreviewProps) {
  return (
    <div className="min-h-full rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-zinc-100">
      <div className="mb-5 flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 p-3">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt={handle} className="h-12 w-12 rounded-full border border-zinc-700 object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-bold text-zinc-300">
              @{handle.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold">@{handle}</p>
            <p className="text-xs text-zinc-400">{bio || 'Modern storefront with strong conversion flow.'}</p>
          </div>
        </div>
        <div className="rounded-md bg-[#1DA1F2] px-3 py-1 text-xs font-semibold text-white">Shop</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {products.slice(0, 4).map((product) => (
          <div key={product.id} className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm">
            <p>{product.title}</p>
            <p className="mt-2 text-xs text-zinc-400">${product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
