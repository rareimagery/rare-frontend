"use client";

import { useState, useEffect } from "react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  sku: string;
  status: boolean;
}

interface ProductManagerProps {
  storeId: string;
  storeDrupalId: string;
}

export default function ProductManager({ storeId, storeDrupalId }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", price: "" });
  const [error, setError] = useState("");

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/products?storeId=${storeDrupalId}`);
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, [storeDrupalId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/stores/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price: form.price,
          storeId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create product");
        setSaving(false);
        return;
      }

      setForm({ title: "", description: "", price: "" });
      setShowForm(false);
      await fetchProducts();
    } catch {
      setError("Network error");
    }
    setSaving(false);
  }

  async function handleDelete(productId: string) {
    setDeleting(productId);
    try {
      await fetch("/api/stores/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      await fetchProducts();
    } catch {
      // ignore
    }
    setDeleting(null);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-300">
          Products ({products.length})
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          {showForm ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 space-y-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4"
        >
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Product Name</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Limited Edition Art Print"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What makes this product special?"
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Price (USD)</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="19.99"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Product"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-800" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No products yet. Add your first product to start selling.
        </p>
      ) : (
        <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{product.title}</p>
                <p className="text-sm text-zinc-500">
                  ${parseFloat(product.price).toFixed(2)} · SKU: {product.sku}
                </p>
              </div>
              <button
                onClick={() => handleDelete(product.id)}
                disabled={deleting === product.id}
                className="ml-4 rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition hover:border-red-500 hover:text-red-400 disabled:opacity-50"
              >
                {deleting === product.id ? "..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
