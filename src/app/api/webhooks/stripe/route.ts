import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

const DRUPAL_API = process.env.DRUPAL_API_URL;
const DRUPAL_TOKEN = process.env.DRUPAL_API_TOKEN;

async function createDrupalStore(slug: string, storeName: string) {
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
          default_currency: "USD",
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drupal store creation failed: ${res.status} — ${body}`);
  }

  return res.json();
}

async function findXProfile(xUsername: string): Promise<string | null> {
  const params = new URLSearchParams({
    "filter[field_x_username]": xUsername,
  });

  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile?${params.toString()}`,
    { headers: { Authorization: `Bearer ${DRUPAL_TOKEN}` } }
  );

  if (!res.ok) return null;

  const json = await res.json();
  const nodes = json.data ?? [];
  return nodes.length > 0 ? nodes[0].id : null;
}

async function linkProfileToStore(profileId: string, storeId: string) {
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile/${profileId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${DRUPAL_TOKEN}`,
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "node--creator_x_profile",
          id: profileId,
          relationships: {
            field_linked_store: {
              data: { type: "commerce_store--online", id: storeId },
            },
          },
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Profile-store link failed: ${res.status} — ${body}`);
  }

  return res.json();
}

async function createSubscription(customerId: string) {
  const stripe = getStripeClient();
  const price = await stripe.prices.create({
    currency: "usd",
    unit_amount: 100,
    recurring: { interval: "month" },
    product_data: { name: "RareImagery Creator Store Monthly" },
  });

  await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event;
  const stripe = getStripeClient();
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const storeSlug = session.metadata?.storeSlug;
      const xUsername = session.metadata?.xUsername;

      if (!storeSlug || !xUsername) {
        console.error("Missing metadata on checkout session:", session.id);
        break;
      }

      try {
        // 1. Create the Commerce Store in Drupal
        const storeData = await createDrupalStore(
          storeSlug,
          `${xUsername}'s Store`
        );
        const storeId = storeData.data.id;

        // 2. Find existing Creator X Profile and link it to the store
        const profileId = await findXProfile(xUsername);
        if (profileId) {
          await linkProfileToStore(profileId, storeId);
        } else {
          console.warn(
            `No existing X profile found for @${xUsername}, store created without link`
          );
        }

        // 3. Create the $1/month subscription
        if (session.customer) {
          await createSubscription(session.customer as string);
        }

        console.log(
          `Store "${storeSlug}" created for @${xUsername}, subscription started`
        );
      } catch (err: any) {
        console.error("Webhook processing error:", err.message);
        // Return 200 anyway so Stripe doesn't retry endlessly — log for manual fix
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.log(
        `Subscription ${subscription.id} cancelled for customer ${subscription.customer}`
      );
      // TODO: disable store access when subscription lapses
      break;
    }

    default:
      // Unhandled event type — ignore
      break;
  }

  return NextResponse.json({ received: true });
}
