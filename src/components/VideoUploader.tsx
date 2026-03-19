'use client';

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { uploadVideoToDrupal } from '@/app/actions/media';

export default function VideoUploader({ sellerHandle }: { sellerHandle: string }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadVideoToDrupal(file, sellerHandle);
      if (result.success) {
        alert('Video hosted on rareimagery.net and now live in your profile!');
      } else {
        alert(result.message || 'Video upload failed.');
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-[#1DA1F2] p-8 text-center">
      <p className="mb-4 text-xl">Generate in Grok Imagine - Upload here</p>
      <input
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleUpload}
        className="hidden"
        id="video-upload"
      />
      <button
        type="button"
        disabled={uploading}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1DA1F2] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <label htmlFor="video-upload" className="cursor-pointer">
          {uploading
            ? 'Hosting on rareimagery.net...'
            : 'Upload Grok Video to My Profile'}
        </label>
      </button>
      <p className="mt-4 text-sm text-zinc-400">
        Auto-displays in your @handle profile + product pages
      </p>
    </div>
  );
}
