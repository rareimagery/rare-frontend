import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ProvisionButton from "@/components/ProvisionButton";
import UpgradeButton from "@/components/UpgradeButton";

export default async function ConsolePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const role = (session as any).role;
  const xUsername = (session as any).xUsername;

  // Admin goes to store list
  if (role === "admin") {
    redirect("/console/stores");
  }

  // Creator flow
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          Welcome{xUsername ? `, @${xUsername}` : ""}
        </h1>
        <p className="mt-2 text-zinc-400">
          Get your own page at{" "}
          <span className="text-indigo-400">
            {xUsername || "yourname"}.rareimagery.net
          </span>
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h2 className="mb-4 text-xl font-semibold">
          MySpace Vibes Page — Free with X Follow
        </h2>
        <ul className="mb-6 space-y-2 text-sm text-zinc-400">
          <li>Full MySpace theme: glitter text, marquees, music player, cursor sparkles</li>
          <li>Your real X data auto-imported by Grok (PFP, bio, posts, followers)</li>
          <li>Customize colors, fonts, backgrounds, and music from the console</li>
          <li>Live at {xUsername || "yourname"}.rareimagery.net</li>
        </ul>

        <ProvisionButton />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h2 className="mb-4 text-xl font-semibold">
          Full Creator Store — $5 setup + $1/month
        </h2>
        <ul className="mb-6 space-y-2 text-sm text-zinc-400">
          <li>Everything above, plus sell products with Stripe checkout</li>
          <li>5 themes: Default, Minimal, Neon, Editorial, MySpace</li>
          <li>Grok AI product recommendations</li>
          <li>2.9% + $0.30 per transaction</li>
        </ul>
        <UpgradeButton xUsername={xUsername} />
      </div>
    </div>
  );
}
