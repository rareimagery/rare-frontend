import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { fetchXData } from "@/lib/x-import";

const DRUPAL_API = process.env.DRUPAL_API_URL;
const DRUPAL_TOKEN = process.env.DRUPAL_API_TOKEN;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the creator X profile node UUID by username. */
async function findProfileByUsername(
  username: string
): Promise<{ uuid: string; nid: number } | null> {
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile?filter[field_x_username]=${encodeURIComponent(username)}`,
    { headers: { Authorization: `Bearer ${DRUPAL_TOKEN}` } }
  );

  if (!res.ok) {
    console.error("Drupal lookup failed:", res.status, await res.text());
    return null;
  }

  const json = await res.json();
  const nodes = json.data ?? [];
  if (nodes.length === 0) return null;

  return {
    uuid: nodes[0].id,
    nid: nodes[0].attributes.drupal_internal__nid,
  };
}

/** PATCH the creator profile node in Drupal with imported X data. */
async function patchProfile(
  uuid: string,
  attributes: Record<string, any>
): Promise<void> {
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile/${uuid}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${DRUPAL_TOKEN}`,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "node--creator_x_profile",
          id: uuid,
          attributes,
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drupal PATCH failed (${res.status}): ${text}`);
  }
}

// ---------------------------------------------------------------------------
// POST /api/stores/import-x-data
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Authenticate via NextAuth JWT
  const token = await getToken({ req });

  if (!token || token.role !== "creator") {
    return NextResponse.json(
      { error: "Sign in with X first" },
      { status: 401 }
    );
  }

  const xAccessToken = token.xAccessToken as string | undefined;
  const xId = token.xId as string | undefined;
  const xUsername = token.xUsername as string | undefined;

  if (!xAccessToken || !xId || !xUsername) {
    return NextResponse.json(
      { error: "Missing X credentials in session — please sign in again" },
      { status: 400 }
    );
  }

  // 2. Find the creator profile node in Drupal
  const profile = await findProfileByUsername(xUsername);
  if (!profile) {
    return NextResponse.json(
      {
        error:
          "No Creator X Profile found for this account. Provision your page first.",
      },
      { status: 404 }
    );
  }

  // 3. Fetch data from X API
  let xData;
  try {
    xData = await fetchXData(xAccessToken, xId);
  } catch (err: any) {
    console.error("X data import failed:", err);
    return NextResponse.json(
      { error: `Failed to fetch X data: ${err.message}` },
      { status: 502 }
    );
  }

  // 4. Build Drupal PATCH payload
  const topPostsJson = xData.topPosts.map((p) => JSON.stringify(p));
  const topFollowersJson = xData.topFollowers.map((f) => JSON.stringify(f));
  const metricsJson = JSON.stringify(xData.metrics);

  const attributes: Record<string, any> = {
    field_follower_count: xData.followerCount,
    field_bio_description: {
      value: xData.bio,
      format: "basic_html",
    },
    field_top_posts: topPostsJson,
    field_top_followers: topFollowersJson,
    field_metrics: metricsJson,
  };

  // 5. PATCH the Drupal node
  try {
    await patchProfile(profile.uuid, attributes);
  } catch (err: any) {
    console.error("Drupal PATCH failed:", err);
    return NextResponse.json(
      { error: `Failed to save to Drupal: ${err.message}` },
      { status: 500 }
    );
  }

  // 6. Return summary
  return NextResponse.json({
    success: true,
    profileId: profile.uuid,
    summary: {
      username: xData.username,
      displayName: xData.displayName,
      followerCount: xData.followerCount,
      postsImported: xData.topPosts.length,
      topFollowersImported: xData.topFollowers.length,
      engagementScore: xData.metrics.engagement_score,
      postingFrequency: xData.metrics.posting_frequency,
      topThemes: xData.metrics.top_themes,
      profileImageUrl: xData.profileImageUrl,
      verified: xData.verified,
    },
  });
}
