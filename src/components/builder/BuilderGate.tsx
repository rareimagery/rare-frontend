"use client";

import { useSession } from "next-auth/react";
import FloatingBuilder from "./FloatingBuilder";

interface BuilderGateProps {
  storeSlug: string;
  theme?: string;
}

export default function BuilderGate({ storeSlug, theme }: BuilderGateProps) {
  const { data: session } = useSession();
  if (!session) return null;

  const role = (session as any).role;
  const userSlug =
    (session as any).storeSlug || (session as any).xUsername || null;

  // Only show to the store owner viewing their own store, or admins
  const isOwner =
    role === "admin" ||
    ((role === "store_owner" || role === "creator") && userSlug === storeSlug);

  if (!isOwner) return null;

  return <FloatingBuilder theme={theme} />;
}
