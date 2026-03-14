"use client";

import { useEffect, useState } from "react";

interface Build {
  id: string;
  label: string;
  code: string;
  createdAt: string;
  published?: boolean;
}

export default function BuildLibrary({
  onLoad,
}: {
  onLoad: (code: string) => void;
}) {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/builds")
      .then((r) => r.json())
      .then((d) => setBuilds(d.builds ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await fetch("/api/builds", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBuilds((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleTogglePublish(build: Build) {
    setToggling(build.id);
    try {
      const res = await fetch("/api/builds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: build.id, published: !build.published }),
      });
      if (res.ok) {
        setBuilds((prev) =>
          prev.map((b) =>
            b.id === build.id ? { ...b, published: !b.published } : b
          )
        );
      }
    } finally {
      setToggling(null);
    }
  }

  function handleDownload(build: Build) {
    const blob = new Blob([build.code], { type: "text/typescript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${build.label.replace(/[^a-zA-Z0-9_-]/g, "_")}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading)
    return <p className="p-4 text-sm text-gray-400">Loading builds...</p>;
  if (!builds.length)
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-400">No saved builds yet.</p>
        <p className="mt-1 text-xs text-gray-500">
          Generate a component and save it to see it here.
        </p>
      </div>
    );

  const published = builds.filter((b) => b.published);
  const drafts = builds.filter((b) => !b.published);

  return (
    <div>
      {published.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-green-50 border-b border-green-100">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
              Live on store ({published.length})
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {published.map((b) => (
              <BuildRow
                key={b.id}
                build={b}
                toggling={toggling === b.id}
                onLoad={onLoad}
                onTogglePublish={handleTogglePublish}
                onDelete={handleDelete}
                onDownload={handleDownload}
              />
            ))}
          </ul>
        </div>
      )}
      {drafts.length > 0 && (
        <div>
          {published.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Drafts ({drafts.length})
              </p>
            </div>
          )}
          <ul className="divide-y divide-gray-100">
            {drafts.map((b) => (
              <BuildRow
                key={b.id}
                build={b}
                toggling={toggling === b.id}
                onLoad={onLoad}
                onTogglePublish={handleTogglePublish}
                onDelete={handleDelete}
                onDownload={handleDownload}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BuildRow({
  build,
  toggling,
  onLoad,
  onTogglePublish,
  onDelete,
  onDownload,
}: {
  build: Build;
  toggling: boolean;
  onLoad: (code: string) => void;
  onTogglePublish: (build: Build) => void;
  onDelete: (id: string) => void;
  onDownload: (build: Build) => void;
}) {
  return (
    <li className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {build.published && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
            )}
            <p className="text-sm font-medium text-gray-800 truncate">
              {build.label}
            </p>
          </div>
          <p className="text-xs text-gray-400">
            {new Date(build.createdAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={() => onLoad(build.code)}
          className="px-3 py-1 text-xs bg-purple-700 text-white rounded hover:bg-purple-800 cursor-pointer flex-shrink-0"
        >
          Load
        </button>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => onTogglePublish(build)}
          disabled={toggling}
          className={`flex-1 py-1.5 text-xs font-medium rounded transition cursor-pointer disabled:opacity-50 ${
            build.published
              ? "bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {toggling
            ? "Saving..."
            : build.published
            ? "Live - click to unpublish"
            : "Publish to store"}
        </button>
        <button
          onClick={() => onDownload(build)}
          className="px-2 py-1.5 text-xs bg-gray-100 text-gray-500 rounded hover:bg-gray-200 cursor-pointer"
          title="Download .tsx"
        >
          Export
        </button>
        <button
          onClick={() => onDelete(build.id)}
          className="px-2 py-1.5 text-xs bg-gray-100 text-red-400 rounded hover:bg-red-50 hover:text-red-600 cursor-pointer"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
