import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { drupalAuthHeaders } from "@/lib/drupal";

const DRUPAL_API = process.env.DRUPAL_API_URL;

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storeId, theme } = await req.json();

  if (!storeId || !theme) {
    return NextResponse.json(
      { error: "storeId and theme are required" },
      { status: 400 }
    );
  }

  const res = await fetch(
    `${DRUPAL_API}/jsonapi/commerce_store/online/${storeId}`,
    {
      method: "PATCH",
      headers: {
        ...drupalAuthHeaders(),
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "commerce_store--online",
          id: storeId,
          attributes: {
            field_store_theme: JSON.stringify(theme),
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("Drupal theme update failed:", text);
    return NextResponse.json(
      { error: "Drupal update failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
