const DRUPAL_API_URL = process.env.DRUPAL_API_URL || "http://72.62.80.155:8080";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TopPost {
  id: string;
  text: string;
  image_url?: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  date: string;
}

export interface TopFollower {
  username: string;
  display_name: string;
  profile_image_url?: string;
  follower_count: number;
  verified: boolean;
}

export interface Metrics {
  engagement_score: number;
  avg_likes: number;
  avg_retweets: number;
  avg_views: number;
  top_themes: string[];
  recommended_products: string[];
  posting_frequency: string;
  audience_sentiment: string;
}

export interface CreatorProfile {
  id: string;
  drupal_internal__nid: number;
  title: string;
  x_username: string;
  bio: string;
  follower_count: number;
  profile_picture_url: string | null;
  banner_url: string | null;
  top_posts: TopPost[];
  top_followers: TopFollower[];
  metrics: Metrics | null;
  linked_store_id: string | null;
  linked_store_path: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function drupalAbsoluteUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${DRUPAL_API_URL}${path}`;
}

function parseJsonField<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function mapCreatorProfile(node: any, included: any[] = []): CreatorProfile {
  const attrs = node.attributes;
  const rels = node.relationships;

  // Resolve profile picture from included
  let profilePicUrl: string | null = null;
  const pfpData = rels?.field_profile_picture?.data;
  if (pfpData) {
    const fileId = pfpData.id;
    const fileEntity = included.find(
      (inc: any) => inc.id === fileId && inc.type === "file--file"
    );
    if (fileEntity) {
      profilePicUrl = drupalAbsoluteUrl(fileEntity.attributes?.uri?.url);
    }
  }

  // Resolve banner from included
  let bannerUrl: string | null = null;
  const bannerData = rels?.field_background_banner?.data;
  if (bannerData) {
    const fileId = bannerData.id;
    const fileEntity = included.find(
      (inc: any) => inc.id === fileId && inc.type === "file--file"
    );
    if (fileEntity) {
      bannerUrl = drupalAbsoluteUrl(fileEntity.attributes?.uri?.url);
    }
  }

  // Parse multi-value JSON text fields
  const topPostsRaw: string[] = attrs.field_top_posts ?? [];
  const topPosts: TopPost[] = topPostsRaw
    .map((v: string) => parseJsonField<TopPost>(v))
    .filter(Boolean) as TopPost[];

  const topFollowersRaw: string[] = attrs.field_top_followers ?? [];
  const topFollowers: TopFollower[] = topFollowersRaw
    .map((v: string) => parseJsonField<TopFollower>(v))
    .filter(Boolean) as TopFollower[];

  const metrics = parseJsonField<Metrics>(attrs.field_metrics);

  // Linked store
  const storeRel = rels?.field_linked_store?.data;
  const linkedStoreId = storeRel?.id ?? null;
  let linkedStorePath: string | null = null;
  if (linkedStoreId) {
    const storeEntity = included.find(
      (inc: any) => inc.id === linkedStoreId
    );
    if (storeEntity) {
      linkedStorePath = storeEntity.attributes?.path?.alias ?? null;
    }
  }

  return {
    id: node.id,
    drupal_internal__nid: attrs.drupal_internal__nid,
    title: attrs.title,
    x_username: attrs.field_x_username,
    bio: attrs.field_bio_description?.processed ?? attrs.field_bio_description?.value ?? "",
    follower_count: attrs.field_follower_count ?? 0,
    profile_picture_url: profilePicUrl,
    banner_url: bannerUrl,
    top_posts: topPosts,
    top_followers: topFollowers,
    metrics,
    linked_store_id: linkedStoreId,
    linked_store_path: linkedStorePath,
  };
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function getCreatorProfile(
  username: string
): Promise<CreatorProfile | null> {
  const params = new URLSearchParams({
    "filter[field_x_username]": username,
    include: "field_linked_store,field_profile_picture,field_background_banner",
  });

  const url = `${DRUPAL_API_URL}/jsonapi/node/creator_x_profile?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    console.error(`Drupal API error: ${res.status} ${res.statusText}`);
    return null;
  }

  const json = await res.json();
  const nodes = json.data;
  if (!nodes || nodes.length === 0) return null;

  return mapCreatorProfile(nodes[0], json.included ?? []);
}

export async function getAllCreatorProfiles(): Promise<CreatorProfile[]> {
  const params = new URLSearchParams({
    include: "field_profile_picture,field_background_banner",
  });

  const url = `${DRUPAL_API_URL}/jsonapi/node/creator_x_profile?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    console.error(`Drupal API error: ${res.status} ${res.statusText}`);
    return [];
  }

  const json = await res.json();
  const nodes = json.data ?? [];
  const included = json.included ?? [];

  return nodes.map((node: any) => mapCreatorProfile(node, included));
}

export async function getCreatorStore(storeId: string): Promise<any | null> {
  const url = `${DRUPAL_API_URL}/jsonapi/commerce_store/online/${storeId}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    console.error(`Drupal store API error: ${res.status}`);
    return null;
  }

  const json = await res.json();
  return json.data ?? null;
}
