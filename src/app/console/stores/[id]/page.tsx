import Link from "next/link";
import ThemeSelector from "@/components/ThemeSelector";
import ProductManager from "@/components/ProductManager";
import PrintfulManager from "@/components/PrintfulManager";
import StoreApprovalButton from "@/components/StoreApprovalButton";
import NotificationPreferences from "@/components/NotificationPreferences";

import { drupalAuthHeaders } from "@/lib/drupal";

const DRUPAL_API = process.env.DRUPAL_API_URL;

async function getStore(id: string) {
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/commerce_store/online/${id}`,
    {
      headers: { ...drupalAuthHeaders() },
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return null;
  return res.json();
}

async function getProfileByStore(storeId: string) {
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/node/creator_x_profile?filter[field_linked_store.id]=${storeId}`,
    {
      headers: { ...drupalAuthHeaders() },
      next: { revalidate: 0 },
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.[0] ?? null;
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, xProfile] = await Promise.all([
    getStore(id),
    getProfileByStore(id),
  ]);
  const store = data?.data;
  if (!store) return <div className="text-zinc-500">Store not found</div>;

  const slug = store.attributes.field_store_slug;
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{store.attributes.name}</h1>
          <StoreApprovalButton
            storeId={store.id}
            currentStatus={store.attributes.field_store_status || "pending"}
          />
        </div>
        <a
          href={`https://${slug}.${base}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Open Live Store
        </a>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">
            Store Details
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Slug</dt>
              <dd className="text-white">{slug}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">URL</dt>
              <dd>
                <a
                  href={`https://${slug}.${base}`}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  {slug}.{base}
                </a>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Email</dt>
              <dd className="text-white">{store.attributes.mail}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Currency</dt>
              <dd className="text-white">
                {store.attributes.default_currency}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="mb-4 text-lg font-semibold text-zinc-300">
            X Profile
          </h2>
          {xProfile ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Username</dt>
                <dd className="text-white">
                  {xProfile.attributes.field_x_username}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Followers</dt>
                <dd className="text-white">
                  {xProfile.attributes.field_follower_count?.toLocaleString() ??
                    "\u2014"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-zinc-500">Not linked</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-300">
          Store Theme
        </h2>
        <ThemeSelector
          profileNodeId={xProfile?.id ?? ""}
          currentTheme={
            xProfile?.attributes?.field_store_theme ?? "default"
          }
        />
        {xProfile?.attributes?.field_store_theme === "myspace" && (
          <div className="mt-4">
            <Link
              href={`/console/stores/${id}/theme`}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500"
            >
              🎨 Customize MySpace Theme
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <ProductManager
          storeId={store.id}
          storeDrupalId={String(store.attributes.drupal_internal__store_id)}
        />
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <NotificationPreferences />
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
        <PrintfulManager
          storeId={store.id}
          storeDrupalId={String(store.attributes.drupal_internal__store_id)}
        />
      </section>

      <div className="flex items-center gap-4">
        <Link
          href="/console/stores"
          className="inline-block text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          &larr; Back to all stores
        </Link>
      </div>
    </div>
  );
}
