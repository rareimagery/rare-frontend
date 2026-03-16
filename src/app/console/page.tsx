"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useConsole } from "@/components/ConsoleContext";
import type { Metrics, TopPost, TopFollower } from "@/lib/drupal";

interface InsightsData {
  xUsername: string;
  followerCount: number;
  bio: string;
  profilePictureUrl: string | null;
  metrics: Metrics | null;
  topPosts: TopPost[];
  topFollowers: TopFollower[];
  storeTheme: string;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(d: string) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const SENTIMENT_COLOR: Record<string, string> = {
  "Very Positive": "text-emerald-400",
  Positive: "text-teal-400",
  Neutral: "text-zinc-400",
  Mixed: "text-amber-400",
};

export default function ConsoleDashboard() {
  const {
    role,
    hasStore,
    storeName,
    storeSlug,
    storeStatus,
    currentTheme,
    xUsername,
  } = useConsole();

  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const loadInsights = useCallback(async () => {
    if (!hasStore) return;
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/console/insights");
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch {
      // non-critical
    } finally {
      setInsightsLoading(false);
    }
  }, [hasStore]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const isAdmin = role === "admin";
  const m = insights?.metrics;

  if (!hasStore) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20">
          <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold">Welcome to RareImagery</h1>
        <p className="mb-8 max-w-md text-center text-zinc-400">
          Create your storefront powered by your X profile. AI-enhanced setup takes just a few minutes.
        </p>
        <Link
          href="/console/setup"
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
        >
          Create Your Store
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/20 text-emerald-400",
    pending: "bg-amber-500/20 text-amber-400",
    rejected: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <a
          href={`https://${storeSlug}.rareimagery.net`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Open Live Store
        </a>
      </div>

      {/* Store overview */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {insights?.profilePictureUrl ? (
              <Image
                src={insights.profilePictureUrl}
                alt={xUsername ?? ""}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-zinc-700"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-lg font-bold text-white">
                {(xUsername ?? "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-white">{storeName}</h2>
              <p className="text-sm text-zinc-400">{storeSlug}.rareimagery.net</p>
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusColors[storeStatus || "pending"] || statusColors.pending
            }`}
          >
            {storeStatus || "pending"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-5 text-sm text-zinc-400">
          <div><span className="text-zinc-500">Theme:</span>{" "}<span className="text-zinc-300">{currentTheme}</span></div>
          <div><span className="text-zinc-500">Creator:</span>{" "}<span className="text-zinc-300">@{xUsername}</span></div>
          {insights && (
            <div><span className="text-zinc-500">Followers:</span>{" "}<span className="text-zinc-300">{formatCount(insights.followerCount)}</span></div>
          )}
        </div>
      </div>

      {/* X Analytics — shown once insights load */}
      {insightsLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 text-zinc-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
          Loading X analytics…
        </div>
      )}

      {m && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <svg className="h-4 w-4 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            X Analytics
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Engagement", value: `${m.engagement_score}%`, color: "text-indigo-400" },
              { label: "Avg Likes", value: formatCount(m.avg_likes), color: "text-pink-400" },
              { label: "Avg Views", value: formatCount(m.avg_views), color: "text-sky-400" },
              { label: "Avg RTs", value: formatCount(m.avg_retweets), color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-zinc-800/50 p-3 text-center">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-zinc-500">
            Posting frequency:{" "}
            <span className="text-zinc-300">{m.posting_frequency}</span>
          </div>
        </div>
      )}

      {/* Grok AI Insights */}
      {m && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
            <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Grok AI Analysis
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Audience sentiment */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-zinc-500">Audience Sentiment</p>
              <p className={`text-lg font-semibold ${SENTIMENT_COLOR[m.audience_sentiment] ?? "text-zinc-300"}`}>
                {m.audience_sentiment}
              </p>
            </div>

            {/* Top themes */}
            {m.top_themes.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-zinc-500">Content Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.top_themes.slice(0, 6).map((t) => (
                    <span key={t} className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs text-violet-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended products */}
            {m.recommended_products.length > 0 && (
              <div className="sm:col-span-2">
                <p className="mb-1.5 text-xs font-medium text-zinc-500">AI Product Recommendations</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.recommended_products.slice(0, 5).map((p) => (
                    <span key={p} className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-0.5 text-xs text-zinc-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top posts mini-feed */}
      {insights && insights.topPosts.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-4 font-semibold text-white">Top X Posts</h3>
          <div className="space-y-3">
            {insights.topPosts.slice(0, 3).map((post) => (
              <div key={post.id} className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
                <p className="line-clamp-2 text-sm text-zinc-300">{post.text}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5 text-pink-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg>
                    {formatCount(post.likes)}
                  </span>
                  <span>{formatCount(post.views)} views</span>
                  {post.date && <span>{formatDate(post.date)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top followers */}
      {insights && insights.topFollowers.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="mb-4 font-semibold text-white">Notable Followers</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {insights.topFollowers.slice(0, 4).map((f) => (
              <a
                key={f.username}
                href={`https://x.com/${f.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 transition hover:border-zinc-600"
              >
                {f.profile_image_url ? (
                  <Image
                    src={f.profile_image_url}
                    alt={f.username}
                    width={32}
                    height={32}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-bold text-zinc-300">
                    {f.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-zinc-200">@{f.username}</p>
                  <p className="text-xs text-zinc-500">{formatCount(f.follower_count)}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/console/products"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="font-medium text-white group-hover:text-blue-400">Products</h3>
          <p className="mt-1 text-xs text-zinc-500">Add and manage your product catalog</p>
        </Link>

        <Link
          href="/console/theme"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20">
            <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3 className="font-medium text-white group-hover:text-purple-400">Theme</h3>
          <p className="mt-1 text-xs text-zinc-500">Customize your storefront appearance</p>
        </Link>

        <Link
          href="/console/settings"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-medium text-white group-hover:text-emerald-400">Settings</h3>
          <p className="mt-1 text-xs text-zinc-500">Store details and notifications</p>
        </Link>
      </div>

      {/* Run AI analysis if no metrics yet */}
      {!insightsLoading && !m && hasStore && (
        <div className="rounded-xl border border-zinc-700/60 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
              <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white">Run Grok + Claude AI Analysis</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Import your X data to get AI-powered audience insights, product recommendations, and theme suggestions.
              </p>
              <Link
                href="/console/social"
                className="mt-3 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500"
              >
                Import from X →
              </Link>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Platform Admin</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Manage all creator stores and approvals
              </p>
            </div>
            <Link
              href="/console/admin"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              View All Stores
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
