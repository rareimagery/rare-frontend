'use client';
/* eslint-disable @next/next/no-img-element */

import type { TemplatePreviewProps } from './types';

export function PostsFeedTemplate({ handle, avatar, bio, posts }: TemplatePreviewProps) {
  return (
    <div className="min-h-full rounded-2xl border border-sky-400/30 bg-black p-5 text-white">
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
          <p className="text-xs text-zinc-400">{bio || 'Latest X content and product feed merged.'}</p>
        </div>
      </div>

      <div className="space-y-3">
        {posts.slice(0, 3).map((post) => (
          <div key={post.id} className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm">
            {post.text}
          </div>
        ))}
      </div>
    </div>
  );
}
