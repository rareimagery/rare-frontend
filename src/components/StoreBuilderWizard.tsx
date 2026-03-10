"use client";

import { useState } from "react";
import ThemeSelector from "./ThemeSelector";
import ProductManager from "./ProductManager";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "rareimagery.net";

const STEPS = ["Store Info", "Choose Theme", "Add Products", "Go Live"];

interface StoreBuilderWizardProps {
  xUsername?: string;
}

export default function StoreBuilderWizard({
  xUsername,
}: StoreBuilderWizardProps) {
  const [step, setStep] = useState(0);
  const [storeName, setStoreName] = useState(
    xUsername ? `${xUsername}'s Store` : ""
  );
  const [slug, setSlug] = useState(xUsername || "");
  const [slugEdited, setSlugEdited] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // After store is created, these get populated
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeDrupalId, setStoreDrupalId] = useState<string | null>(null);
  const [profileNodeId, setProfileNodeId] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState("");

  function autoSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
  }

  function handleNameChange(name: string) {
    setStoreName(name);
    if (!slugEdited) setSlug(autoSlug(name));
  }

  async function handleCreateStore() {
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/stores/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          slug,
          xUsername: xUsername || slug,
          ownerEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create store");
        setCreating(false);
        return;
      }

      setStoreId(data.storeId);
      setStoreDrupalId(data.storeDrupalId || "");
      setProfileNodeId(data.profileNodeId || "");
      setStoreUrl(data.url);
      setStep(1);
    } catch {
      setError("Network error — please try again");
    }
    setCreating(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {i < step ? "\u2713" : i + 1}
              </div>
              <span
                className={`mt-1.5 text-xs ${
                  i <= step ? "text-white" : "text-zinc-600"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-3 mt-[-1rem] h-0.5 w-12 sm:w-20 ${
                  i < step ? "bg-green-500" : "bg-zinc-800"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Store Info */}
      {step === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
          <h2 className="mb-6 text-xl font-bold">Set Up Your Store</h2>

          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Store Name
              </label>
              <input
                value={storeName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Awesome Store"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Subdomain
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(e.target.value.toLowerCase());
                  }}
                  placeholder="yourname"
                  required
                  className="w-48 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-zinc-500">.{BASE_DOMAIN}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-600">
                This will be your store URL
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-400">
                Contact Email
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={handleCreateStore}
              disabled={creating || !storeName || !slug || !ownerEmail}
              className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {creating ? "Creating store..." : "Create Store & Continue"}
            </button>
          </div>
        </div>
      )}

      {/* Step 1: Choose Theme */}
      {step === 1 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
          <h2 className="mb-2 text-xl font-bold">Choose Your Theme</h2>
          <p className="mb-6 text-sm text-zinc-400">
            Pick a look for your store. You can change this anytime.
          </p>

          {profileNodeId ? (
            <ThemeSelector
              profileNodeId={profileNodeId}
              currentTheme="default"
            />
          ) : (
            <p className="text-sm text-zinc-500">
              Theme selection will be available once your X profile is linked.
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Continue to Products
            </button>
            <button
              onClick={() => setStep(2)}
              className="rounded-lg border border-zinc-700 px-6 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Add Products */}
      {step === 2 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
          <h2 className="mb-2 text-xl font-bold">Add Products</h2>
          <p className="mb-6 text-sm text-zinc-400">
            Add products to start selling. You can always add more later.
          </p>

          {storeId && storeDrupalId ? (
            <ProductManager
              storeId={storeId}
              storeDrupalId={storeDrupalId}
            />
          ) : (
            <p className="text-sm text-zinc-500">
              Product manager unavailable — store ID missing.
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep(3)}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Continue
            </button>
            <button
              onClick={() => setStep(3)}
              className="rounded-lg border border-zinc-700 px-6 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Go Live */}
      {step === 3 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
          <div className="mb-4 text-4xl">&#127881;</div>
          <h2 className="mb-2 text-2xl font-bold text-green-400">
            Your Store is Live!
          </h2>
          <p className="mb-6 text-zinc-400">
            Your store is now available at{" "}
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-400 hover:text-indigo-300"
            >
              {slug}.{BASE_DOMAIN}
            </a>
          </p>

          <div className="flex justify-center gap-3">
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              View Your Store
            </a>
            {storeId && (
              <a
                href={`/console/stores/${storeId}`}
                className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
              >
                Manage Store
              </a>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 text-left">
            <h3 className="mb-3 text-sm font-semibold text-zinc-300">
              What&apos;s Next?
            </h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>- Add more products from your store dashboard</li>
              <li>- Customize your theme and colors</li>
              <li>- Share your store link on X</li>
              <li>- Connect Stripe to start accepting payments</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
