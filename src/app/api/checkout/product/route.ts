import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getPaymentProvider, type CheckoutItem } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { items, storeId, sellerXId } = (await req.json()) as {
      items: CheckoutItem[];
      storeId: string;
      sellerXId: string;
    };

    if (!items?.length || !storeId) {
      return NextResponse.json(
        { error: "items and storeId are required" },
        { status: 400 }
      );
    }

    const provider = getPaymentProvider();
    const baseUrl = process.env.NEXTAUTH_URL || "https://rareimagery.net";

    const intent = await provider.createCheckout({
      items,
      storeId,
      buyerXId: (token.xId as string) || null,
      sellerXId: sellerXId || null,
      successUrl: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/stores/${sellerXId || storeId}`,
    });

    return NextResponse.json({
      checkoutUrl: intent.checkoutUrl,
      paymentId: intent.id,
      provider: intent.provider,
    });
  } catch (err: any) {
    console.error("Product checkout error:", err.message);
    return NextResponse.json(
      { error: err.message || "Checkout failed" },
      { status: 500 }
    );
  }
}
