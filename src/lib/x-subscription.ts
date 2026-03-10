const RAREIMAGERY_X_USERNAME = "rareimagery";

/**
 * Check if a user is subscribed to @rareimagery on X.
 *
 * X API v2 does not expose a direct "is user subscribed to creator" endpoint
 * for third-party apps. Instead we check if the authenticated user follows
 * @rareimagery AND is in our verified-subscribers list (stored in Drupal).
 *
 * For the MVP, we treat "follows @rareimagery" as the subscription proxy.
 * When X Subscriptions API becomes available to third-party apps, swap this
 * check for the real subscription verification.
 */
export async function checkXSubscription(
  accessToken: string,
  userId: string
): Promise<{ subscribed: boolean; error?: string }> {
  try {
    // Check if user follows @rareimagery
    const res = await fetch(
      `https://api.twitter.com/2/users/${userId}/following?user.fields=username&max_results=1000`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (res.status === 401) {
      return { subscribed: false, error: "X token expired — please sign in again" };
    }

    if (!res.ok) {
      console.error("X API error:", res.status, await res.text());
      return { subscribed: false, error: "Could not verify X subscription" };
    }

    const json = await res.json();
    const following = json.data ?? [];

    const followsRareImagery = following.some(
      (user: any) =>
        user.username?.toLowerCase() === RAREIMAGERY_X_USERNAME.toLowerCase()
    );

    if (followsRareImagery) {
      return { subscribed: true };
    }

    // Paginate if needed — user may follow many accounts
    let nextToken = json.meta?.next_token;
    while (nextToken) {
      const pageRes = await fetch(
        `https://api.twitter.com/2/users/${userId}/following?user.fields=username&max_results=1000&pagination_token=${nextToken}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!pageRes.ok) break;
      const pageJson = await pageRes.json();
      const pageData = pageJson.data ?? [];
      if (
        pageData.some(
          (user: any) =>
            user.username?.toLowerCase() ===
            RAREIMAGERY_X_USERNAME.toLowerCase()
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
