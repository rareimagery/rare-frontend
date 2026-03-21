"use client";

import Link from "next/link";

export default function ThemePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Templates Replaced Themes</h1>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="font-medium text-white">Template-first builder is active</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Legacy theme selection is disabled. Use the builder to start from a blank canvas,
          apply clickable templates, and generate sections with AI.
        </p>
        <Link
          href="/console/builder"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Open Builder
        </Link>
      </div>
    </div>
  );
}
