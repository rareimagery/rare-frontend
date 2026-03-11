import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { drupalAuthHeaders } from "@/lib/drupal";
const DRUPAL_API = process.env.DRUPAL_API_URL;

async function getStoreBySlug(slug: string) {
  try {
    const res = await fetch(
      `${DRUPAL_API}/jsonapi/commerce_store/online?filter[field_store_slug]=${slug}&include=field_linked_x_profile`,
      {
        headers: { ...drupalAuthHeaders() },
        next: { revalidate: 0 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data || data.data.length === 0) return null;
    return { store: data.data[0], included: data.included || [] };
  } catch {
    return null;
  }
}

export default async function ConsolePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const role = (session as any).role;
  const storeSlug = (session as any).storeSlug;

  // Admin goes to store list
  if (role === "admin") {
    redirect("/console/stores");
  }

  // Store owner with existing store — redirect to their store management
  if (role === "store_owner" && storeSlug) {
    const storeData = await getStoreBySlug(storeSlug);
    if (storeData?.store) {
      redirect(`/console/stores/${storeData.store.id}`);
    }
  }

  // Creator / new store owner — redirect to build page
  redirect("/build");
}
