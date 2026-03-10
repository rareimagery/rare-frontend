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
import StoreNav from "@/components/StoreNav";

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
      <>
        <StoreNav creator={creator} />
        <div className="pt-12">
          <MySpaceTheme
            profile={profile}
            products={products}
            backgroundUrl={profile.myspace_background ?? undefined}
            musicUrl={profile.myspace_music_url ?? undefined}
            glitterColor={profile.myspace_glitter_color ?? undefined}
            accentColor={profile.myspace_accent_color ?? undefined}
            themeConfig={profile.store_theme_config ?? undefined}
          />
        </div>
      </>
    );
  }

  if (profile.store_theme === "minimal") {
    return (
      <>
        <StoreNav creator={creator} />
        <div className="pt-12">
          <MinimalTheme profile={profile} products={products} />
        </div>
      </>
    );
  }

  if (profile.store_theme === "neon") {
    return (
      <>
        <StoreNav creator={creator} />
        <div className="pt-12">
          <NeonTheme profile={profile} products={products} />
        </div>
      </>
    );
  }

  if (profile.store_theme === "editorial") {
    return (
      <>
        <StoreNav creator={creator} />
        <div className="pt-12">
          <EditorialTheme profile={profile} products={products} />
        </div>
      </>
    );
  }

  // Default theme — modern shopping cart storefront
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <StoreNav creator={creator} />

      {/* Hero */}
      <header className="relative mt-12 overflow-hidden bg-zinc-950">
        {profile.banner_url ? (
          <Image
            src={profile.banner_url}
            alt="Banner"
            fill
            priority
            className="object-cover opacity-40"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
        )}
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-5 px-6 py-16 text-center sm:py-20">
          {profile.profile_picture_url ? (
            <Image
              src={profile.profile_picture_url}
              alt={profile.x_username}
              width={96}
              height={96}
              priority
              className="h-24 w-24 rounded-full border-4 border-white/20 object-cover shadow-2xl"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-3xl font-bold text-white shadow-2xl backdrop-blur">
              {initial(profile.x_username)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              @{profile.x_username}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {formatCount(profile.follower_count)} followers
            </p>
          </div>
          {profile.bio && (
            <div
              className="max-w-xl text-sm leading-relaxed text-white/80"
              dangerouslySetInnerHTML={{ __html: profile.bio }}
            />
          )}
          {products.length > 0 && (
            <a
              href="#shop"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-zinc-900 shadow-lg transition hover:bg-zinc-100"
            >
              Shop Now &darr;
            </a>
          )}
        </div>
      </header>

      {/* Products Grid */}
      {products.length > 0 && (
        <section id="shop" className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Products</h2>
            <span className="text-sm text-zinc-500">
              {products.length} item{products.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const productSlug = product.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
              return (
                <Link
                  key={product.id}
                  href={`/products/${productSlug}`}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
                >
                  {product.image_url ? (
                    <div className="relative aspect-square overflow-hidden bg-zinc-100">
                      <Image
                        src={product.image_url}
                        alt={product.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100">
                      <svg
                        className="h-12 w-12 text-zinc-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-sm font-semibold text-zinc-900">
                      {product.title}
                    </h3>
                    {product.description && (
                      <p
                        className="mt-1 line-clamp-2 text-xs text-zinc-500"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-lg font-bold text-zinc-900">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                      <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition group-hover:bg-zinc-700">
                        View Product
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Social Proof Section */}
      {(profile.top_posts.length > 0 ||
        profile.top_followers.length > 0 ||
        profile.metrics) && (
        <div className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto max-w-6xl space-y-14 px-6 py-16">
            {profile.top_posts.length > 0 && (
              <section>
                <h2 className="mb-6 text-xl font-bold text-zinc-900">
                  Latest from X
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {profile.top_posts.slice(0, 8).map((post, i) => (
                    <div
                      key={post.id || i}
                      className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      {post.image_url && (
                        <div className="relative mb-3 aspect-video overflow-hidden rounded-lg">
                          <Image
                            src={post.image_url}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <p className="line-clamp-3 text-sm leading-relaxed text-zinc-700">
                        {post.text}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                        <span>{formatCount(post.likes)} likes</span>
                        <span>{formatCount(post.retweets)} RTs</span>
                        <span>{formatCount(post.views)} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profile.top_followers.length > 0 && (
              <section>
                <h2 className="mb-6 text-xl font-bold text-zinc-900">
                  Top Followers
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {profile.top_followers.slice(0, 8).map((f, i) => (
                    <div
                      key={f.username || i}
                      className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
                    >
                      {f.profile_image_url ? (
                        <Image
                          src={f.profile_image_url}
                          alt={f.username}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
                          {initial(f.username)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {f.display_name}
                          {f.verified && (
                            <span className="ml-1 text-blue-500">&#10003;</span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500">
                          @{f.username} &middot;{" "}
                          {formatCount(f.follower_count)} followers
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {profile.metrics && (
              <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-xl font-bold text-zinc-900">
                  Creator Analytics
                </h2>
                <div className="mb-6 flex items-center gap-6">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-indigo-500">
                    <span className="text-2xl font-extrabold text-zinc-900">
                      {profile.metrics.engagement_score}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-zinc-600">
                    <p>
                      Avg Likes: {formatCount(profile.metrics.avg_likes)}
                    </p>
                    <p>
                      Avg Retweets:{" "}
                      {formatCount(profile.metrics.avg_retweets)}
                    </p>
                    <p>
                      Avg Views: {formatCount(profile.metrics.avg_views)}
                    </p>
                    <p>Posting: {profile.metrics.posting_frequency}</p>
                  </div>
                </div>
                {profile.metrics.top_themes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.metrics.top_themes.map((theme) => (
                      <span
                        key={theme}
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-10 text-center">
        <p className="text-xs text-zinc-400">
          Powered by{" "}
          <Link
            href="/"
            className="font-medium text-zinc-600 hover:text-zinc-900"
          >
            RareImagery
          </Link>
        </p>
      </footer>
    </div>
  );
}
