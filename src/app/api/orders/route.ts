import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { drupalAuthHeaders } from "@/lib/drupal";
import { verifyStoreOwnership } from "@/lib/ownership";

const DRUPAL_API = process.env.DRUPAL_API_URL;

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const status = searchParams.get("status"); // pending, completed, cancelled, all
  const page = searchParams.get("page") || "0";

  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  if (!(await verifyStoreOwnership(token, storeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const filters = [`filter[store_id.id]=${storeId}`];
    if (status && status !== "all") {
      filters.push(`filter[state]=${status}`);
    }

    const url = [
      `${DRUPAL_API}/jsonapi/commerce_order/default`,
      `?${filters.join("&")}`,
      `&include=order_items,billing_profile`,
      `&sort=-placed`,
      `&page[offset]=${parseInt(page) * 20}&page[limit]=20`,
    ].join("");

    const res = await fetch(url, {
      headers: { ...drupalAuthHeaders() },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Drupal orders fetch failed:", text);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: res.status });
    }

    const json = await res.json();
    const included = json.included || [];

    const orders = (json.data || []).map((order: any) => {
      const billingProfileRef = order.relationships?.billing_profile?.data;
      const billingProfile = billingProfileRef
        ? included.find((i: any) => i.id === billingProfileRef.id)
        : null;

      const itemRefs = order.relationships?.order_items?.data || [];
      const items = itemRefs.map((ref: any) =>
        included.find((i: any) => i.id === ref.id)
      ).filter(Boolean);

      return {
        id: order.id,
        drupalId: order.attributes?.drupal_internal__order_id,
        orderNumber: order.attributes?.order_number,
        state: order.attributes?.state,
        email: order.attributes?.mail,
        placedAt: order.attributes?.placed,
        completedAt: order.attributes?.completed,
        total: order.attributes?.total_price?.number,
        currency: order.attributes?.total_price?.currency_code,
        subtotal: null,
        billingAddress: billingProfile?.attributes?.address || null,
        customerName: [
          billingProfile?.attributes?.address?.given_name,
          billingProfile?.attributes?.address?.family_name,
        ].filter(Boolean).join(" ") || order.attributes?.mail || "Unknown",
        itemCount: items.length,
        items: items.map((item: any) => ({
          id: item.id,
          title: item.attributes?.title,
          quantity: item.attributes?.quantity,
          unitPrice: item.attributes?.unit_price?.number,
          totalPrice: item.attributes?.total_price?.number,
          currency: item.attributes?.total_price?.currency_code,
        })),
      };
    });

    return NextResponse.json({
      orders,
      total: json.meta?.count || orders.length,
      page: parseInt(page),
    });
  } catch (err) {
    console.error("Orders API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
