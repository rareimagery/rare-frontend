import { redirect } from "next/navigation";
import Link from "next/link";
import StoreApprovalButton from "@/components/StoreApprovalButton";
import { drupalAuthHeaders } from "@/lib/drupal";

const DRUPAL_API = process.env.DRUPAL_API_URL;

async function getAllStores() {
  const res = await fetch(
    `${DRUPAL_API}/jsonapi/commerce_store/online` +
      `?sort=-created&include=field_linked_x_profile`,
    {
      headers: { ...drupalAuthHeaders() },
      next: { revalidate: 30 },
    }
  );
  if (!res.ok) return { data: [] };
  return res.json();
}

export default async function StoresDashboard() {
  redirect("/console/admin");
  const data = await getAllStores();
  const stores = data?.data || [];
  const included = data?.included || [];
  const base = process.env.NEXT_PUBLIC_BASE_DOMAIN;

  const pendingCount = stores.filter(
    (s: any) => s.attributes.field_store_status !== "approved"
  ).length;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Creator Stores ({stores.length})
          </h1>
          {pendingCount > 0 && (
            <p className="mt-1 text-sm text-amber-400">
              {pendingCount} store{pendingCount !== 1 ? "s" : ""} pending
              approval
            </p>
          )}
        </div>
        <Link
          href="/console/stores/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          + Create New Store
        </Link>
      </div>

      {stores.length === 0 ? (
        <p className="text-zinc-500">No stores yet. Create your first one.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/60">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-400">Store Name</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Slug</th>
                <th className="px-4 py-3 font-medium text-zinc-400">X Username</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Created</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {stores.map((store: any) => {
                const slug = store.attributes.field_store_slug;
                const storeStatus =
                  store.attributes.field_store_status || "pending";
                const xProfileRef =
                  store.relationships?.field_linked_x_profile?.data;
                const xProfile = xProfileRef
                  ? included.find((inc: any) => inc.id === xProfileRef.id)
                  : null;

                return (
                  <tr key={store.id} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3 font-medium text-white">
                      {store.attributes.name}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://${slug}.${base}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {slug}.{base}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {xProfile?.attributes?.field_x_username || "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(store.attributes.created).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <StoreApprovalButton
                        storeId={store.id}
                        currentStatus={storeStatus}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/console/stores/${store.id}`}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
