'use client';

import { RetroTemplate } from '@/templates/Retro';
import { ModernCartTemplate } from '@/templates/ModernCart';
import { VideoStoreTemplate } from '@/templates/VideoStore';
import { PostsFeedTemplate } from '@/templates/PostsFeed';
import { BlankTemplate } from '@/templates/Blank';

const mockProducts = [
  { id: '1', title: 'Limited Drop Hoodie', price: 49, image: '/placeholder-product.jpg' },
  { id: '2', title: 'Grok-Generated Digital Art Pack', price: 19 },
];

const mockVideos = [
  { id: 'v1', url: 'https://rareimagery.net/grok-video-placeholder.mp4', thumbnail: 'https://picsum.photos/600/340' },
];

const mockPosts = [
  { id: 'p1', text: 'Just dropped this new merch - what do you think? 👀', linkedProduct: '1' },
];

type Props = {
  templateId: string;
  handle: string;
  avatar?: string;
  bio?: string;
};

export function LiveThemePreview({ templateId, handle, avatar, bio }: Props) {
  const commonProps = {
    products: mockProducts,
    videos: mockVideos,
    posts: mockPosts,
    handle,
    avatar,
    bio,
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
