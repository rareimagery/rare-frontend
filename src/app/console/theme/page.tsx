"use client";

import { useConsole } from "@/components/ConsoleContext";
import ThemeSelector from "@/components/ThemeSelector";
import Link from "next/link";

export default function ThemePage() {
  const { hasStore, profileNodeId, currentTheme, storeId } = useConsole();

  if (!hasStore || !profileNodeId) {
    return (
      <div className="py-12 text-center text-zinc-500">
        Create a store first to customize your theme.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Store Theme</h1>
      <ThemeSelector
        profileNodeId={profileNodeId}
        currentTheme={currentTheme || "xai3"}
      />
      {(currentTheme === "myspace" || currentTheme === "default") && storeId && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h3 className="font-medium text-white">MySpace Theme Customization</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Customize colors, fonts, music, and glitter effects.
          </p>
          <Link
            href={`/console/stores/${storeId}/theme`}
            className="mt-4 inline-block rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-500"
          >
            Open MySpace Editor
          </Link>
        </div>
      )}
    </div>
  );
}
