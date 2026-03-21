import type { NextAuthOptions } from "next-auth";
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import TwitterProvider from "next-auth/providers/twitter";

import { drupalAuthHeaders, drupalWriteHeaders } from "@/lib/drupal";
import { syncXDataToDrupal, findProfileByUsername } from "@/lib/x-import";
import { checkRequiredPaidSubscription } from "@/lib/x-subscription";

const DRUPAL_API = process.env.DRUPAL_API_URL;
const X_OAUTH_CLIENT_ID =
  process.env.X_CLIENT_ID || process.env.X_CONSUMER_KEY || "";
const X_OAUTH_CLIENT_SECRET =
  process.env.X_CLIENT_SECRET || process.env.X_CONSUMER_SECRET || "";

type JsonApiIncludedEntity = {
  id?: string;
  attributes?: Record<string, unknown>;
};

type XProfile = {
  screen_name?: string;
  username?: string;
  id_str?: string;
  profile_image_url_https?: string;
  profile_banner_url?: string | null;
  verified?: boolean;
  description?: string;
  data?: {
    username?: string;
    id?: string;
    profile_image_url?: string;
    verified?: boolean;
    description?: string;
  };
};

type AuthUser = User & {
  role?: string;
  shopName?: string | null;
  storeSlug?: string | null;
};

type AppToken = JWT & {
  xUsername?: string | null;
  handle?: string | null;
  xId?: string | null;
  xImage?: string | null;
  xBannerUrl?: string | null;
  xVerified?: boolean;
  verified?: boolean;
  xBio?: string | null;
  bio?: string | null;
  xAccessToken?: string | null;
  xAccessTokenSecret?: string | null;
  role?: string | null;
  shopName?: string | null;
  storeSlug?: string | null;
};

type AppSession = Session & {
  xUsername?: string | null;
  handle?: string | null;
  xId?: string | null;
  xAccessToken?: string | null;
  xBannerUrl?: string | null;
  xBio?: string | null;
  bio?: string | null;
  xVerified?: boolean;
  verified?: boolean;
  role?: string | null;
  shopName?: string | null;
  storeSlug?: string | null;
};

if (!X_OAUTH_CLIENT_ID || !X_OAUTH_CLIENT_SECRET) {
  console.warn(
    "[auth] Missing X OAuth client credentials. Set X_CLIENT_ID/X_CLIENT_SECRET (or legacy X_CONSUMER_KEY/X_CONSUMER_SECRET)."
  );
}
if (X_OAUTH_CLIENT_ID && X_OAUTH_CLIENT_ID === X_OAUTH_CLIENT_SECRET) {
  console.error(
    "[auth] MISCONFIGURATION: X_CLIENT_ID and X_CLIENT_SECRET are identical. " +
    "Copy the OAuth 2.0 Client Secret (not the Client ID) from the X Developer Portal " +
    "and set it as X_CLIENT_SECRET. OAuth login will fail until this is corrected."
  );
}

async function findProfileByXUserId(xUserId: string): Promise<boolean> {
  if (!DRUPAL_API || !xUserId) return false;

  try {
    const res: Response = await fetch(
      `${DRUPAL_API}/jsonapi/node/creator_x_profile?filter[field_x_user_id]=${encodeURIComponent(xUserId)}&page[limit]=1`,
      { headers: { ...drupalAuthHeaders() } }
    );
    if (!res.ok) return false;
    const json = await res.json();
    return Array.isArray(json.data) && json.data.length > 0;
  } catch {
    return false;
  }
}

/** Authenticate a store owner against Drupal */
async function authenticateDrupalUser(
  email: string,
  password: string
): Promise<{
  id: string;
  name: string;
  email: string;
  shopName?: string;
  storeSlug?: string;
} | null> {
  try {
    const lookupRes = await fetch(
      `${DRUPAL_API}/jsonapi/user/user?filter[mail]=${encodeURIComponent(email)}&include=field_store`,
      {
        headers: { ...drupalAuthHeaders() },
      }
    );
    if (!lookupRes.ok) return null;

    const lookupData = await lookupRes.json();
    const users = lookupData?.data || [];
    if (users.length === 0) return null;

    const drupalUser = users[0];
    const username = drupalUser.attributes.name;

    const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
    const authRes = await fetch(
      `${DRUPAL_API}/jsonapi/user/user/${drupalUser.id}`,
      {
        headers: { Authorization: `Basic ${basicAuth}` },
      }
    );
    if (!authRes.ok) return null;

    const included: JsonApiIncludedEntity[] = lookupData?.included || [];
    const storeRef = drupalUser.relationships?.field_store?.data;
    const store = storeRef
      ? included.find((inc) => inc.id === storeRef.id)
      : null;
    const storeSlug = (store?.attributes?.["field_store_slug"] as string | undefined) || "";
    const shopName =
      drupalUser.attributes.field_shop_name || username;

    return {
      id: `drupal-${drupalUser.attributes.drupal_internal__uid}`,
      name: shopName,
      email: drupalUser.attributes.mail,
      shopName,
      storeSlug,
    };
  } catch (err) {
    console.error("Drupal auth error:", err);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: X_OAUTH_CLIENT_ID,
      clientSecret: X_OAUTH_CLIENT_SECRET,
      version: "2.0",
      authorization: {
        params: {
          scope: "tweet.read users.read follows.read offline.access",
        },
      },
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email === process.env.CONSOLE_ADMIN_EMAIL &&
          credentials?.password === process.env.CONSOLE_ADMIN_PASSWORD
        ) {
          const adminUser: AuthUser = {
            id: "1",
            name: "Admin",
            email: credentials!.email,
            role: "admin",
          };
          return adminUser;
        }

        if (credentials?.email && credentials?.password) {
          const drupalUser = await authenticateDrupalUser(
            credentials.email,
            credentials.password
          );
          if (drupalUser) {
            const storeOwnerUser: AuthUser = {
              id: drupalUser.id,
              name: drupalUser.name,
              email: drupalUser.email,
              role: "store_owner",
              shopName: drupalUser.shopName,
              storeSlug: drupalUser.storeSlug,
            };
            return storeOwnerUser;
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "twitter") {
        return true;
      }

      const xProfile = (profile || {}) as XProfile;

      const xUsername =
        xProfile.screen_name ??
        xProfile.username ??
        xProfile.data?.username ??
        "";
      const normalizedXUsername = xUsername.trim().replace(/^@+/, "").toLowerCase();

      if (!normalizedXUsername) {
        return "/signup?error=MissingXProfile";
      }

      const adminXUsernames = (process.env.ADMIN_X_USERNAMES || "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (adminXUsernames.includes(normalizedXUsername)) {
        return true;
      }

      const existingByUsername = await findProfileByUsername(normalizedXUsername);
      if (existingByUsername) {
        return true;
      }

      const xUserId = account.providerAccountId;
      if (!xUserId) {
        return "/signup?error=MissingXProfile";
      }

      const existingByXUserId = await findProfileByXUserId(xUserId);
      if (existingByXUserId) {
        return true;
      }

      const check = await checkRequiredPaidSubscription({
        buyerXId: xUserId,
        buyerUsername: normalizedXUsername,
      });
      if (!check.subscribed) {
        const infraFailure = /configured|failed|missing|drupal|api/i.test(check.error || "");
        if (infraFailure) {
          // Fail open when gate infrastructure is unavailable to avoid locking out real creators.
          return true;
        }
        return "/signup?error=PaidSubscriptionRequired";
      }

      return true;
    },
    async jwt({ token, account, profile, user }) {
      const appToken = token as AppToken;
      if (account?.provider === "twitter" && profile) {
        const xProfile = profile as XProfile;
        appToken.xUsername =
          xProfile.screen_name ??
          xProfile.data?.username ??
          "";
        appToken.handle = appToken.xUsername;
        appToken.xId =
          xProfile.id_str ??
          xProfile.data?.id ??
          account.providerAccountId;
        appToken.xImage =
          xProfile.profile_image_url_https ??
          xProfile.data?.profile_image_url ??
          (typeof appToken.picture === "string" ? appToken.picture : null);
        appToken.xBannerUrl =
          xProfile.profile_banner_url ?? null;
        appToken.xVerified =
          xProfile.verified ??
          xProfile.data?.verified ??
          false;
        appToken.verified = appToken.xVerified;
        appToken.xBio =
          xProfile.description ??
          xProfile.data?.description ??
          "";
        appToken.bio = appToken.xBio;
        const accessToken =
          typeof account.access_token === "string"
            ? account.access_token
            : typeof account.oauth_token === "string"
              ? account.oauth_token
              : null;
        const accessTokenSecret =
          typeof account.oauth_token_secret === "string"
            ? account.oauth_token_secret
            : null;
        appToken.xAccessToken = accessToken;
        appToken.xAccessTokenSecret = accessTokenSecret;

        const adminXUsernames = (process.env.ADMIN_X_USERNAMES || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
        const xUser = (appToken.xUsername || "").toLowerCase();
        appToken.role = adminXUsernames.includes(xUser) ? "admin" : "creator";

        // Auto-sync X profile data to Drupal
        if (account.access_token && appToken.xId && appToken.xUsername) {
          const xUser = appToken.xUsername;
          (async () => {
            // Auto-provision profile if it doesn't exist yet
            const existing = await findProfileByUsername(xUser);
            if (!existing) {
              try {
                const writeHeaders = await drupalWriteHeaders();
                await fetch(
                  `${DRUPAL_API}/jsonapi/node/creator_x_profile`,
                  {
                    method: "POST",
                    headers: {
                      ...writeHeaders,
                      "Content-Type": "application/vnd.api+json",
                    },
                    body: JSON.stringify({
                      data: {
                        type: "node--creator_x_profile",
                        attributes: {
                          title: `${xUser} X Profile`,
                          field_x_username: xUser,
                          field_store_theme: "xai3",
                        },
                      },
                    }),
                  }
                );
                console.log(`[auth] Auto-provisioned profile for @${xUser}`);
              } catch (err) {
                console.error(`[auth] Failed to auto-provision @${xUser}:`, err);
                return;
              }
            }
            await syncXDataToDrupal(
              account.access_token!,
              appToken.xId as string,
              xUser
            );
          })().catch((err) =>
            console.error(`[auth] X sync failed for @${appToken.xUsername}:`, err)
          );
        }
      }
      if (account?.provider === "credentials" && user) {
        const authUser = user as AuthUser;
        appToken.role = authUser.role || "admin";
        appToken.shopName = authUser.shopName || null;
        appToken.storeSlug = authUser.storeSlug || null;
        appToken.xUsername = authUser.storeSlug || null;
      }

      // Keep auth simple for X users: if X identity exists, default to creator role.
      if (appToken.xUsername && !appToken.role) {
        appToken.role = "creator";
      }

      return appToken;
    },
    async session({ session, token }) {
      const appSession = session as AppSession;
      const appToken = token as AppToken;
      appSession.xUsername = appToken.xUsername ?? null;
      appSession.handle = appToken.handle ?? appToken.xUsername ?? null;
      appSession.xId = appToken.xId ?? null;
      appSession.xAccessToken = appToken.xAccessToken ?? null;
      appSession.xBannerUrl = appToken.xBannerUrl ?? null;
      appSession.xBio = appToken.xBio ?? appToken.bio ?? null;
      appSession.bio = appToken.bio ?? appToken.xBio ?? null;
      appSession.xVerified = appToken.xVerified ?? appToken.verified ?? false;
      appSession.verified = appToken.verified ?? appToken.xVerified ?? false;
      appSession.role = appToken.role ?? "creator";
      appSession.shopName = appToken.shopName ?? null;
      appSession.storeSlug = appToken.storeSlug ?? null;
      if (session.user) {
        (session.user as typeof session.user & { handle?: string; bio?: string; verified?: boolean }).handle =
          appToken.handle ??
          appToken.xUsername ??
          undefined;
        (session.user as typeof session.user & { handle?: string; bio?: string; verified?: boolean }).bio =
          appToken.bio ??
          appToken.xBio ??
          undefined;
        (session.user as typeof session.user & { handle?: string; bio?: string; verified?: boolean }).verified =
          Boolean(appToken.verified ?? appToken.xVerified ?? false);
      }
      return appSession;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
};
