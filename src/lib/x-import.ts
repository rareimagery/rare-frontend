// ---------------------------------------------------------------------------
// X (Twitter) API v2 Data Import
// ---------------------------------------------------------------------------

const X_API_BASE = "https://api.twitter.com/2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface XImportData {
  username: string;
  displayName: string;
  bio: string;
  followerCount: number;
  profileImageUrl: string | null;
  bannerUrl: string | null;
  verified: boolean;
  topPosts: Array<{
    id: string;
    text: string;
    image_url?: string;
    likes: number;
    retweets: number;
    replies: number;
    views: number;
    date: string;
  }>;
  topFollowers: Array<{
    username: string;
    display_name: string;
    profile_image_url?: string;
    follower_count: number;
    verified: boolean;
  }>;
  metrics: {
    engagement_score: number;
    avg_likes: number;
    avg_retweets: number;
    avg_views: number;
    top_themes: string[];
    recommended_products: string[];
    posting_frequency: string;
    audience_sentiment: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function xApiFetch(
  path: string,
  accessToken: string
): Promise<{ ok: boolean; data: any; status: number }> {
  const res = await fetch(`${X_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`X API error ${res.status} on ${path}:`, text);
    return { ok: false, data: null, status: res.status };
  }

  const json = await res.json();
  return { ok: true, data: json, status: res.status };
}

/**
 * Extract simple themes from tweet texts by finding hashtags and common
 * significant words. Returns the top `limit` themes.
 */
function extractThemes(tweets: Array<{ text: string }>, limit = 5): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
    "into", "through", "during", "before", "after", "above", "below",
    "between", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "both",
    "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "just",
    "because", "but", "and", "or", "if", "while", "this", "that", "these",
    "those", "it", "its", "i", "me", "my", "we", "our", "you", "your",
    "he", "him", "his", "she", "her", "they", "them", "their", "what",
    "which", "who", "whom", "rt", "amp", "https", "http", "co",
  ]);

  const freq: Record<string, number> = {};

  for (const tweet of tweets) {
    // Extract hashtags
    const hashtags = tweet.text.match(/#[\w]+/g) ?? [];
    for (const tag of hashtags) {
      const clean = tag.toLowerCase();
      freq[clean] = (freq[clean] ?? 0) + 1;
    }

    // Extract significant words (4+ chars, not URLs)
    const words = tweet.text
      .replace(/https?:\/\/\S+/g, "")
      .replace(/[^a-zA-Z\s]/g, "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w));

    for (const word of words) {
      freq[word] = (freq[word] ?? 0) + 1;
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Estimate posting frequency from tweet dates.
 */
function estimatePostingFrequency(dates: string[]): string {
  if (dates.length < 2) return "Unknown";

  const sorted = dates
    .map((d) => new Date(d).getTime())
    .sort((a, b) => a - b);

  const spanMs = sorted[sorted.length - 1] - sorted[0];
  const spanDays = spanMs / (1000 * 60 * 60 * 24);

  if (spanDays === 0) return "Several times a day";

  const tweetsPerDay = dates.length / Math.max(spanDays, 1);

  if (tweetsPerDay >= 3) return "Several times a day";
  if (tweetsPerDay >= 0.8) return "Daily";
  if (tweetsPerDay >= 0.3) return "Several times a week";
  if (tweetsPerDay >= 0.1) return "Weekly";
  return "Occasionally";
}

// ---------------------------------------------------------------------------
// Main fetch function
// ---------------------------------------------------------------------------

export async function fetchXData(
  accessToken: string,
  userId: string
): Promise<XImportData> {
  // 1. Fetch user profile
  const profileRes = await xApiFetch(
    `/users/${userId}?user.fields=name,username,description,profile_image_url,profile_banner_url,public_metrics,verified`,
    accessToken
  );

  if (!profileRes.ok) {
    throw new Error(`Failed to fetch X profile (status ${profileRes.status})`);
  }

  const user = profileRes.data.data;
  const publicMetrics = user.public_metrics ?? {};

  const username: string = user.username ?? "";
  const displayName: string = user.name ?? username;
  const bio: string = user.description ?? "";
  const followerCount: number = publicMetrics.followers_count ?? 0;
  const verified: boolean = user.verified ?? false;
  const profileImageUrl: string | null = user.profile_image_url
    ? user.profile_image_url.replace("_normal", "_400x400")
    : null;

  // 2. Fetch recent tweets
  const tweetsRes = await xApiFetch(
    `/users/${userId}/tweets?max_results=10&tweet.fields=public_metrics,created_at,attachments&expansions=attachments.media_keys&media.fields=url,preview_image_url`,
    accessToken
  );

  const rawTweets: any[] = tweetsRes.ok ? tweetsRes.data.data ?? [] : [];
  const mediaIncludes: any[] = tweetsRes.ok
    ? tweetsRes.data.includes?.media ?? []
    : [];

  // Build media lookup
  const mediaMap = new Map<string, string>();
  for (const m of mediaIncludes) {
    const url = m.url ?? m.preview_image_url;
    if (m.media_key && url) {
      mediaMap.set(m.media_key, url);
    }
  }

  const topPosts = rawTweets.map((t: any) => {
    const pm = t.public_metrics ?? {};
    const mediaKeys: string[] = t.attachments?.media_keys ?? [];
    const imageUrl = mediaKeys
      .map((k: string) => mediaMap.get(k))
      .find((u: string | undefined) => !!u);

    const post: XImportData["topPosts"][number] = {
      id: t.id,
      text: t.text ?? "",
      likes: pm.like_count ?? 0,
      retweets: pm.retweet_count ?? 0,
      replies: pm.reply_count ?? 0,
      views: pm.impression_count ?? 0,
      date: t.created_at ?? "",
    };
    if (imageUrl) post.image_url = imageUrl;
    return post;
  });

  // 3. Fetch top followers (get 20, sort by follower_count, take top 8)
  const followersRes = await xApiFetch(
    `/users/${userId}/followers?max_results=20&user.fields=public_metrics,profile_image_url,verified`,
    accessToken
  );

  const rawFollowers: any[] = followersRes.ok
    ? followersRes.data.data ?? []
    : [];

  const topFollowers = rawFollowers
    .map((f: any) => ({
      username: f.username ?? "",
      display_name: f.name ?? f.username ?? "",
      profile_image_url: f.profile_image_url
        ? f.profile_image_url.replace("_normal", "_400x400")
        : undefined,
      follower_count: f.public_metrics?.followers_count ?? 0,
      verified: f.verified ?? false,
    }))
    .sort((a, b) => b.follower_count - a.follower_count)
    .slice(0, 8);

  // 4. Calculate metrics
  const totalLikes = topPosts.reduce((s, p) => s + p.likes, 0);
  const totalRetweets = topPosts.reduce((s, p) => s + p.retweets, 0);
  const totalViews = topPosts.reduce((s, p) => s + p.views, 0);
  const count = topPosts.length || 1;

  const avgLikes = Math.round(totalLikes / count);
  const avgRetweets = Math.round(totalRetweets / count);
  const avgViews = Math.round(totalViews / count);

  // Engagement score: (avg engagements per tweet / follower count) * 10000, capped at 100
  const avgEngagements = (totalLikes + totalRetweets) / count;
  const engagementScore =
    followerCount > 0
      ? Math.min(100, Math.round((avgEngagements / followerCount) * 10000))
      : 0;

  const tweetDates = topPosts.map((p) => p.date).filter(Boolean);
  const postingFrequency = estimatePostingFrequency(tweetDates);
  const topThemes = extractThemes(topPosts);

  const metrics: XImportData["metrics"] = {
    engagement_score: engagementScore,
    avg_likes: avgLikes,
    avg_retweets: avgRetweets,
    avg_views: avgViews,
    top_themes: topThemes,
    recommended_products: [],
    posting_frequency: postingFrequency,
    audience_sentiment: "Positive",
  };

  return {
    username,
    displayName,
    bio,
    followerCount,
    profileImageUrl,
    bannerUrl: user.profile_banner_url ?? null,
    verified,
    topPosts,
    topFollowers,
    metrics,
  };
}
