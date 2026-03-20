import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getConsoleProfile, getConsoleProfileByEmail } from "@/lib/drupal";
import {
  ConsoleContextProvider,
  ConsoleContextValue,
} from "@/components/ConsoleContext";
import ConsoleShell from "@/components/ConsoleShell";

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

  let storeData = xUsername ? await getConsoleProfile(xUsername) : null;
  if (!storeData && session.user?.email) {
    storeData = await getConsoleProfileByEmail(session.user.email);
  }

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
      <ConsoleShell>{children}</ConsoleShell>
    </ConsoleContextProvider>
  );
}
