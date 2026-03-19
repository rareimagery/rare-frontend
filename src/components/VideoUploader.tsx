'use client';

import { useState } from 'react';
import { saveLinkedVideo } from '@/app/actions/uploadVideo';

export default function VideoUploader({ sellerHandle }: { sellerHandle: string }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await saveLinkedVideo(videoUrl, sellerHandle);
      if (result.success) {
        alert('Video link saved and now live in your profile!');
        setVideoUrl(result.videoUrl);
      } else {
        alert('Video link save failed.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Video link save failed.';
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-[#1DA1F2] p-8 text-center">
      <p className="mb-4 text-xl">Paste your AI video link here</p>
      <input
        type="url"
        value={videoUrl}
        onChange={(event) => setVideoUrl(event.target.value)}
        placeholder="https://..."
        className="mx-auto mb-4 block w-full max-w-xl rounded-md border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-[#1DA1F2]"
      />
      <button
        type="button"
        disabled={saving || !videoUrl.trim()}
        onClick={handleSave}
        className="inline-flex min-h-11 items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1DA1F2] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {saving ? 'Saving video link...' : 'Link AI Video to My Profile'}
      </button>
      <p className="mt-4 text-sm text-zinc-400">
        We only store the link. Your video remains hosted wherever you created it.
      </p>
    </div>
  );
}
