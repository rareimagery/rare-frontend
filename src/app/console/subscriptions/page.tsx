"use client";

import { useConsole } from "@/components/ConsoleContext";
import SubscriptionTierManager from "@/components/SubscriptionTierManager";

export default function SubscriptionsPage() {
  const { hasStore, storeId } = useConsole();

  if (!hasStore || !storeId) {
    return (
      <div className="py-12 text-center text-zinc-500">
        Create a store first to set up subscriptions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscriptions</h1>
      <SubscriptionTierManager storeId={storeId} />
    </div>
  );
}
