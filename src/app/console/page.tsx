"use client";

import Link from "next/link";
import { useConsole } from "@/components/ConsoleContext";

export default function ConsoleDashboard() {
  const {
    role,
    hasStore,
    storeName,
    storeSlug,
    storeStatus,
    currentTheme,
    xUsername,
  } = useConsole();

  const isAdmin = role === "admin";

  if (!hasStore) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600/20">
          <svg className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold">Welcome to RareImagery</h1>
        <p className="mb-8 max-w-md text-center text-zinc-400">
          Create your storefront powered by your X profile. AI-enhanced setup
          takes just a few minutes.
        </p>
        <Link
          href="/console/setup"
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-500"
        >
          Create Your Store
        </Link>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/20 text-emerald-400",
    pending: "bg-amber-500/20 text-amber-400",
    rejected: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <a
          href={`https://${storeSlug}.rareimagery.net`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Open Live Store
        </a>
      </div>

      {/* Store Overview */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{storeName}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {storeSlug}.rareimagery.net
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusColors[storeStatus || "pending"] || statusColors.pending
            }`}
          >
            {storeStatus || "pending"}
          </span>
        </div>
        <div className="mt-4 flex gap-6 text-sm text-zinc-400">
          <div>
            <span className="text-zinc-500">Theme:</span>{" "}
            <span className="text-zinc-300">{currentTheme}</span>
          </div>
          <div>
            <span className="text-zinc-500">Creator:</span>{" "}
            <span className="text-zinc-300">@{xUsername}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/console/products"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="font-medium text-white group-hover:text-blue-400">Products</h3>
          <p className="mt-1 text-xs text-zinc-500">Add and manage your product catalog</p>
        </Link>

        <Link
          href="/console/theme"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20">
            <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3 className="font-medium text-white group-hover:text-purple-400">Theme</h3>
          <p className="mt-1 text-xs text-zinc-500">Customize your storefront appearance</p>
        </Link>

        <Link
          href="/console/settings"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-medium text-white group-hover:text-emerald-400">Settings</h3>
          <p className="mt-1 text-xs text-zinc-500">Store details and notifications</p>
        </Link>
      </div>

      {isAdmin && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-white">Platform Admin</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Manage all creator stores and approvals
              </p>
            </div>
            <Link
              href="/console/admin"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              View All Stores
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
