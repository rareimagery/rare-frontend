import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isValidSlug } from "@/lib/slugs";

const DRUPAL_API = process.env.DRUPAL_API_URL;
const DRUPAL_TOKEN = process.env.DRUPAL_API_TOKEN;

async function isSlugTaken(slug: string): Promise<boolean> {
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/commerce_store/online?filter[field_store_slug]=${slug}`,
    { headers: { Authorization: `Bearer ${DRUPAL_TOKEN}` } }
  );
  const data = await res.json();
  return (data?.data?.length ?? 0) > 0;
}

async function createDrupalStore(
  slug: string,
  storeName: string,
  ownerEmail: string
) {
  const res = await fetch(`${DRUPAL_API}/jsonapi/commerce_store/online`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DRUPAL_TOKEN}`,
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "commerce_store--online",
        attributes: {
          name: storeName,
          field_store_slug: slug,
          mail: ownerEmail,
          default_currency: "USD",
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Drupal store creation failed: ${res.status}`);
  return res.json();
}

async function createXProfile(xUsername: string, storeId: string) {
  const res = await fetch(`${DRUPAL_API}/jsonapi/node/creator_x_profile`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DRUPAL_TOKEN}`,
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "node--creator_x_profile",
        attributes: {
          title: `${xUsername} X Profile`,
          field_x_username: xUsername,
        },
        relationships: {
          field_linked_store: {
            data: { type: "commerce_store--online", id: storeId },
          },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`X Profile creation failed: ${res.status}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storeName, slug, xUsername, ownerEmail } = await req.json();

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
    const storeData = await createDrupalStore(slug, storeName, ownerEmail);
    await createXProfile(xUsername, storeData.data.id);

    return NextResponse.json({
      success: true,
      storeId: storeData.data.id,
      slug,
      url: `https://${slug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
