import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import TwitterProvider from "next-auth/providers/twitter";

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
        if (
          credentials?.email === process.env.CONSOLE_ADMIN_EMAIL &&
          credentials?.password === process.env.CONSOLE_ADMIN_PASSWORD
        ) {
          return { id: "1", name: "Admin", email: credentials!.email };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "twitter" && profile) {
        token.xUsername = (profile as any).data?.username ?? (profile as any).screen_name ?? "";
        token.xId = (profile as any).data?.id ?? account.providerAccountId;
        token.xImage = (profile as any).data?.profile_image_url ?? token.picture;
        token.xAccessToken = account.access_token;
        token.role = "creator";
      }
      if (account?.provider === "credentials") {
        token.role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).xUsername = token.xUsername ?? null;
      (session as any).xId = token.xId ?? null;
      (session as any).xAccessToken = token.xAccessToken ?? null;
      (session as any).role = token.role ?? "creator";
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
