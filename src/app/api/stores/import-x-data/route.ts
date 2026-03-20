import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  fetchXData,
  findProfileByUsername,
  patchProfile,
  uploadImageToDrupal,
  createImportSnapshot,
  updateImportSnapshot,
} from "@/lib/x-import";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// POST /api/stores/import-x-data
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1. Authenticate via NextAuth JWT
  const token = await getToken({ req });
  if (!token || !token.xUsername) {
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
  const importRunId = randomUUID();
  const snapshotUuid = await createImportSnapshot({
    xUsername,
    xUserId: xId,
    runId: importRunId,
    status: "pending",
    profileUuid: profile?.uuid,
  });

  if (!profile) {
    if (snapshotUuid) {
      await updateImportSnapshot(snapshotUuid, {
        status: "failed",
        errorMessage: "No Creator X Profile found for this account.",
      });
    }
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
    if (snapshotUuid) {
      await updateImportSnapshot(snapshotUuid, {
        status: "failed",
        errorMessage: err.message,
      });
    }
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

  // 5. PATCH the Drupal node (text fields)
  try {
    await patchProfile(profile.uuid, attributes);
  } catch (err: any) {
    console.error("Drupal PATCH failed:", err);
    if (snapshotUuid) {
      await updateImportSnapshot(snapshotUuid, {
        status: "failed",
        errorMessage: err.message,
      });
    }
    return NextResponse.json(
      { error: `Failed to save to Drupal: ${err.message}` },
      { status: 500 }
    );
  }

  // 6. Upload profile picture and banner to Drupal
  let pfpUploaded = false;
  let bannerUploaded = false;

  if (xData.profileImageUrl) {
    const pfpId = await uploadImageToDrupal(
      xData.profileImageUrl,
      profile.uuid,
      "field_profile_picture",
      `${xUsername}-pfp`
    );
    pfpUploaded = pfpId !== null;
  }

  if (xData.bannerUrl) {
    const bannerId = await uploadImageToDrupal(
      xData.bannerUrl,
      profile.uuid,
      "field_background_banner",
      `${xUsername}-banner`
    );
    bannerUploaded = bannerId !== null;
  }

  if (snapshotUuid) {
    await updateImportSnapshot(snapshotUuid, {
      status: "success",
      profileUuid: profile.uuid,
      payload: {
        username: xData.username,
        followerCount: xData.followerCount,
        postsImported: xData.topPosts.length,
        topFollowersImported: xData.topFollowers.length,
        engagementScore: xData.metrics.engagement_score,
        verified: xData.verified,
      },
    });
  }

  // 7. Return summary
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
      bannerUrl: xData.bannerUrl,
      pfpUploaded,
      bannerUploaded,
      verified: xData.verified,
    },
  });
}
