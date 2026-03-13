"use client";

import { useState, useEffect } from "react";
import { useConsole } from "@/components/ConsoleContext";
import XSeedImport from "@/components/XSeedImport";
import CreatorProfileCard from "@/components/CreatorProfileCard";
import MyPicksManager from "@/components/MyPicksManager";
import type { FollowerInfo } from "@/lib/social";

export default function ConsoleSocialPage() {
  const { storeId, xUsername, hasStore } = useConsole();
  const [tab, setTab] = useState<"followers" | "following">("followers");
  const [followers, setFollowers] = useState<FollowerInfo[]>([]);
  const [following, setFollowing] = useState<FollowerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [xSeedImported, setXSeedImported] = useState(false);

  useEffect(() => {
    if (storeId) {
      fetchSocialData();
    } else {
      setLoading(false);
    }
  }, [storeId]);

  async function fetchSocialData() {
    setLoading(true);
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/social/followers?storeId=${storeId}&type=followers`),
        fetch(`/api/social/followers?storeId=${storeId}&type=following`),
      ]);

      if (followersRes.ok) {
        const data = await followersRes.json();
        setFollowers(data.data ?? []);
      }
      if (followingRes.ok) {
        const data = await followingRes.json();
        setFollowing(data.data ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch social data:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!hasStore) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Social</h1>
        <p className="text-zinc-400">Create your store first to access social features.</p>
      </div>
    );
  }

  const mutualCount = followers.filter((f) => f.isMutual).length;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-1">Social</h1>
      <p className="text-zinc-400 text-sm mb-6">
        Manage your follower network and discover creators.
      </p>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-white">{followers.length}</p>
          <p className="text-xs text-zinc-500">Followers</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-white">{following.length}</p>
          <p className="text-xs text-zinc-500">Following</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <p className="text-2xl font-bold text-white">{mutualCount}</p>
          <p className="text-xs text-zinc-500">Friends</p>
        </div>
      </div>

      {/* X Seed Import */}
      {!xSeedImported && (
        <XSeedImport
          onComplete={() => {
            setXSeedImported(true);
            fetchSocialData();
          }}
          className="mb-6"
        />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800 mb-4">
        <button
          onClick={() => setTab("followers")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "followers"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Followers ({followers.length})
        </button>
        <button
          onClick={() => setTab("following")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "following"
              ? "border-indigo-500 text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Following ({following.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-2">
          {(tab === "followers" ? followers : following).length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              {tab === "followers"
                ? "No followers yet. Share your store to grow your audience!"
                : "You're not following anyone yet. Discover creators on the platform!"}
            </div>
          ) : (
            (tab === "followers" ? followers : following).map((creator) => (
              <CreatorProfileCard
                key={creator.storeId}
                storeId={creator.storeId}
                storeName={creator.storeName}
                storeSlug={creator.storeSlug}
                xUsername={creator.xUsername}
                profilePictureUrl={creator.profilePictureUrl}
                followerCount={creator.followerCount}
                variant="compact"
              />
            ))
          )}
        </div>
      )}

      {/* My Picks Manager */}
      {storeId && (
        <>
          <div className="my-8 border-t border-zinc-800" />
          <MyPicksManager storeId={storeId} />
        </>
      )}
    </div>
  );
}
