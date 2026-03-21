"use client";

import { Suspense } from "react";
import BuilderWorkspace from "@/components/builder/BuilderWorkspace";

export default function BuilderNewTabPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 p-6 text-sm text-zinc-400">Loading builder workspace...</div>}>
      <BuilderWorkspace />
    </Suspense>
  );
}
