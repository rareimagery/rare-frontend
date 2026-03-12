"use client";

import { useEffect, useState } from "react";

interface PrintfulProduct {
  id: string;
  name: string;
  thumbnail_url: string;
  variants: number;
  retail_price: string;
  base_cost: string;
  technique: string;
  synced: boolean;
}

export default function PrintfulManager({
  storeId,
  storeDrupalId,
}: {
  storeId: string;
  storeDrupalId: string;
}) {
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [products, setProducts] = useState<PrintfulProduct[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Check connection status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`/api/printful/status?storeId=${storeId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setConnected(true);
            await loadProducts();
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [storeId]);

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    setConnecting(true);
    setError("");

    try {
      const res = await fetch("/api/printful/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, apiKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to connect");
      }

      setConnected(true);
      await loadProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(
        `/api/printful/products?storeId=${storeDrupalId}`
      );
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      // silent
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError("");

    try {
      const res = await fetch("/api/printful/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, storeDrupalId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Sync failed");
      }

      const result = await res.json();
      await loadProducts();

      if (result.synced > 0) {
        setError(""); // clear any previous errors
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const printTechniques: Record<string, string> = {
    dtg: "DTG",
    embroidery: "Embroidery",
    aop: "All-Over Print",
    cut_sew: "Cut & Sew",
    sublimation: "Sublimation",
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-zinc-500">
        Checking Printful connection...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-300">
            Print-on-Demand (Printful)
          </h2>
          <p className="text-sm text-zinc-500">
            Sell custom products with zero inventory. Printful prints and ships
            directly to your customers.
          </p>
        </div>
        {connected && (
          <span className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Connected
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!connected ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-6">
            <h3 className="mb-3 text-sm font-semibold text-zinc-300">
              Connect Your Printful Account
            </h3>
            <p className="mb-4 text-xs text-zinc-500">
              Enter your Printful API key to start selling print-on-demand
              products. Get your API key from{" "}
              <a
                href="https://www.printful.com/dashboard/developer/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300"
              >
                Printful Dashboard &gt; Settings &gt; API
              </a>
            </p>
            <div className="flex gap-3">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Printful API key"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={handleConnect}
                disabled={connecting || !apiKey.trim()}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {connecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>

          {/* Benefits overview */}
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                title: "Zero Inventory",
                desc: "Products are printed and shipped only when a customer orders",
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                ),
              },
              {
                title: "482+ Products",
                desc: "T-shirts, hoodies, mugs, posters, phone cases, and more",
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                ),
              },
              {
                title: "Global Shipping",
                desc: "Printful fulfills and ships worldwide from their facilities",
                icon: (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4"
              >
                <div className="mb-2 text-indigo-400">{item.icon}</div>
                <h4 className="text-sm font-semibold text-zinc-200">
                  {item.title}
                </h4>
                <p className="mt-1 text-xs text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sync button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync Products from Printful"}
            </button>
            <a
              href="https://www.printful.com/dashboard/default/products"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-300"
            >
              Open Printful Dashboard
            </a>
          </div>

          {/* Product list */}
          {products.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900/80">
                  <tr>
                    <th className="px-4 py-3 font-medium text-zinc-400">
                      Product
                    </th>
                    <th className="px-4 py-3 font-medium text-zinc-400">
                      Technique
                    </th>
                    <th className="px-4 py-3 font-medium text-zinc-400">
                      Variants
                    </th>
                    <th className="px-4 py-3 font-medium text-zinc-400">
                      Base Cost
                    </th>
                    <th className="px-4 py-3 font-medium text-zinc-400">
                      Retail
                    </th>
                    <th className="px-4 py-3 font-medium text-zinc-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-zinc-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.thumbnail_url && (
                            <img
                              src={product.thumbnail_url}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          )}
                          <span className="font-medium text-white">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {printTechniques[product.technique] ||
                          product.technique}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {product.variants}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        ${product.base_cost}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        ${product.retail_price}
                      </td>
                      <td className="px-4 py-3">
                        {product.synced ? (
                          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                            Synced
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
              <p className="text-sm text-zinc-500">
                No Printful products synced yet.
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                Design products in Printful&apos;s Design Maker, then sync them
                here.
              </p>
            </div>
          )}

          {/* How it works */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-3 text-sm font-semibold text-zinc-300">
              How Print-on-Demand Works
            </h3>
            <ol className="space-y-2 text-xs text-zinc-500">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                  1
                </span>
                <span>
                  Design your products in{" "}
                  <a
                    href="https://www.printful.com/design-maker"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300"
                  >
                    Printful&apos;s Design Maker
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                  2
                </span>
                <span>
                  Click &quot;Sync Products from Printful&quot; to import them
                  into your store
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                  3
                </span>
                <span>
                  Set your retail prices (you keep the margin between your price
                  and Printful&apos;s base cost)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                  4
                </span>
                <span>
                  When a customer orders, Printful prints and ships directly to
                  them
                </span>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
