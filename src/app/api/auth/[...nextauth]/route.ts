import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import TwitterProvider from "next-auth/providers/twitter";

import { drupalAuthHeaders } from "@/lib/drupal";
import { syncXDataToDrupal } from "@/lib/x-import";

const DRUPAL_API = process.env.DRUPAL_API_URL;

// Store last auth error for debugging
let lastAuthError: string | null = null;

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
    // Look up user by email via JSON:API
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

    // Verify password via Drupal Basic Auth — try to access the user's
    // own JSON:API resource using their credentials.
    const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
    const authRes = await fetch(
      `${DRUPAL_API}/jsonapi/user/user/${drupalUser.id}`,
      {
        headers: { Authorization: `Basic ${basicAuth}` },
      }
    );
    if (!authRes.ok) return null;

    // Get store slug from included store entity
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

const handler = NextAuth({
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
        // 1. Check platform admin credentials
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

        // 2. Try Drupal store owner login
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
  debug: true,
  logger: {
    error(code, metadata) {
      const msg = `[AUTH ERROR] ${code}: ${JSON.stringify(metadata)}`;
      console.error(msg);
      lastAuthError = msg;
    },
    warn(code) {
      console.warn("[AUTH WARN]", code);
    },
    debug(code, metadata) {
      console.log("[AUTH DEBUG]", code, JSON.stringify(metadata));
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      console.log("=== SIGNIN CALLBACK ===");
      console.log("Provider:", account?.provider);
      console.log("Account:", JSON.stringify(account, null, 2));
      console.log("Profile:", JSON.stringify(profile, null, 2));
      return true;
    },
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "twitter" && profile) {
        // OAuth 1.0a returns screen_name, id_str, profile_image_url_https
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

        // Grant admin role if this X account matches the admin username
        const adminXUsernames = (process.env.ADMIN_X_USERNAMES || "").toLowerCase().split(",").map(s => s.trim()).filter(Boolean);
        const xUser = (token.xUsername as string || "").toLowerCase();
        token.role = adminXUsernames.includes(xUser) ? "admin" : "creator";
      }
      if (account?.provider === "credentials" && user) {
        token.role = (user as any).role || "admin";
        token.shopName = (user as any).shopName || null;
        token.storeSlug = (user as any).storeSlug || null;
        // Set xUsername to storeSlug so the store page link works
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
});

export { handler as GET, handler as POST };

// Debug endpoint - GET /api/auth/error-log
export async function OPTIONS() {
  return new Response(JSON.stringify({ lastAuthError }), {
    headers: { "Content-Type": "application/json" },
  });
}
