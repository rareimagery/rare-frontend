'use client';

import { useEffect, useRef, useState } from 'react';
import { RetroTemplate } from '@/templates/Retro';
import { ModernCartTemplate } from '@/templates/ModernCart';
import { VideoStoreTemplate } from '@/templates/VideoStore';
import { PostsFeedTemplate } from '@/templates/PostsFeed';
import { BlankTemplate } from '@/templates/Blank';
import type { PreviewPost, PreviewProduct } from '@/templates/types';

const mockProducts = [
  {
    id: '1',
    title: 'Limited Drop Hoodie',
    price: 49,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
    description: 'Heavyweight hoodie built for cool nights, city shoots, and creator meetups.',
  },
  {
    id: '2',
    title: 'Grok-Generated Digital Art Pack',
    price: 19,
    image: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=900&q=80',
    description: '50 high-resolution AI textures and poster layouts ready for content and merch.',
  },
  {
    id: '3',
    title: 'Rare Imagery Film Presets',
    price: 29,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80',
    description: 'A cinematic preset bundle tuned for contrast-rich street and lifestyle photography.',
  },
  {
    id: '4',
    title: 'Neon Nights Poster Set',
    price: 34,
    image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80',
    description: 'Three collector-grade posters from the RareImagery neon city series.',
  },
];

const mockVideos = [
  { id: 'v1', url: 'https://rareimagery.net/grok-video-placeholder.mp4', thumbnail: 'https://picsum.photos/600/340' },
];

const mockPosts = [
  { id: 'p1', text: 'Just dropped this new merch - what do you think? 👀', linkedProduct: '1' },
];

type PreviewPayload = {
  avatar?: string | null;
  banner?: string | null;
  bio?: string | null;
  products?: PreviewProduct[];
  posts?: PreviewPost[];
};

type Props = {
  templateId: string;
  handle: string;
  avatar?: string;
  bio?: string;
  extraComponents?: string[];
  /** Alias for extraComponents — pass either or both; they are merged */
  sections?: string[];
  customCSS?: string;
  drupalContext?: Record<string, unknown>;
  /** Pass to enable drag-to-reorder sections inside the preview */
  setSections?: React.Dispatch<React.SetStateAction<string[]>>;
};

function ExtraPreviewSection({ componentId }: { componentId: string }) {
  switch (componentId) {
    case 'grok-grid':
    case 'ai-creations':
      return (
        <section className="rounded-2xl border border-cyan-400/30 bg-cyan-950/40 p-6 text-cyan-100">
          <h3 className="text-xl font-semibold">🎥 Your Grok Videos from R2</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((id) => (
              <div key={id} className="flex h-28 items-center justify-center rounded-xl bg-black/40 ring-1 ring-cyan-400/20 text-xs text-cyan-400/60">
                Grok video {id}
              </div>
            ))}
          </div>
        </section>
      );
    case 'product-showcase':
    case 'products':
      return (
        <section className="rounded-2xl border border-fuchsia-400/30 bg-fuchsia-950/30 p-6 text-fuchsia-100">
          <h3 className="text-xl font-semibold">🛒 Products Showcase with X Money buttons</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {['Limited Hoodie', 'Digital Art Pack', 'Film Presets', 'Poster Set'].map((name) => (
              <div key={name} className="rounded-xl bg-black/30 p-3 ring-1 ring-fuchsia-400/20">
                <div className="h-16 w-full rounded-lg bg-fuchsia-900/40" />
                <p className="mt-2 text-xs font-medium">{name}</p>
              </div>
            ))}
          </div>
        </section>
      );
    case 'subscriber-hero':
      return (
        <section className="rounded-2xl border border-emerald-400/40 bg-emerald-950/40 p-6 text-emerald-100">
          <h3 className="text-xl font-semibold">Big $4 Subscriber CTA</h3>
          <p className="mt-2 text-sm opacity-80">Unlock private posts, early drops, and premium creator perks.</p>
        </section>
      );
    case 'recent-posts':
      return (
        <section className="rounded-2xl border border-blue-400/30 bg-blue-950/40 p-6 text-blue-100">
          <h3 className="text-xl font-semibold">📜 Recent X Posts (pulled live from your Drupal sync)</h3>
          <ul className="mt-4 space-y-3">
            {['Just dropped this new merch 👀', 'Behind-the-scenes from last night 🎥', 'New Grok video dropping soon ⚡'].map((post) => (
              <li key={post} className="rounded-xl bg-black/30 px-4 py-3 text-sm ring-1 ring-blue-400/20">
                {post}
              </li>
            ))}
          </ul>
        </section>
      );
    case 'favorite-people':  // Followers you follow
      return (
        <section className="rounded-2xl border border-pink-400/30 bg-pink-950/40 p-6 text-pink-100">
          <h3 className="text-xl font-semibold">❤️ Favorite People / Followers you follow</h3>
          <p className="mt-1 text-xs text-pink-300/70">Top supporters &amp; subscribers</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {['@fan1', '@fan2', '@fan3', '@fan4', '@fan5'].map((handle) => (
              <div key={handle} className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 text-xs ring-1 ring-pink-400/20">
                <div className="h-5 w-5 rounded-full bg-pink-700" />
                {handle}
              </div>
            ))}
          </div>
        </section>
      );
    default:
      return null;
  }
}

export function LiveThemePreview({
  templateId,
  handle,
  avatar,
  bio,
  extraComponents = [],
  sections = [],
  customCSS = '',
  drupalContext,
  setSections,
}: Props) {
  const dragSrcIndex = useRef<number | null>(null);
  // drupalContext is available for section renderers that need live Drupal data
  // Merge both props so callers can use either name
  const resolvedComponents = Array.from(new Set([...extraComponents, ...sections]));
  const [liveData, setLiveData] = useState<PreviewPayload | null>(null);

  const normalizedHandle = handle.toLowerCase();
  const defaultAvatar =
    normalizedHandle === 'rareimagery'
      ? 'https://unavatar.io/x/rareimagery'
      : undefined;
  const defaultBanner =
    normalizedHandle === 'rareimagery'
      ? 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80'
      : 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80';

  useEffect(() => {
    let active = true;

    async function loadLivePreviewData() {
      try {
        const res = await fetch(`/api/template-preview/${encodeURIComponent(normalizedHandle)}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;

        const data = (await res.json()) as PreviewPayload;
        if (!active) return;
        setLiveData(data);
      } catch {
        if (!active) return;
        setLiveData(null);
      }
    }

    void loadLivePreviewData();

    return () => {
      active = false;
    };
  }, [normalizedHandle]);

  const resolvedProducts =
    liveData?.products && liveData.products.length > 0
      ? liveData.products
      : mockProducts;

  const resolvedPosts =
    liveData?.posts && liveData.posts.length > 0
      ? liveData.posts
      : mockPosts;

  const commonProps = {
    products: resolvedProducts,
    videos: mockVideos,
    posts: resolvedPosts,
    handle,
    avatar: avatar || liveData?.avatar || defaultAvatar,
    banner: liveData?.banner || defaultBanner,
    bio: bio || liveData?.bio || undefined,
  };

  const scaleStyle = { transform: 'scale(0.82)', transformOrigin: 'top left' as const, width: '122%' };

  let previewNode;
  switch (templateId) {
    case 'retro':
      previewNode = <RetroTemplate {...commonProps} />;
      break;
    case 'modern-cart':
      previewNode = <ModernCartTemplate {...commonProps} />;
      break;
    case 'ai-video-store':
      previewNode = <VideoStoreTemplate {...commonProps} />;
      break;
    case 'latest-posts':
      previewNode = <PostsFeedTemplate {...commonProps} />;
      break;
    default:
      previewNode = <BlankTemplate {...commonProps} />;
      break;
  }

  return (
    <div style={scaleStyle}>
      {customCSS.trim() ? <style>{customCSS}</style> : null}
      {previewNode}
      {resolvedComponents.length > 0 ? (
        <div className="space-y-4 p-6">
          {resolvedComponents.map((componentId, index) => (
            <div
              key={`${componentId}-${index}`}
              draggable={!!setSections}
              onDragStart={() => { dragSrcIndex.current = index; }}
              onDragOver={(e) => { if (setSections) e.preventDefault(); }}
              onDrop={(e) => {
                if (!setSections || dragSrcIndex.current === null || dragSrcIndex.current === index) return;
                e.preventDefault();
                const next = [...resolvedComponents];
                const [moved] = next.splice(dragSrcIndex.current, 1);
                next.splice(index, 0, moved);
                setSections(() => next);
                dragSrcIndex.current = null;
              }}
              className={setSections ? 'cursor-grab active:cursor-grabbing' : undefined}
            >
              <ExtraPreviewSection componentId={componentId} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default LiveThemePreview;
