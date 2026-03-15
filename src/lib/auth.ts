import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import TwitterProvider from "next-auth/providers/twitter";

import { drupalAuthHeaders, drupalWriteHeaders } from "@/lib/drupal";
import { syncXDataToDrupal, findProfileByUsername } from "@/lib/x-import";

const DRUPAL_API = process.env.DRUPAL_API_URL;

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

    const included = lookupData?.included || [];
    const storeRef = drupalUser.relationships?.field_store?.data;
    const store = storeRef
      ? included.find((inc: any) => inc.id === storeRef.id)
      : null;
    const storeSlug = store?.attributes?.field_store_slug || "";
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
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      version: "2.0",
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
          return {
            id: "1",
            name: "Admin",
            email: credentials!.email,
            role: "admin",
          } as any;
        }

        if (credentials?.email && credentials?.password) {
          const drupalUser = await authenticateDrupalUser(
            credentials.email,
            credentials.password
          );
          if (drupalUser) {
            return {
              id: drupalUser.id,
              name: drupalUser.name,
              email: drupalUser.email,
              role: "store_owner",
              shopName: drupalUser.shopName,
              storeSlug: drupalUser.storeSlug,
            } as any;
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "twitter" && profile) {
        token.xUsername =
          (profile as any).screen_name ??
          (profile as any).data?.username ??
          "";
        token.xId =
          (profile as any).id_str ??
          (profile as any).data?.id ??
          account.providerAccountId;
        token.xImage =
          (profile as any).profile_image_url_https ??
          (profile as any).data?.profile_image_url ??
          token.picture;
        token.xBannerUrl =
          (profile as any).profile_banner_url ?? null;
        token.xAccessToken = account.access_token ?? account.oauth_token ?? null;
        token.xAccessTokenSecret = account.oauth_token_secret ?? null;

        const adminXUsernames = (process.env.ADMIN_X_USERNAMES || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
        const xUser = (token.xUsername as string || "").toLowerCase();
        token.role = adminXUsernames.includes(xUser) ? "admin" : "creator";

        // Auto-sync X profile data to Drupal
        if (account.access_token && token.xId && token.xUsername) {
          const xUser = token.xUsername as string;
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
              token.xId as string,
              xUser
            );
          })().catch((err) =>
            console.error(`[auth] X sync failed for @${token.xUsername}:`, err)
          );
        }
      }
      if (account?.provider === "credentials" && user) {
        token.role = (user as any).role || "admin";
        token.shopName = (user as any).shopName || null;
        token.storeSlug = (user as any).storeSlug || null;
        token.xUsername = (user as any).storeSlug || null;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).xUsername = token.xUsername ?? null;
      (session as any).xId = token.xId ?? null;
      (session as any).xAccessToken = token.xAccessToken ?? null;
      (session as any).xBannerUrl = token.xBannerUrl ?? null;
      (session as any).role = token.role ?? "creator";
      (session as any).shopName = token.shopName ?? null;
      (session as any).storeSlug = token.storeSlug ?? null;
      return session;
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
