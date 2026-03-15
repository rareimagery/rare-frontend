"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/console");
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8">
      <div className="text-center">
        <Link href="/">
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
            RareImagery
          </span>
        </Link>
        <p className="mt-2 text-sm text-zinc-500">
          Sign in to manage your store
        </p>
      </div>

      {oauthError && (
        <div className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-300">
          <p className="font-semibold">X Login Error: {oauthError}</p>
          <div className="mt-1 space-y-1 text-xs text-red-400">
            <p>
              Check X Developer Portal: Callback URL must be exactly
              https://rareimagery.net/api/auth/callback/twitter
            </p>
            <p>
              This build uses X OAuth 2.0. `X_CLIENT_ID` and `X_CLIENT_SECRET`
              must be the OAuth 2.0 client credentials, not the older consumer
              key and secret.
            </p>
            <p>
              `NEXTAUTH_URL` must be set to https://rareimagery.net in the live
              environment.
            </p>
          </div>
        </div>
      )}

      {/* Admin login form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rare@rareimagery.net"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-400">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <p className="text-center text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs text-zinc-600">or</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      {/* Sign in with X */}
      <button
        onClick={() => signIn("twitter", { callbackUrl: "/console" })}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/50 py-2.5 font-semibold text-white transition hover:border-zinc-600 hover:bg-zinc-800"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Sign in with X
      </button>
      <p className="text-center text-xs text-zinc-600">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300">
          &larr; Back to marketplace
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
