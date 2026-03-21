"use client";

import { useSession } from "next-auth/react";
import FloatingBuilder from "./FloatingBuilder";

interface BuilderGateProps {
  storeSlug: string;
  theme?: string;
}

type BuilderSession = {
  role?: "admin" | "store_owner" | "creator" | string;
  storeSlug?: string;
  xUsername?: string;
};

export default function BuilderGate({ storeSlug, theme }: BuilderGateProps) {
  const { data: session } = useSession();
  if (!session) return null;

  const builderSession = session as BuilderSession;

  const role = builderSession.role;
  const userSlug =
    builderSession.storeSlug || builderSession.xUsername || null;

  // Only show to the store owner viewing their own store, or admins
  const isOwner =
    role === "admin" ||
    ((role === "store_owner" || role === "creator") && userSlug === storeSlug);

  if (!isOwner) return null;

  return <FloatingBuilder theme={theme} />;
}
