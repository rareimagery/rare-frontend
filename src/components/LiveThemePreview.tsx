'use client';

type TemplateId =
  | 'retro'
  | 'modern-cart'
  | 'ai-video-store'
  | 'latest-posts'
  | 'blank';

export default function LiveThemePreview({
  templateId,
  handle,
  avatar,
  bio,
}: {
  templateId: TemplateId;
  handle: string;
  avatar?: string;
  bio?: string;
}) {
  const avatarNode = avatar ? (
    <div
      className="h-12 w-12 rounded-full border border-white/40"
      style={{
        backgroundImage: `url(${avatar})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 text-sm font-bold text-zinc-300">
      @{handle.slice(0, 1).toUpperCase()}
    </div>
  );

  if (templateId === 'retro') {
    return (
      <div className="min-h-full rounded-2xl border border-pink-300/40 bg-[linear-gradient(135deg,#1f1147,#5f0f69_40%,#0ea5e9)] p-5 text-white">
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/20 bg-black/30 p-3">
          {avatarNode}
          <div>
            <p className="text-sm font-bold">@{handle}</p>
            <p className="text-xs text-pink-100">{bio || 'Retro profile vibes and glitter energy.'}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/30 bg-white/10 p-4 text-sm">Top 8 Picks</div>
          <div className="rounded-xl border border-white/30 bg-white/10 p-4 text-sm">Blink Banner</div>
          <div className="rounded-xl border border-white/30 bg-white/10 p-4 text-sm">Playlist</div>
          <div className="rounded-xl border border-white/30 bg-white/10 p-4 text-sm">Shoutbox</div>
        </div>
      </div>
    );
  }

  if (templateId === 'modern-cart') {
    return (
      <div className="min-h-full rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-zinc-100">
        <div className="mb-5 flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 p-3">
          <div className="flex items-center gap-3">
            {avatarNode}
            <div>
              <p className="text-sm font-semibold">@{handle}</p>
              <p className="text-xs text-zinc-400">{bio || 'Modern storefront with strong conversion flow.'}</p>
            </div>
          </div>
          <div className="rounded-md bg-[#1DA1F2] px-3 py-1 text-xs font-semibold text-white">Shop</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm">Featured Product</div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm">Best Seller</div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm">New Drop</div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm">Cart Preview</div>
        </div>
      </div>
    );
  }

  if (templateId === 'ai-video-store') {
    return (
      <div className="min-h-full rounded-2xl border border-emerald-400/30 bg-[linear-gradient(180deg,#05070f,#102329)] p-5 text-white">
        <div className="mb-4 flex items-center gap-3">
          {avatarNode}
          <div>
            <p className="text-sm font-semibold">@{handle}</p>
            <p className="text-xs text-emerald-200">{bio || 'Video-first commerce with cinematic product story.'}</p>
          </div>
        </div>
        <div className="mb-3 rounded-xl border border-emerald-300/30 bg-black/30 p-3 text-sm">
          Hero Video Slot
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-emerald-300/30 bg-white/5 p-3 text-xs">Clip 1</div>
          <div className="rounded-lg border border-emerald-300/30 bg-white/5 p-3 text-xs">Clip 2</div>
          <div className="rounded-lg border border-emerald-300/30 bg-white/5 p-3 text-xs">Clip 3</div>
        </div>
      </div>
    );
  }

  if (templateId === 'latest-posts') {
    return (
      <div className="min-h-full rounded-2xl border border-sky-400/30 bg-black p-5 text-white">
        <div className="mb-4 flex items-center gap-3">
          {avatarNode}
          <div>
            <p className="text-sm font-semibold">@{handle}</p>
            <p className="text-xs text-zinc-400">{bio || 'Latest X content and product feed merged.'}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm">Latest Post + Product Link</div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm">Pinned Thread + CTA</div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm">Community Replies</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full rounded-2xl border border-zinc-600 bg-zinc-900 p-5 text-zinc-100">
      <div className="mb-4 flex items-center gap-3">
        {avatarNode}
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
