import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkXSubscription } from "@/lib/x-subscription";
import { drupalAuthHeaders, drupalWriteHeaders } from "@/lib/drupal";
import { syncXDataToDrupal, fetchXData, patchProfile, findProfileByUsername } from "@/lib/x-import";
import { generateCreatorSite } from "@/lib/ai/generate-site";
import { createRateLimiter, rateLimitResponse } from "@/lib/rate-limit";
import { ensureStoreSubdomainDns } from "@/lib/cloudflare";

const DRUPAL_API = process.env.DRUPAL_API_URL;

async function profileExists(username: string): Promise<string | null> {
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile?filter[field_x_username]=${username}`,
    { headers: { ...drupalAuthHeaders() } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (json.data?.length > 0) return json.data[0].id;
  return null;
}

async function createProfile(
  username: string,
  xId: string
): Promise<{ id: string }> {
  const writeHeaders = await drupalWriteHeaders();
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile`,
    {
      method: "POST",
      headers: {
        ...writeHeaders,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "node--creator_x_profile",
          attributes: {
            title: `${username} X Profile`,
            field_x_username: username,
            field_store_theme: "xai3",
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create profile: ${text}`);
  }

  const json = await res.json();
  return { id: json.data.id };
}

const provisionLimit = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 }); // 5/hour

async function provisionStoreDns(slug: string) {
  try {
    const dns = await ensureStoreSubdomainDns(slug);
    if (!dns.configured) {
      console.log(`[cloudflare] DNS automation skipped for ${dns.hostname}`);
    }
  } catch (error) {
    console.error(`[cloudflare] DNS automation failed for ${slug}:`, error);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const agreedToTerms = Boolean(body?.agreedToTerms);

  if (!agreedToTerms) {
    return NextResponse.json(
      { error: "You must agree to the Terms of Service, EULA, and Privacy Policy" },
      { status: 400 }
    );
  }

  const token = await getToken({ req });
  if (!token || !token.xUsername) {
    return NextResponse.json(
      { error: "Sign in with X first" },
      { status: 401 }
    );
  }

  const userId = (token.xId as string) || (token.sub as string) || "anon";
  const rl = provisionLimit(userId);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const xUsername = token.xUsername as string;
  const xId = token.xId as string;
  const xAccessToken = token.xAccessToken as string;

  if (!xUsername || !xId) {
    return NextResponse.json(
      { error: "Missing X account info — please sign in again" },
      { status: 400 }
    );
  }

  // Check if profile already exists
  const existingId = await profileExists(xUsername);
  if (existingId) {
    await provisionStoreDns(xUsername);
    return NextResponse.json({
      success: true,
      profileId: existingId,
      alreadyExisted: true,
      url: `https://${xUsername}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`,
    });
  }

  // Verify X subscription (follows @rareimagery) — require access token
  if (!xAccessToken) {
    return NextResponse.json(
      { error: "X access token required — please sign in with X again" },
      { status: 401 }
    );
  }

  {
    const { subscribed, error } = await checkXSubscription(xAccessToken, xId);
    if (!subscribed) {
      return NextResponse.json(
        {
          error:
            error ||
            "You need to follow @rareimagery on X to get your free page. Subscribe at https://x.com/rareimagery",
          requiresSubscription: true,
        },
        { status: 403 }
      );
    }
  }

  try {
    const profile = await createProfile(xUsername, xId);
    await provisionStoreDns(xUsername);

    // Auto-sync X data to the newly created profile
    if (xAccessToken) {
      syncXDataToDrupal(xAccessToken, xId, xUsername).catch((err) =>
        console.error(`[provision] X data sync failed for @${xUsername}:`, err)
      );
    }

    // Auto-generate site via dual-AI pipeline (Grok → Haiku) — non-blocking
    (async () => {
      try {
        const xData = await fetchXData(xAccessToken, xId);
        const result = await generateCreatorSite(xData);

        const profileNode = await findProfileByUsername(xUsername);
        if (profileNode) {
          // Apply Grok's theme recommendation and rewritten bio
          await patchProfile(profileNode.uuid, {
            field_store_theme: result.grokAnalysis.suggestedThemePreset || "xai3",
            field_bio_description: {
              value: result.grokAnalysis.rewrittenBio,
              format: "basic_html",
            },
            field_metrics: JSON.stringify({
              ai_site: {
                version: 1,
                generatedAt: result.generatedAt,
                grokAnalysis: result.grokAnalysis,
                components: result.components,
              },
            }),
          });
          console.log(`[provision] AI site generated for @${xUsername}`);
        }
      } catch (err) {
        console.error(`[provision] AI site generation failed for @${xUsername}:`, err);
      }
    })();

    return NextResponse.json({
      success: true,
      profileId: profile.id,
      alreadyExisted: false,
      url: `https://${xUsername}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
