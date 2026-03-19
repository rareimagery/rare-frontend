'use client';
/* eslint-disable @next/next/no-img-element */

import type { TemplatePreviewProps } from './types';

export function BlankTemplate({ handle, avatar, bio }: TemplatePreviewProps) {
  return (
    <div className="min-h-full rounded-2xl border border-zinc-600 bg-zinc-900 p-5 text-zinc-100">
      <div className="mb-4 flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={handle} className="h-12 w-12 rounded-full border border-zinc-700 object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-bold text-zinc-300">
            @{handle.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">@{handle}</p>
          <p className="text-xs text-zinc-400">{bio || 'Blank framework ready for custom build.'}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-xl border border-dashed border-zinc-600 bg-zinc-950" />
        <div className="h-24 rounded-xl border border-dashed border-zinc-600 bg-zinc-950" />
        <div className="h-24 rounded-xl border border-dashed border-zinc-600 bg-zinc-950" />
        <div className="h-24 rounded-xl border border-dashed border-zinc-600 bg-zinc-950" />
      </div>
    </div>
  );
}
