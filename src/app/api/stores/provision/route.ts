import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkXSubscription } from "@/lib/x-subscription";

const DRUPAL_API = process.env.DRUPAL_API_URL;
const DRUPAL_TOKEN = process.env.DRUPAL_API_TOKEN;

async function profileExists(username: string): Promise<string | null> {
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile?filter[field_x_username]=${username}`,
    { headers: { Authorization: `Bearer ${DRUPAL_TOKEN}` } }
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
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DRUPAL_TOKEN}`,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "node--creator_x_profile",
          attributes: {
            title: `${username} X Profile`,
            field_x_username: username,
            field_store_theme: "myspace",
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

export async function POST(req: NextRequest) {
  const token = await getToken({ req });

  if (!token || token.role !== "creator") {
    return NextResponse.json(
      { error: "Sign in with X first" },
      { status: 401 }
    );
  }

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
    return NextResponse.json({
      success: true,
      profileId: existingId,
      alreadyExisted: true,
      url: `https://${xUsername}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`,
    });
  }

  // Verify X subscription (follows @rareimagery)
  if (xAccessToken) {
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
  // If no access token, allow provisioning anyway (admin or fallback)

  try {
    const profile = await createProfile(xUsername, xId);

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
