'use client';
/* eslint-disable @next/next/no-img-element */

import type { TemplatePreviewProps } from './types';

export function VideoStoreTemplate({ handle, avatar, bio, videos }: TemplatePreviewProps) {
  return (
    <div className="min-h-full rounded-2xl border border-emerald-400/30 bg-[linear-gradient(180deg,#05070f,#102329)] p-5 text-white">
      <div className="mb-4 flex items-center gap-3">
        {avatar ? (
          <img src={avatar} alt={handle} className="h-12 w-12 rounded-full border border-emerald-300/30 object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/30 bg-black/30 text-sm font-bold">
            @{handle.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold">@{handle}</p>
          <p className="text-xs text-emerald-200">{bio || 'Video-first commerce with cinematic product story.'}</p>
        </div>
      </div>

      <div className="mb-3 rounded-xl border border-emerald-300/30 bg-black/30 p-3 text-sm">Hero Video Slot</div>
      <div className="grid grid-cols-3 gap-3">
        {videos.slice(0, 3).map((video) => (
          <div key={video.id} className="overflow-hidden rounded-lg border border-emerald-300/30 bg-white/5 p-2 text-xs">
            {video.thumbnail ? (
              <img src={video.thumbnail} alt={video.id} className="h-20 w-full rounded object-cover" />
            ) : (
              <div className="h-20 w-full rounded bg-black/30" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
