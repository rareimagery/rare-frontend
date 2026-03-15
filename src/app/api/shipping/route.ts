import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { drupalAuthHeaders, drupalWriteHeaders } from "@/lib/drupal";
import { verifyStoreOwnership } from "@/lib/ownership";

const DRUPAL_API = process.env.DRUPAL_API_URL;

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const state = searchParams.get("state"); // pending, ready, shipped, delivered, cancelled
  const page = searchParams.get("page") || "0";

  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  if (!(await verifyStoreOwnership(token, storeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const filters = [`filter[order_id.store_id.id]=${storeId}`];
    if (state && state !== "all") {
      filters.push(`filter[state]=${state}`);
    }

    const url = [
      `${DRUPAL_API}/jsonapi/commerce_shipment/default`,
      `?${filters.join("&")}`,
      `&include=order_id,shipping_method`,
      `&sort=-created`,
      `&page[offset]=${parseInt(page) * 20}&page[limit]=20`,
    ].join("");

    const res = await fetch(url, {
      headers: { ...drupalAuthHeaders() },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Drupal shipments fetch failed:", text);
      return NextResponse.json({ error: "Failed to fetch shipments" }, { status: res.status });
    }

    const json = await res.json();
    const included = json.included || [];

    const shipments = (json.data || []).map((shipment: any) => {
      const orderRef = shipment.relationships?.order_id?.data;
      const order = orderRef ? included.find((i: any) => i.id === orderRef.id) : null;
      const methodRef = shipment.relationships?.shipping_method?.data;
      const method = methodRef ? included.find((i: any) => i.id === methodRef.id) : null;

      return {
        id: shipment.id,
        drupalId: shipment.attributes?.drupal_internal__shipment_id,
        state: shipment.attributes?.state,
        trackingCode: shipment.attributes?.tracking_code || null,
        amount: shipment.attributes?.amount?.number,
        currency: shipment.attributes?.amount?.currency_code,
        shippingMethod: method?.attributes?.name || null,
        shippingAddress: shipment.attributes?.shipping_profile?.address || null,
        packageType: shipment.attributes?.package_type?.label || null,
        weight: shipment.attributes?.weight || null,
        createdAt: shipment.attributes?.created,
        shippedAt: shipment.attributes?.shipped || null,
        order: order
          ? {
              id: order.id,
              orderNumber: order.attributes?.order_number,
              email: order.attributes?.mail,
              total: order.attributes?.total_price?.number,
              currency: order.attributes?.total_price?.currency_code,
            }
          : null,
      };
    });

    return NextResponse.json({
      shipments,
      total: json.meta?.count || shipments.length,
      page: parseInt(page),
    });
  } catch (err) {
    console.error("Shipping API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update shipment tracking code or state
export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { shipmentId, trackingCode, state } = await req.json();
    if (!shipmentId) {
      return NextResponse.json({ error: "shipmentId required" }, { status: 400 });
    }

    const writeHeaders = await drupalWriteHeaders();
    const attributes: Record<string, any> = {};
    if (trackingCode !== undefined) attributes.tracking_code = trackingCode;
    if (state !== undefined) attributes.state = state;

    const res = await fetch(
      `${DRUPAL_API}/jsonapi/commerce_shipment/default/${shipmentId}`,
      {
        method: "PATCH",
        headers: {
          ...writeHeaders,
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "commerce_shipment--default",
            id: shipmentId,
            attributes,
          },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Shipping PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
