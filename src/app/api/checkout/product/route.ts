import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { CheckoutItem } from "@/lib/payments";
import { createPaymentIntent } from "@/app/actions/payment";

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { items, storeId, sellerXId, sellerHandle, provider } = (await req.json()) as {
      items: CheckoutItem[];
      storeId: string;
      sellerXId: string;
      sellerHandle?: string;
      provider?: "stripe" | "xmoney";
    };

    if (!items?.length || !storeId) {
      return NextResponse.json(
        { error: "items and storeId are required" },
        { status: 400 }
      );
    }

    const firstItem = items[0];
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const targetProvider = provider ?? "xmoney";

    const intent = await createPaymentIntent(
      {
        productId: firstItem.productId,
        price: totalPrice,
        sellerHandle: sellerHandle || sellerXId || storeId,
      },
      targetProvider
    );

    if (!intent.success) {
      return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
    }

    return NextResponse.json({
      checkoutUrl: intent.paymentLink,
      paymentId: `${targetProvider}-${Date.now()}`,
      provider: intent.provider,
      message: intent.message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    console.error("Product checkout error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
