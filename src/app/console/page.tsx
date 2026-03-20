"use client";

import Link from "next/link";
import { useConsole } from "@/components/ConsoleContext";
import VideoUploader from "@/components/VideoUploader";
import TemplatePicker from "@/components/TemplatePicker";
import CostTracker from "@/components/CostTracker";

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
          Create your storefront powered by your X profile. AI-enhanced setup takes just a few minutes.
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Store Workspace</h1>
        <a
          href={`https://${storeSlug}.rareimagery.net`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Open Live Store
        </a>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{storeName}</h2>
            <p className="text-sm text-zinc-400">@{xUsername} • {storeSlug}.rareimagery.net</p>
            <p className="mt-2 text-xs text-zinc-500">Theme: {currentTheme}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              statusColors[storeStatus || "pending"] || statusColors.pending
            }`}
          >
            {storeStatus || "pending"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/console/categories"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5l9-4.5 9 4.5m-18 0l9 4.5m9-4.5v9L12 21l-9-4.5v-9" />
            </svg>
          </div>
          <h3 className="font-medium text-white group-hover:text-blue-400">Store Categories</h3>
          <p className="mt-1 text-xs text-zinc-500">Manage catalog categories and product organization</p>
        </Link>

        <Link
          href="/console/page-building"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600/20">
            <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3 className="font-medium text-white group-hover:text-purple-400">Page Building</h3>
          <p className="mt-1 text-xs text-zinc-500">Build and publish storefront sections with AI tools</p>
        </Link>

        <Link
          href="/console/print-services"
          className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition hover:border-zinc-700"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <h3 className="font-medium text-white group-hover:text-emerald-400">Print Services</h3>
          <p className="mt-1 text-xs text-zinc-500">Connect and manage print-on-demand fulfillment</p>
        </Link>
      </div>

      {xUsername && (
        <VideoUploader sellerHandle={xUsername} />
      )}

      {xUsername && (
        <TemplatePicker current={currentTheme || "xai3"} sellerHandle={xUsername} />
      )}

      {xUsername && (
        <CostTracker sellerHandle={xUsername} />
      )}

      {isAdmin && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-medium text-white">Platform Admin</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Manage all creator stores and approvals
              </p>
            </div>
            <Link
              href="/console/admin"
              className="inline-flex min-h-11 items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              View All Stores
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
