import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ConsoleUserMenu from "@/components/ConsoleUserMenu";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 bg-zinc-900/80">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
          <Link
            href="/console"
            className="text-lg font-bold text-indigo-400 transition hover:text-indigo-300"
          >
            RareImagery Console
          </Link>
          <Link
            href="/console/stores"
            className="text-sm text-zinc-400 transition hover:text-white"
          >
            All Stores
          </Link>
          <Link
            href="/console/stores/new"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            + New Store
          </Link>
          <ConsoleUserMenu />
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
