import Image from "next/image";
import Link from "next/link";
import { getAllCreatorProfiles, CreatorProfile } from "@/lib/drupal";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function CreatorCard({ creator }: { creator: CreatorProfile }) {
  return (
    <Link
      href={`/stores/${creator.x_username}`}
      className="group block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-indigo-500/60 hover:bg-zinc-900"
    >
      <div className="flex items-center gap-4">
        {creator.profile_picture_url ? (
          <Image
            src={creator.profile_picture_url}
            alt={creator.x_username}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-zinc-700 group-hover:ring-indigo-500/60"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-xl font-bold text-white">
            {creator.x_username.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-white group-hover:text-indigo-400">
            @{creator.x_username}
          </h3>
          <p className="text-sm text-zinc-400">
            {formatCount(creator.follower_count)} followers
          </p>
        </div>
      </div>

      {creator.bio && (
        <p
          className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400"
          dangerouslySetInnerHTML={{ __html: creator.bio }}
        />
      )}
    </Link>
  );
}

export default async function LandingPage() {
  let creators: Awaited<ReturnType<typeof getAllCreatorProfiles>> = [];
  try {
    creators = await getAllCreatorProfiles();
  } catch {
    // Drupal unreachable at build time — render empty grid
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-zinc-950 to-zinc-950" />
        <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              RareImagery
            </span>{" "}
            X Marketplace
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
            Discover creator-driven stores powered by X profiles, Grok AI
            analytics, and seamless commerce. Each creator gets their own
            branded storefront on their subdomain.
          </p>
          <Link
            href="/console/stores/new"
            className="mt-8 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40"
          >
            Create Your Store
          </Link>
        </div>
      </section>

      {/* Creator Grid */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-10 text-2xl font-bold text-white">
          Featured Creators
        </h2>

        {creators.length === 0 ? (
          <p className="text-zinc-500">
            No creators found. Check back soon!
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-600">
        &copy; {new Date().getFullYear()} RareImagery. All rights reserved.
      </footer>
    </div>
  );
}
