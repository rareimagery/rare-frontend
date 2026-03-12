import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tierId, tierName, amount, currency, interval, storeId, sellerXId, storeSlug } =
      await req.json();

    if (!tierId || !amount || !storeId) {
      return NextResponse.json(
        { error: "tierId, amount, and storeId are required" },
        { status: 400 }
      );
    }

    const provider = getPaymentProvider();
    const baseUrl = process.env.NEXTAUTH_URL || "https://rareimagery.net";

    const intent = await provider.createSubscription({
      tierId,
      tierName: tierName || "Subscription",
      amount: parseFloat(amount),
      currency: currency || "USD",
      interval: interval || "month",
      storeId,
      buyerXId: (token.xId as string) || null,
      sellerXId: sellerXId || null,
      successUrl: `${baseUrl}/stores/${storeSlug || storeId}?subscribed=true`,
      cancelUrl: `${baseUrl}/stores/${storeSlug || storeId}`,
    });

    return NextResponse.json({
      checkoutUrl: intent.checkoutUrl,
      subscriptionId: intent.id,
      provider: intent.provider,
    });
  } catch (err: any) {
    console.error("Subscription checkout error:", err.message);
    return NextResponse.json(
      { error: err.message || "Subscription checkout failed" },
      { status: 500 }
    );
  }
}
