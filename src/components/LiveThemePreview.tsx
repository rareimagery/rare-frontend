'use client';

import { useEffect, useState } from 'react';
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
};

export function LiveThemePreview({ templateId, handle, avatar, bio }: Props) {
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

  switch (templateId) {
    case 'retro':
      return (
        <div style={scaleStyle}>
          <RetroTemplate {...commonProps} />
        </div>
      );
    case 'modern-cart':
      return (
        <div style={scaleStyle}>
          <ModernCartTemplate {...commonProps} />
        </div>
      );
    case 'ai-video-store':
      return (
        <div style={scaleStyle}>
          <VideoStoreTemplate {...commonProps} />
        </div>
      );
    case 'latest-posts':
      return (
        <div style={scaleStyle}>
          <PostsFeedTemplate {...commonProps} />
        </div>
      );
    default:
      return (
        <div style={scaleStyle}>
          <BlankTemplate {...commonProps} />
        </div>
      );
  }
}

export default LiveThemePreview;
