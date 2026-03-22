"use client";

import { Suspense } from "react";
import BuilderStudio from "@/components/builder/BuilderStudio";

export default function BuilderNewTabPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 p-6 text-sm text-zinc-400">Loading custom builder...</div>}>
      <BuilderStudio />
    </Suspense>
  );
}
