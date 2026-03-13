import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { drupalAuthHeaders } from "@/lib/drupal";
import {
  ConsoleContextProvider,
  ConsoleContextValue,
} from "@/components/ConsoleContext";
import ConsoleSidebar from "@/components/ConsoleSidebar";

const DRUPAL_API = process.env.DRUPAL_API_URL;

async function getUserStoreData(xUsername: string) {
  try {
    const profileRes = await fetch(
      `${DRUPAL_API}/jsonapi/node/creator_x_profile?filter[field_x_username]=${xUsername}&include=field_linked_store`,
      { headers: { ...drupalAuthHeaders() }, next: { revalidate: 0 } }
    );
    if (!profileRes.ok) return null;
    const profileData = await profileRes.json();
    if (!profileData.data || profileData.data.length === 0) return null;

    const profile = profileData.data[0];
    const included = profileData.included || [];

    const storeRef = profile.relationships?.field_linked_store?.data;
    const store = storeRef
      ? included.find((inc: any) => inc.id === storeRef.id)
      : null;

    return {
      profileNodeId: profile.id,
      storeName: store?.attributes?.name || profile.attributes?.title || null,
      storeSlug: store?.attributes?.field_store_slug || xUsername,
      storeId: store?.id || null,
      storeDrupalId: store
        ? String(store.attributes?.drupal_internal__store_id)
        : null,
      storeStatus: store?.attributes?.field_store_status || null,
      currentTheme: profile.attributes?.field_store_theme || "xai3",
      xSubscriptionTier: profile.attributes?.field_x_subscription_tier || null,
    };
  } catch {
    return null;
  }
}

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = ((session as any).role ||
    "creator") as ConsoleContextValue["role"];
  const xUsername =
    (session as any).xUsername || (session as any).storeSlug || null;

  const storeData = xUsername ? await getUserStoreData(xUsername) : null;

  const contextValue: ConsoleContextValue = {
    role,
    xUsername,
    hasStore: !!storeData?.storeId,
    storeId: storeData?.storeId || null,
    storeDrupalId: storeData?.storeDrupalId || null,
    profileNodeId: storeData?.profileNodeId || null,
    storeName: storeData?.storeName || null,
    storeSlug: storeData?.storeSlug || null,
    storeStatus: storeData?.storeStatus || null,
    currentTheme: storeData?.currentTheme || null,
    xSubscriptionTier: storeData?.xSubscriptionTier || null,
  };

  return (
    <ConsoleContextProvider value={contextValue}>
      <div className="flex min-h-screen bg-zinc-950 text-white">
        <ConsoleSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
        </main>
      </div>
    </ConsoleContextProvider>
  );
}
