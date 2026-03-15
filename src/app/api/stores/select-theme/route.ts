import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { drupalAuthHeaders } from "@/lib/drupal";
import { verifyProfileOwnership } from "@/lib/ownership";

const DRUPAL_API = process.env.DRUPAL_API_URL;

const VALID_THEMES = ["xai3", "default", "minimal", "neon", "editorial", "myspace"];

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { profileNodeId, theme } = await req.json();

  if (!profileNodeId || !theme) {
    return NextResponse.json(
      { error: "profileNodeId and theme are required" },
      { status: 400 }
    );
  }

  if (!(await verifyProfileOwnership(token, profileNodeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!VALID_THEMES.includes(theme)) {
    return NextResponse.json(
      { error: `Invalid theme. Must be one of: ${VALID_THEMES.join(", ")}` },
      { status: 400 }
    );
  }

  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile/${profileNodeId}`,
    {
      method: "PATCH",
      headers: {
        ...drupalAuthHeaders(),
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "node--creator_x_profile",
          id: profileNodeId,
          attributes: {
            field_store_theme: theme,
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Drupal theme select failed:", text);
    return NextResponse.json(
      { error: "Drupal update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
