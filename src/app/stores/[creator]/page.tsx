import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCreatorProfile,
  getAllCreatorProfiles,
  getProductsByStoreSlug,
  TopPost,
  TopFollower,
  Metrics,
  Product,
} from "@/lib/drupal";
import MySpaceTheme from "@/components/themes/MySpaceTheme";
import MinimalTheme from "@/components/themes/MinimalTheme";
import NeonTheme from "@/components/themes/NeonTheme";
import EditorialTheme from "@/components/themes/EditorialTheme";

export async function generateStaticParams() {
  try {
    const profiles = await getAllCreatorProfiles();
    return profiles.map((p) => ({ creator: p.x_username }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ creator: string }>;
}) {
  const { creator } = await params;
  const profile = await getCreatorProfile(creator);
  if (!profile) return { title: "Creator Not Found" };
  return {
    title: `@${profile.x_username} Store | RareImagery X Marketplace`,
    description: profile.bio?.replace(/<[^>]*>/g, "").slice(0, 160),
  };
}

function initial(s: string): string {
  return s.charAt(0).toUpperCase();
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10">
      {product.image_url ? (
        <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-zinc-800">
          <Image src={product.image_url} alt={product.title} fill className="object-cover transition group-hover:scale-105" />
        </div>
      ) : (
        <div className="mb-3 flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-indigo-900/40 to-purple-900/40 text-4xl">
          🛍️
        </div>
      )}
      <h3 className="line-clamp-2 text-sm font-semibold text-white">{product.title}</h3>
      {product.description && (
        <p
          className="mt-1 line-clamp-2 text-xs text-zinc-400"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-lg font-bold text-indigo-400">
          ${parseFloat(product.price).toFixed(2)}
        </span>
        <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500">
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: TopPost }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-zinc-700">
      {post.image_url && (
        <div className="relative mb-3 aspect-video overflow-hidden rounded-lg">
          <Image src={post.image_url} alt="" fill className="object-cover" />
        </div>
      )}
      <p className="line-clamp-3 text-sm leading-relaxed text-zinc-300">
        {post.text}
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
        <span>{formatCount(post.likes)} likes</span>
        <span>{formatCount(post.retweets)} RTs</span>
        <span>{formatCount(post.replies)} replies</span>
        <span>{formatCount(post.views)} views</span>
      </div>
      {post.date && <p className="mt-2 text-xs text-zinc-600">{post.date}</p>}
    </div>
  );
}

function FollowerCard({ follower }: { follower: TopFollower }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
      {follower.profile_image_url ? (
        <Image
          src={follower.profile_image_url}
          alt={follower.username}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-white">
          {initial(follower.username)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {follower.display_name}
          {follower.verified && (
            <span className="ml-1 text-indigo-400" title="Verified">
              &#10003;
            </span>
          )}
        </p>
        <p className="text-xs text-zinc-500">
          @{follower.username} &middot; {formatCount(follower.follower_count)}{" "}
          followers
        </p>
      </div>
    </div>
  );
}

function MetricsPanel({ metrics }: { metrics: Metrics }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="mb-5 text-xl font-bold text-white">Grok AI Analytics</h2>

      <div className="mb-6 flex items-center gap-6">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-indigo-500">
          <span className="text-2xl font-extrabold text-white">
            {metrics.engagement_score}
          </span>
        </div>
        <div className="space-y-1 text-sm text-zinc-400">
          <p>Avg Likes: {formatCount(metrics.avg_likes)}</p>
          <p>Avg Retweets: {formatCount(metrics.avg_retweets)}</p>
          <p>Avg Views: {formatCount(metrics.avg_views)}</p>
          <p>Posting: {metrics.posting_frequency}</p>
          <p>Sentiment: {metrics.audience_sentiment}</p>
        </div>
      </div>

      {metrics.top_themes.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Top Themes
          </h3>
          <div className="flex flex-wrap gap-2">
            {metrics.top_themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {metrics.recommended_products.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Recommended Products
          </h3>
          <div className="flex flex-wrap gap-2">
            {metrics.recommended_products.map((prod) => (
              <span
                key={prod}
                className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300"
              >
                {prod}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function CreatorStorePage({
  params,
}: {
  params: Promise<{ creator: string }>;
}) {
  const { creator } = await params;
  const [profile, products] = await Promise.all([
    getCreatorProfile(creator),
    getProductsByStoreSlug(creator),
  ]);

  if (!profile) {
    notFound();
  }

  if (profile.store_theme === "myspace") {
    return (
      <MySpaceTheme
        profile={profile}
        products={products}
        backgroundUrl={profile.myspace_background ?? undefined}
        musicUrl={profile.myspace_music_url ?? undefined}
        glitterColor={profile.myspace_glitter_color ?? undefined}
        accentColor={profile.myspace_accent_color ?? undefined}
        themeConfig={profile.store_theme_config ?? undefined}
      />
    );
  }

  if (profile.store_theme === "minimal") {
    return <MinimalTheme profile={profile} products={products} />;
  }

  if (profile.store_theme === "neon") {
    return <NeonTheme profile={profile} products={products} />;
  }

  if (profile.store_theme === "editorial") {
    return <EditorialTheme profile={profile} products={products} />;
  }

  const DRUPAL_URL = process.env.DRUPAL_API_URL || "http://72.62.80.155";

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="relative h-56 w-full sm:h-72 lg:h-80">
        {profile.banner_url ? (
          <Image
            src={profile.banner_url}
            alt="Banner"
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6">
        <div className="-mt-16 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
          {profile.profile_picture_url ? (
            <Image
              src={profile.profile_picture_url}
              alt={profile.x_username}
              width={128}
              height={128}
              priority
              className="h-32 w-32 rounded-full border-4 border-zinc-950 object-cover ring-4 ring-indigo-500/40"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-zinc-950 bg-gradient-to-br from-indigo-600 to-purple-600 text-4xl font-bold ring-4 ring-indigo-500/40">
              {initial(profile.x_username)}
            </div>
          )}

          <div className="pb-1">
            <h1 className="text-3xl font-extrabold">@{profile.x_username}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {formatCount(profile.follower_count)} followers
            </p>
          </div>
        </div>

        {profile.bio && (
          <div
            className="mt-6 max-w-2xl leading-relaxed text-zinc-300"
            dangerouslySetInnerHTML={{ __html: profile.bio }}
          />
        )}

        {profile.linked_store_id && (
          <div className="mt-6">
            <a
              href={`${DRUPAL_URL}${profile.linked_store_path || "/store"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Visit Store
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-5xl space-y-14 px-6 py-14">
        {products.length > 0 && (
          <section>
            <h2 className="mb-6 text-xl font-bold">Shop</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {profile.top_posts.length > 0 && (
          <section>
            <h2 className="mb-6 text-xl font-bold">Top Posts</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {profile.top_posts.slice(0, 8).map((post, i) => (
                <PostCard key={post.id || i} post={post} />
              ))}
            </div>
          </section>
        )}

        {profile.top_followers.length > 0 && (
          <section>
            <h2 className="mb-6 text-xl font-bold">Top Followers</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {profile.top_followers.slice(0, 8).map((f, i) => (
                <FollowerCard key={f.username || i} follower={f} />
              ))}
            </div>
          </section>
        )}

        {profile.metrics && <MetricsPanel metrics={profile.metrics} />}
      </div>

      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-600">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300">
          &larr; Back to RareImagery X Marketplace
        </Link>
      </footer>
    </div>
  );
}
