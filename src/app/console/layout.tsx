import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getConsoleProfile } from "@/lib/drupal";
import {
  ConsoleContextProvider,
  ConsoleContextValue,
} from "@/components/ConsoleContext";
import ConsoleSidebar from "@/components/ConsoleSidebar";

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

  const storeData = xUsername ? await getConsoleProfile(xUsername) : null;

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
