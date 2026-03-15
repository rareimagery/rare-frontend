// ---------------------------------------------------------------------------
// X Subscription Check — raw fetch per x-api-integration.md
// ---------------------------------------------------------------------------

import { X_API_BASE } from "@/lib/x-api/client";
import { fetchWithRetry } from "@/lib/x-api/fetch-with-retry";

const RAREIMAGERY_X_USERNAME = "rareimagery";

/**
 * Check if a user follows @rareimagery on X.
 * Uses user-context OAuth 2.0 access token to read following list.
 */
export async function checkXSubscription(
  accessToken: string,
  userId: string
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
          user.username?.toLowerCase() === RAREIMAGERY_X_USERNAME.toLowerCase()
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
            user.username?.toLowerCase() === RAREIMAGERY_X_USERNAME.toLowerCase()
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
