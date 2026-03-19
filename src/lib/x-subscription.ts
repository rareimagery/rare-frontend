// ---------------------------------------------------------------------------
// X Subscription Check — raw fetch per x-api-integration.md
// ---------------------------------------------------------------------------

import { X_API_BASE } from "@/lib/x-api/client";
import { fetchWithRetry } from "@/lib/x-api/fetch-with-retry";
import { drupalAuthHeaders } from "@/lib/drupal";

const DEFAULT_REQUIRED_X_USERNAME = "rareimagery";
const DRUPAL_API = process.env.DRUPAL_API_URL;

function requiredUsernameFromEnv(): string {
  const raw = process.env.REQUIRED_X_CREATOR_USERNAME?.trim();
  return (raw || DEFAULT_REQUIRED_X_USERNAME).replace(/^@+/, "").toLowerCase();
}

function requiredStoreIdFromEnv(): string {
  return process.env.REQUIRED_X_CREATOR_STORE_ID?.trim() || "";
}

async function resolveRequiredCreatorStoreId(requiredUsername: string): Promise<string | null> {
  const configuredStoreId = requiredStoreIdFromEnv();
  if (configuredStoreId) {
    return configuredStoreId;
  }

  if (!DRUPAL_API) {
    return null;
  }

  const params = new URLSearchParams({
    "filter[field_x_username]": requiredUsername,
  });

  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile?${params.toString()}`,
    { headers: { ...drupalAuthHeaders() }, next: { revalidate: 0 } }
  );

  if (!res.ok) {
    return null;
  }

  const json = await res.json();
  const profile = json.data?.[0];
  const storeId = profile?.relationships?.field_linked_store?.data?.id;
  return typeof storeId === "string" && storeId.length > 0 ? storeId : null;
}

type PaidSubscriptionCheckInput = {
  buyerXId?: string | null;
  buyerUsername?: string | null;
  requiredUsername?: string;
};

export async function checkRequiredPaidSubscription({
  buyerXId,
  buyerUsername,
  requiredUsername = requiredUsernameFromEnv(),
}: PaidSubscriptionCheckInput): Promise<{
  subscribed: boolean;
  tier?: string | null;
  storeId?: string;
  error?: string;
}> {
  try {
    if (!DRUPAL_API) {
      return { subscribed: false, error: "Drupal API URL is not configured." };
    }

    const normalizedUser = buyerUsername?.trim().replace(/^@+/, "") || "";
    const buyerKeys = [buyerXId?.trim() || "", normalizedUser].filter(Boolean);

    if (buyerKeys.length === 0) {
      return { subscribed: false, error: "Missing buyer identity for subscription check." };
    }

    const requiredStoreId = await resolveRequiredCreatorStoreId(requiredUsername);
    if (!requiredStoreId) {
      return {
        subscribed: false,
        error: `Required creator store is not configured for @${requiredUsername}.`,
      };
    }

    for (const buyerKey of buyerKeys) {
      const params = new URLSearchParams({
        "filter[field_buyer_x_id]": buyerKey,
        "filter[field_store_id]": requiredStoreId,
        "filter[field_subscription_status]": "active",
      });

      const res = await fetch(
        `${DRUPAL_API}/jsonapi/node/store_subscription?${params.toString()}`,
        { headers: { ...drupalAuthHeaders() }, next: { revalidate: 0 } }
      );

      if (!res.ok) {
        continue;
      }

      const json = await res.json();
      const subscriptions = Array.isArray(json.data) ? json.data : [];
      if (subscriptions.length > 0) {
        const attrs = subscriptions[0]?.attributes || {};
        return {
          subscribed: true,
          tier: attrs.field_tier_id ?? null,
          storeId: requiredStoreId,
        };
      }
    }

    return {
      subscribed: false,
      storeId: requiredStoreId,
      error: `Active paid subscription required for @${requiredUsername}.`,
    };
  } catch (err: any) {
    console.error("Paid subscription check error:", err);
    return { subscribed: false, error: err?.message || "Subscription check failed." };
  }
}

/**
 * Check if a user follows @rareimagery on X.
 * Uses user-context OAuth 2.0 access token to read following list.
 */
export async function checkXSubscription(
  accessToken: string,
  userId: string,
  requiredUsername = requiredUsernameFromEnv()
): Promise<{ subscribed: boolean; error?: string }> {
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    const params = new URLSearchParams({
      max_results: "1000",
      "user.fields": "username",
    });

    const res = await fetchWithRetry(
      `${X_API_BASE}/users/${encodeURIComponent(userId)}/following?${params}`,
      { headers }
    );

    if (!res.ok) {
      if (res.status === 401) {
        return { subscribed: false, error: "X token expired — please sign in again" };
      }
      return { subscribed: false, error: `X API error ${res.status}` };
    }

    const json = await res.json();
    const following: Array<{ username?: string }> = json.data ?? [];

    if (
      following.some(
        (user) =>
          user.username?.toLowerCase() === requiredUsername
      )
    ) {
      return { subscribed: true };
    }

    // Paginate if needed
    let nextToken: string | undefined = json.meta?.next_token;
    while (nextToken) {
      const pageParams = new URLSearchParams({
        max_results: "1000",
        "user.fields": "username",
        pagination_token: nextToken,
      });

      const pageRes = await fetchWithRetry(
        `${X_API_BASE}/users/${encodeURIComponent(userId)}/following?${pageParams}`,
        { headers }
      );

      if (!pageRes.ok) break;

      const pageJson = await pageRes.json();
      const pageData: Array<{ username?: string }> = pageJson.data ?? [];

      if (
        pageData.some(
          (user) =>
            user.username?.toLowerCase() === requiredUsername
        )
      ) {
        return { subscribed: true };
      }
      nextToken = pageJson.meta?.next_token;
    }

    return { subscribed: false };
  } catch (err: any) {
    console.error("X subscription check error:", err);
    return { subscribed: false, error: err.message };
  }
}
