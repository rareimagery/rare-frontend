"use client";

import { signOut, useSession } from "next-auth/react";

export default function ConsoleUserMenu() {
  const { data: session } = useSession();

  return (
    <div className="ml-auto flex items-center gap-4">
      <span className="text-sm text-zinc-400">
        {session?.user?.name ?? session?.user?.email ?? "User"}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
      >
        Sign Out
      </button>
    </div>
  );
}
