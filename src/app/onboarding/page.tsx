'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import TemplatePicker from '@/components/TemplatePicker';
import { createCreatorSite } from '@/app/actions/onboarding';

type WizardProfile = {
  handle: string;
  name: string;
  bio: string;
  verified: boolean;
};

export default function OnboardingWizard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'retro' | 'modern-cart' | 'ai-video-store' | 'latest-posts' | 'blank'>('modern-cart');
  const [profile, setProfile] = useState<WizardProfile>({
    handle: '',
    name: '',
    bio: '',
    verified: false,
  });

  useEffect(() => {
    const sessionData = session as typeof session & {
      xUsername?: string;
      xBio?: string;
      xVerified?: boolean;
    };

    setProfile((prev) => ({
      ...prev,
      handle: sessionData?.xUsername || prev.handle,
      name: session?.user?.name || prev.name,
      bio: sessionData?.xBio || prev.bio,
      verified: Boolean(sessionData?.xVerified),
    }));
  }, [session]);

  const handleConfirmProfile = () => setStep(2);

  const handleCreateSite = async () => {
    setCreating(true);
    try {
      const result = await createCreatorSite(profile, selectedTemplate);
      const liveUrl = result.url || `https://${profile.handle}.rareimagery.net`;
      alert(`Your rareimagery.net site is LIVE at ${liveUrl}`);
      router.push('/console');
    } finally {
      setCreating(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 text-base text-white placeholder-zinc-500 outline-none transition focus:border-[#1DA1F2]';

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-3xl">
        <h1 className="mb-12 text-center text-4xl font-bold tracking-tight sm:text-5xl">
          Build Your X Store on rareimagery.net
        </h1>

        {step === 1 && (
          <div className="space-y-8">
            <h2 className="text-3xl font-semibold">Step 1: Verify Your X Info</h2>
            <div className="space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-8">
              <div className="text-lg font-medium text-zinc-200">
                @{profile.handle || 'yourhandle'}{' '}
                <span className="text-[#1DA1F2]">{profile.verified ? 'Verified' : ''}</span>
              </div>
              <input
                className={inputClass}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Display Name"
              />
              <input
                className={inputClass}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Short bio (shows on your profile)"
              />
            </div>
            <button
              type="button"
              onClick={handleConfirmProfile}
              className="w-full rounded-2xl bg-[#1DA1F2] px-6 py-5 text-xl font-semibold text-white transition hover:bg-[#0f8bd6]"
            >
              Looks correct - Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <h2 className="text-3xl font-semibold">Step 2: Pick Your Store Theme</h2>
            <TemplatePicker
              current={selectedTemplate}
              sellerHandle={profile.handle}
              xAvatar={session?.user?.image ?? undefined}
              xBio={profile.bio}
              onChange={setSelectedTemplate}
            />
            <button
              type="button"
              onClick={handleCreateSite}
              disabled={creating}
              className="w-full rounded-2xl bg-green-500 px-6 py-5 text-xl font-semibold text-white transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? 'Creating your site...' : 'Create My Quality Site on rareimagery.net'}
            </button>
            <p className="text-center text-sm text-zinc-400">
              Your site will be live instantly with Grok video support and X Money checkout ready
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
