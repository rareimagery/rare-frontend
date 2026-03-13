import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidSlug } from "@/lib/slugs";
import { notifyAdminNewStore } from "@/lib/notifications";

import { drupalAuthHeaders, drupalWriteHeaders } from "@/lib/drupal";

const DRUPAL_API = process.env.DRUPAL_API_URL;

async function isSlugTaken(slug: string): Promise<boolean> {
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/commerce_store/online?filter[field_store_slug]=${slug}`,
    { headers: { ...drupalAuthHeaders() } }
  );
  const data = await res.json();
  return (data?.data?.length ?? 0) > 0;
}

async function createDrupalStore(
  slug: string,
  storeName: string,
  ownerEmail: string,
  currency: string
) {
  const writeHeaders = await drupalWriteHeaders();
  const res = await fetch(`${DRUPAL_API}/jsonapi/commerce_store/online`, {
    method: "POST",
    headers: {
      ...writeHeaders,
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "commerce_store--online",
        attributes: {
          name: storeName,
          field_store_slug: slug,
          mail: ownerEmail,
          timezone: "America/New_York",
          address: {
            country_code: "US",
            address_line1: "N/A",
            locality: "New York",
            administrative_area: "NY",
            postal_code: "10001",
          },
          field_store_status: "pending",
        },
        relationships: {
          default_currency: {
            data: {
              type: "commerce_currency--commerce_currency",
              id: "7be59a35-eea8-4d2d-8be4-b113aafad8d4",
            },
          },
        },
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("Store creation error:", errText);
    throw new Error(`Drupal store creation failed: ${res.status} — ${errText.slice(0, 300)}`);
  }
  return res.json();
}

interface XProfileFields {
  xUsername: string;
  bioDescription?: string;
  followerCount?: number | null;
  profilePictureUrl?: string;
  backgroundBannerUrl?: string;
  topPosts?: string;
  topFollowers?: string;
  metrics?: string;
  myspaceAccentColor?: string;
  myspaceGlitterColor?: string;
  myspaceBackgroundUrl?: string;
  myspaceMusicUrl?: string;
}

async function createXProfile(storeId: string, fields: XProfileFields) {
  const attributes: Record<string, unknown> = {
    title: `${fields.xUsername} X Profile`,
    field_x_username: fields.xUsername,
  };

  // Optional text fields
  if (fields.bioDescription) {
    attributes.field_bio_description = {
      value: fields.bioDescription,
      format: "basic_html",
    };
  }
  if (fields.followerCount != null) {
    attributes.field_follower_count = fields.followerCount;
  }
  if (fields.topPosts) {
    attributes.field_top_posts = {
      value: fields.topPosts,
      format: "basic_html",
    };
  }
  if (fields.topFollowers) {
    attributes.field_top_followers = {
      value: fields.topFollowers,
      format: "basic_html",
    };
  }
  if (fields.metrics) {
    attributes.field_metrics = {
      value: fields.metrics,
      format: "basic_html",
    };
  }

  // MySpace fields
  if (fields.myspaceAccentColor) {
    attributes.field_myspace_accent_color = fields.myspaceAccentColor;
  }
  if (fields.myspaceGlitterColor) {
    attributes.field_myspace_glitter_color = fields.myspaceGlitterColor;
  }
  if (fields.myspaceBackgroundUrl) {
    attributes.field_myspace_background = fields.myspaceBackgroundUrl;
  }
  if (fields.myspaceMusicUrl) {
    attributes.field_myspace_music_url = fields.myspaceMusicUrl;
  }

  const profileWriteHeaders = await drupalWriteHeaders();
  const res = await fetch(`${DRUPAL_API}/jsonapi/node/creator_x_profile`, {
    method: "POST",
    headers: {
      ...profileWriteHeaders,
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "node--creator_x_profile",
        attributes,
        relationships: {
          field_linked_store: {
            data: { type: "commerce_store--online", id: storeId },
          },
        },
      },
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(
      `X Profile creation failed: ${res.status} — ${errBody.slice(0, 200)}`
    );
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    storeName,
    slug,
    ownerEmail,
    currency,
    agreedToTerms,
    xUsername,
    bioDescription,
    followerCount,
    topPosts,
    topFollowers,
    metrics,
    myspaceAccentColor,
    myspaceGlitterColor,
    myspaceBackgroundUrl,
    myspaceMusicUrl,
  } = body;

  if (!agreedToTerms) {
    return NextResponse.json(
      { error: "You must agree to the Terms of Service, EULA, and Privacy Policy" },
      { status: 400 }
    );
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Slug must be 3-30 lowercase letters, numbers, or hyphens" },
      { status: 400 }
    );
  }

  if (await isSlugTaken(slug)) {
    return NextResponse.json(
      { error: "That subdomain is already taken" },
      { status: 409 }
    );
  }

  try {
    const storeData = await createDrupalStore(
      slug,
      storeName,
      ownerEmail,
      currency
    );
    const profileData = await createXProfile(storeData.data.id, {
      xUsername,
      bioDescription,
      followerCount,
      topPosts,
      topFollowers,
      metrics,
      myspaceAccentColor,
      myspaceGlitterColor,
      myspaceBackgroundUrl,
      myspaceMusicUrl,
    });

    // Notify admin of new store submission (fire-and-forget)
    notifyAdminNewStore(
      storeName,
      slug,
      xUsername || slug,
      ownerEmail || session.user?.email || ""
    ).catch((err) => console.error("Admin notification failed:", err));

    return NextResponse.json({
      success: true,
      storeId: storeData.data.id,
      storeDrupalId: String(
        storeData.data.attributes?.drupal_internal__store_id ?? ""
      ),
      profileNodeId: profileData.data.id,
      slug,
      url: `https://${slug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
