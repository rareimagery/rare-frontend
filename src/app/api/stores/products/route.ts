import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const DRUPAL_API = process.env.DRUPAL_API_URL;
const DRUPAL_TOKEN = process.env.DRUPAL_API_TOKEN;

// GET — list products for a store
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  const params = new URLSearchParams({
    "filter[stores.meta.drupal_internal__target_id]": storeId,
    include: "variations",
    "page[limit]": "50",
  });

  const res = await fetch(
    `${DRUPAL_API}/jsonapi/commerce_product/default?${params}`,
    {
      headers: { Authorization: `Bearer ${DRUPAL_TOKEN}` },
      next: { revalidate: 0 },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: res.status });
  }

  const json = await res.json();
  const included = json.included ?? [];

  const products = (json.data ?? []).map((p: any) => {
    const varRef = p.relationships?.variations?.data?.[0];
    const variation = varRef ? included.find((i: any) => i.id === varRef.id) : null;

    return {
      id: p.id,
      drupal_id: p.attributes.drupal_internal__product_id,
      title: p.attributes.title,
      description: p.attributes.body?.value ?? "",
      price: variation?.attributes?.price?.number ?? "0.00",
      currency: variation?.attributes?.price?.currency_code ?? "USD",
      sku: variation?.attributes?.sku ?? "",
      status: p.attributes.status,
      variation_id: variation?.id ?? null,
    };
  });

  return NextResponse.json({ products });
}

// POST — create a new product
export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, price, storeId } = await req.json();

  if (!title || !price || !storeId) {
    return NextResponse.json(
      { error: "title, price, and storeId are required" },
      { status: 400 }
    );
  }

  // 1. Create product variation (SKU + price)
  const sku = `${storeId}-${Date.now()}`;
  const variationRes = await fetch(
    `${DRUPAL_API}/jsonapi/commerce_product_variation/default`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DRUPAL_TOKEN}`,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "commerce_product_variation--default",
          attributes: {
            sku,
            price: {
              number: String(price),
              currency_code: "USD",
            },
            status: true,
          },
        },
      }),
    }
  );

  if (!variationRes.ok) {
    const body = await variationRes.text();
    console.error("Variation creation failed:", body);
    return NextResponse.json(
      { error: "Failed to create product variation" },
      { status: 500 }
    );
  }

  const variationData = await variationRes.json();
  const variationId = variationData.data.id;

  // 2. Create the product linked to the store and variation
  const productRes = await fetch(
    `${DRUPAL_API}/jsonapi/commerce_product/default`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DRUPAL_TOKEN}`,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "commerce_product--default",
          attributes: {
            title,
            body: description ? { value: description, format: "basic_html" } : undefined,
            status: true,
          },
          relationships: {
            stores: {
              data: [
                {
                  type: "commerce_store--online",
                  id: storeId,
                },
              ],
            },
            variations: {
              data: [
                {
                  type: "commerce_product_variation--default",
                  id: variationId,
                },
              ],
            },
          },
        },
      }),
    }
  );

  if (!productRes.ok) {
    const body = await productRes.text();
    console.error("Product creation failed:", body);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }

  const productData = await productRes.json();

  return NextResponse.json({
    id: productData.data.id,
    title,
    price,
    sku,
  });
}

// DELETE — delete a product
export async function DELETE(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const res = await fetch(
    `${DRUPAL_API}/jsonapi/commerce_product/default/${productId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${DRUPAL_TOKEN}` },
    }
  );

  if (!res.ok && res.status !== 204) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
