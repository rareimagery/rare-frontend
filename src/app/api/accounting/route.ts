import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { drupalAuthHeaders } from "@/lib/drupal";
import { verifyStoreOwnership } from "@/lib/ownership";

const DRUPAL_API = process.env.DRUPAL_API_URL;
const PLATFORM_FEE_RATE = 0.029;
const PLATFORM_FEE_FLAT = 0.30;

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const period = searchParams.get("period") || "30"; // days

  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  if (!(await verifyStoreOwnership(token, storeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch completed orders within the period
    // placed is a Unix timestamp field — filter using named condition format
    const sinceTs = Math.floor((Date.now() - parseInt(period) * 24 * 60 * 60 * 1000) / 1000);

    const completedUrl = [
      `${DRUPAL_API}/jsonapi/commerce_order/default`,
      `?filter[store_id.id]=${storeId}`,
      `&filter[state_filter][condition][path]=state`,
      `&filter[state_filter][condition][value]=completed`,
      `&filter[placed_filter][condition][path]=placed`,
      `&filter[placed_filter][condition][operator]=%3E%3D`,
      `&filter[placed_filter][condition][value]=${sinceTs}`,
      `&page[limit]=200`,
      `&sort=-placed`,
    ].join("");

    const pendingUrl = [
      `${DRUPAL_API}/jsonapi/commerce_order/default`,
      `?filter[store_id.id]=${storeId}`,
      `&filter[state]=pending`,
      `&page[limit]=50`,
    ].join("");

    const [completedRes, pendingRes] = await Promise.all([
      fetch(completedUrl, { headers: { ...drupalAuthHeaders() }, next: { revalidate: 0 } }),
      fetch(pendingUrl, { headers: { ...drupalAuthHeaders() }, next: { revalidate: 0 } }),
    ]);

    const completedJson = completedRes.ok ? await completedRes.json() : { data: [] };
    const pendingJson = pendingRes.ok ? await pendingRes.json() : { data: [] };

    const completedOrders: any[] = completedJson.data || [];
    const pendingOrders: any[] = pendingJson.data || [];

    // Aggregate revenue metrics
    let grossRevenue = 0;
    let platformFees = 0;
    let orderCount = completedOrders.length;
    const dailyRevenue: Record<string, number> = {};

    for (const order of completedOrders) {
      const total = parseFloat(order.attributes?.total_price?.number || "0");
      grossRevenue += total;

      const fee = total * PLATFORM_FEE_RATE + PLATFORM_FEE_FLAT;
      platformFees += fee;

      // Group by day
      const day = order.attributes?.placed?.split("T")[0];
      if (day) {
        dailyRevenue[day] = (dailyRevenue[day] || 0) + total;
      }
    }

    const netRevenue = grossRevenue - platformFees;
    const avgOrderValue = orderCount > 0 ? grossRevenue / orderCount : 0;

    // Build daily chart data for the period
    const chartData: { date: string; revenue: number }[] = [];
    for (let i = parseInt(period) - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      chartData.push({ date: key, revenue: dailyRevenue[key] || 0 });
    }

    // Pending orders value
    const pendingValue = pendingOrders.reduce((sum: number, o: any) => {
      return sum + parseFloat(o.attributes?.total_price?.number || "0");
    }, 0);

    return NextResponse.json({
      period: parseInt(period),
      currency: "USD",
      grossRevenue: parseFloat(grossRevenue.toFixed(2)),
      platformFees: parseFloat(platformFees.toFixed(2)),
      netRevenue: parseFloat(netRevenue.toFixed(2)),
      orderCount,
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      pendingOrderCount: pendingOrders.length,
      pendingValue: parseFloat(pendingValue.toFixed(2)),
      chartData,
      recentOrders: completedOrders.slice(0, 5).map((o: any) => ({
        id: o.id,
        orderNumber: o.attributes?.order_number,
        email: o.attributes?.mail,
        total: o.attributes?.total_price?.number,
        placedAt: o.attributes?.placed,
      })),
    });
  } catch (err) {
    console.error("Accounting API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
