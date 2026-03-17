import { NextRequest, NextResponse } from "next/server";
import { drupalAuthHeaders, drupalWriteHeaders } from "@/lib/drupal";
import { createRateLimiter, rateLimitResponse } from "@/lib/rate-limit";

const DRUPAL_API = process.env.DRUPAL_API_URL;

const registerLimit = createRateLimiter({
  limit: 5,
  windowMs: 60 * 60 * 1000,
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = registerLimit(ip);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterMs);

  const body = await req.json();
  const { email, password, displayName } = body;

  if (!email || !password || !displayName) {
    return NextResponse.json(
      { error: "Email, password, and display name are required." },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address." },
      { status: 400 }
    );
  }

  try {
    // Check if email already exists
    const lookupRes = await fetch(
      `${DRUPAL_API}/jsonapi/user/user?filter[mail]=${encodeURIComponent(email)}`,
      { headers: { ...drupalAuthHeaders() } }
    );
    if (lookupRes.ok) {
      const lookupData = await lookupRes.json();
      if (lookupData?.data?.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }
    }

    // Generate a unique Drupal username from display name
    const baseUsername = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40);
    const username = `${baseUsername}_${Date.now().toString(36)}`;

    // Create user in Drupal via JSON:API
    const writeHeaders = await drupalWriteHeaders();
    const createRes = await fetch(`${DRUPAL_API}/jsonapi/user/user`, {
      method: "POST",
      headers: {
        ...writeHeaders,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "user--user",
          attributes: {
            name: username,
            mail: email,
            pass: { value: password },
            status: true,
            field_shop_name: displayName,
          },
        },
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("[register] Drupal user creation failed:", errText);
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    const userData = await createRes.json();
    const uid = userData.data?.attributes?.drupal_internal__uid;

    return NextResponse.json({ success: true, userId: uid });
  } catch (err: any) {
    console.error("[register] Error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
