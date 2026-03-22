"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import BuilderDocumentRenderer from "@/components/builder/BuilderDocumentRenderer";
import {
  createBlock,
  createDefaultBuilderDocument,
  createEmptyPreviewData,
  parseStoredBuilderDocument,
  touchDocument,
  type BuilderBlock,
  type BuilderBlockType,
  type BuilderDocument,
  type BuilderPreviewData,
  type BuilderTheme,
} from "@/lib/builderDocument";

type SavedBuild = {
  id: string;
  label: string;
  code: string;
  createdAt: string;
  published?: boolean;
};

const BLOCK_LIBRARY: Array<{ type: BuilderBlockType; label: string; description: string }> = [
  { type: "top-menu", label: "Top menu", description: "Navigation pills across the top of the page." },
  { type: "profile-header", label: "Profile header", description: "Banner, avatar, intro, and CTA." },
  { type: "sidebar", label: "Sidebar", description: "Bio, links, or supporter callout card." },
  { type: "friends-list", label: "Friends list", description: "Pulls in top followers / friends." },
  { type: "post-feed", label: "Post feed", description: "Recent X posts with optional media." },
  { type: "product-grid", label: "Product grid", description: "Shop block powered by store products." },
  { type: "media-widget", label: "Music / media", description: "Spotify, YouTube, or other media link block." },
  { type: "custom-embed", label: "Custom embed", description: "Paste HTML or iframe markup." },
];

const THEME_FIELDS: Array<{ key: keyof BuilderTheme; label: string }> = [
  { key: "pageBg", label: "Page background" },
  { key: "menuBg", label: "Menu background" },
  { key: "sidebarBg", label: "Sidebar background" },
  { key: "surface", label: "Primary surface" },
  { key: "surfaceMuted", label: "Muted surface" },
  { key: "accent", label: "Accent" },
  { key: "textPrimary", label: "Primary text" },
  { key: "textSecondary", label: "Secondary text" },
  { key: "border", label: "Border" },
];

function normalizeHandle(value: string | null | undefined): string {
  return (value || "").replace(/^@+/, "").trim();
}

function fallbackBuildLabel(document: BuilderDocument, published: boolean): string {
  const timestamp = new Date().toLocaleString();
  return `${document.meta.name} ${published ? "Publish" : "Draft"} ${timestamp}`;
}

function mapFriends(value: unknown): BuilderPreviewData["friends"] {
  if (!Array.isArray(value)) return [];

  const mapped: Array<BuilderPreviewData["friends"][number] | null> = value
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      const username = typeof candidate.username === "string" ? candidate.username : `friend-${index + 1}`;
      return {
        id: `${username}-${index}`,
        username,
        displayName:
          typeof candidate.display_name === "string"
            ? candidate.display_name
            : typeof candidate.displayName === "string"
              ? candidate.displayName
              : username,
        avatar:
          typeof candidate.profile_image_url === "string"
            ? candidate.profile_image_url
            : typeof candidate.avatar === "string"
              ? candidate.avatar
              : undefined,
        followerCount: typeof candidate.follower_count === "number" ? candidate.follower_count : undefined,
      };
    });

  return mapped.filter((entry): entry is BuilderPreviewData["friends"][number] => entry !== null);
}

export default function BuilderStudio({
  defaultHandle,
  defaultStoreSlug,
}: {
  defaultHandle?: string | null;
  defaultStoreSlug?: string | null;
}) {
  const searchParams = useSearchParams();
  const initialHandle = normalizeHandle(searchParams.get("handle") || defaultHandle || defaultStoreSlug);

  const [document, setDocument] = useState<BuilderDocument>(() => createDefaultBuilderDocument(initialHandle || "creator"));
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<BuilderPreviewData>(() => createEmptyPreviewData(initialHandle || "creator"));
  const [syncState, setSyncState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState("Waiting for X data sync.");
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [buildsLoading, setBuildsLoading] = useState(true);
  const [persisting, setPersisting] = useState<"draft" | "publish" | null>(null);
  const [persistMessage, setPersistMessage] = useState("Drafts are private until you publish.");
  const hydratedFromBuild = useRef(false);

  const activeHandle = useMemo(() => normalizeHandle(searchParams.get("handle") || document.meta.handle || defaultHandle || defaultStoreSlug), [searchParams, document.meta.handle, defaultHandle, defaultStoreSlug]);
  const selectedBlock = document.blocks.find((block) => block.id === selectedBlockId) || null;

  function updateDocument(mutator: (current: BuilderDocument) => BuilderDocument) {
    setDocument((current) => touchDocument(mutator(current)));
  }

  function updateSelectedBlock(mutator: (block: BuilderBlock) => BuilderBlock) {
    if (!selectedBlock) return;

    updateDocument((current) => ({
      ...current,
      blocks: current.blocks.map((block) => (block.id === selectedBlock.id ? mutator(block) : block)),
    }));
  }

  async function loadPreviewData() {
    setSyncState("loading");
    setSyncMessage("Refreshing X data...");

    let handle = activeHandle;
    let merged = createEmptyPreviewData(handle || "creator");

    try {
      const insightsRes = await fetch("/api/console/insights", { cache: "no-store" });
      if (insightsRes.ok) {
        const insights = await insightsRes.json();
        handle = handle || normalizeHandle(insights.xUsername);
        merged = {
          ...merged,
          handle: handle || merged.handle,
          bio: typeof insights.bio === "string" ? insights.bio : merged.bio,
          avatar: typeof insights.profilePictureUrl === "string" ? insights.profilePictureUrl : merged.avatar,
          banner: typeof insights.bannerUrl === "string" ? insights.bannerUrl : merged.banner,
          followerCount: typeof insights.followerCount === "number" ? insights.followerCount : merged.followerCount,
          friends: mapFriends(insights.topFollowers),
        };
      }

      if (handle) {
        const previewRes = await fetch(`/api/template-preview/${handle}`, { cache: "no-store" });
        if (previewRes.ok) {
          const preview = await previewRes.json();
          merged = {
            ...merged,
            handle,
            bio: typeof preview.bio === "string" && preview.bio ? preview.bio : merged.bio,
            avatar: typeof preview.avatar === "string" ? preview.avatar : merged.avatar,
            banner: typeof preview.banner === "string" ? preview.banner : merged.banner,
            followerCount: typeof preview.followerCount === "number" ? preview.followerCount : merged.followerCount,
            friends: merged.friends.length ? merged.friends : mapFriends(preview.friends),
            posts: Array.isArray(preview.posts) ? preview.posts : merged.posts,
            products: Array.isArray(preview.products) ? preview.products : merged.products,
          };
        }
      }

      setPreviewData(merged);
      setSyncState("ready");
      setSyncMessage(handle ? `Synced X data for @${handle}.` : "Loaded builder context.");
      setDocument((current) => touchDocument({
        ...current,
        meta: {
          ...current.meta,
          handle: handle || current.meta.handle,
          name: current.meta.name === `@${current.meta.handle} storefront` || !current.meta.name
            ? `@${handle || current.meta.handle || "creator"} storefront`
            : current.meta.name,
        },
      }));
    } catch {
      setSyncState("error");
      setSyncMessage("Could not refresh X data. The builder is using fallback preview content.");
    }
  }

  async function loadBuilds() {
    setBuildsLoading(true);
    try {
      const response = await fetch("/api/builds", { cache: "no-store" });
      if (!response.ok) {
        setBuilds([]);
        return;
      }

      const data = await response.json();
      const nextBuilds = Array.isArray(data.builds) ? data.builds : [];
      setBuilds(nextBuilds);

      if (!hydratedFromBuild.current) {
        const firstLoadable = [...nextBuilds].reverse().find((build) => parseStoredBuilderDocument(build.code));
        if (firstLoadable) {
          const parsed = parseStoredBuilderDocument(firstLoadable.code);
          if (parsed) {
            hydratedFromBuild.current = true;
            setDocument(parsed);
            setSelectedBlockId(parsed.blocks[0]?.id ?? null);
            setPersistMessage(`Loaded ${firstLoadable.published ? "published" : "draft"} snapshot: ${firstLoadable.label}`);
          }
        }
      }
    } finally {
      setBuildsLoading(false);
    }
  }

  useEffect(() => {
    void loadPreviewData();
    void loadBuilds();
  }, []);

  useEffect(() => {
    if (!selectedBlockId && document.blocks[0]) {
      setSelectedBlockId(document.blocks[0].id);
    }
  }, [document.blocks, selectedBlockId]);

  function insertBlock(type: BuilderBlockType, index = document.blocks.length) {
    const nextBlock = createBlock(type);
    updateDocument((current) => {
      const blocks = [...current.blocks];
      blocks.splice(index, 0, nextBlock);
      return { ...current, blocks };
    });
    setSelectedBlockId(nextBlock.id);
  }

  function moveBlock(blockId: string, targetIndex: number) {
    updateDocument((current) => {
      const currentIndex = current.blocks.findIndex((block) => block.id === blockId);
      if (currentIndex < 0) return current;

      const blocks = [...current.blocks];
      const [moved] = blocks.splice(currentIndex, 1);
      const normalizedIndex = Math.max(0, Math.min(targetIndex, blocks.length));
      blocks.splice(normalizedIndex, 0, moved);
      return { ...current, blocks };
    });
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    const newType = event.dataTransfer.getData("application/x-builder-new");
    const existingId = event.dataTransfer.getData("application/x-builder-existing");

    if (newType) {
      insertBlock(newType as BuilderBlockType, index);
      return;
    }

    if (existingId) {
      moveBlock(existingId, index);
    }
  }

  async function persistDocument(published: boolean) {
    setPersisting(published ? "publish" : "draft");
    setPersistMessage(published ? "Publishing storefront..." : "Saving draft...");

    const nextDocument = touchDocument(document);
    setDocument(nextDocument);

    try {
      const response = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: fallbackBuildLabel(nextDocument, published),
          code: JSON.stringify(nextDocument),
          published,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Build persistence failed.");
      }

      setPersistMessage(published ? "Published to your live store." : "Draft saved successfully.");
      await loadBuilds();
    } catch (error) {
      setPersistMessage(error instanceof Error ? error.message : "Build persistence failed.");
    } finally {
      setPersisting(null);
    }
  }

  function loadSavedBuild(build: SavedBuild) {
    const parsed = parseStoredBuilderDocument(build.code);
    if (!parsed) {
      setPersistMessage(`Cannot load ${build.label} because it uses the legacy builder format.`);
      return;
    }

    hydratedFromBuild.current = true;
    setDocument(parsed);
    setSelectedBlockId(parsed.blocks[0]?.id ?? null);
    setPersistMessage(`Loaded ${build.label}.`);
  }

  async function publishExistingBuild(buildId: string) {
    setPersisting("publish");
    setPersistMessage("Publishing selected build...");

    try {
      const response = await fetch("/api/builds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: buildId, published: true }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not publish build.");
      }

      setPersistMessage("Selected build is now live.");
      await loadBuilds();
    } catch (error) {
      setPersistMessage(error instanceof Error ? error.message : "Could not publish build.");
    } finally {
      setPersisting(null);
    }
  }

  async function deleteBuild(buildId: string) {
    setPersistMessage("Deleting build...");

    try {
      const response = await fetch("/api/builds", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: buildId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not delete build.");
      }

      setPersistMessage("Build deleted.");
      await loadBuilds();
    } catch (error) {
      setPersistMessage(error instanceof Error ? error.message : "Could not delete build.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-zinc-800 bg-zinc-900/55 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Builder Rebuild</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Custom Drag-and-Drop Builder</h1>
          <p className="mt-2 text-sm text-zinc-400">Block-first page composer with real sidebar, menu, friends list, color controls, and explicit draft/publish actions.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void loadPreviewData()}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:text-white"
          >
            Refresh X Data
          </button>
          <button
            type="button"
            onClick={() => void persistDocument(false)}
            disabled={persisting !== null}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {persisting === "draft" ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => void persistDocument(true)}
            disabled={persisting !== null}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {persisting === "publish" ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <aside className="space-y-5 rounded-[28px] border border-zinc-800 bg-zinc-900/55 p-4">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Block Library</h2>
              <span className="text-xs text-zinc-500">Drag or click to add</span>
            </div>
            <div className="space-y-2">
              {BLOCK_LIBRARY.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("application/x-builder-new", item.type)}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => insertBlock(item.type)}
                      className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200 transition hover:border-zinc-500 hover:text-white"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Page Structure</h2>
              <span className="text-xs text-zinc-500">{document.blocks.length} blocks</span>
            </div>
            <div className="space-y-2">
              {document.blocks.map((block, index) => (
                <div key={block.id} className="space-y-2">
                  <div
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, index)}
                    className="h-2 rounded-full border border-dashed border-zinc-800 bg-zinc-950/40"
                  />
                  <button
                    type="button"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("application/x-builder-existing", block.id)}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${selectedBlockId === block.id ? "border-sky-500 bg-sky-500/10" : "border-zinc-800 bg-zinc-950/60 hover:border-zinc-700"}`}
                  >
                    <p className="text-sm font-medium text-white">{BLOCK_LIBRARY.find((item) => item.type === block.type)?.label || block.type}</p>
                    <p className="mt-1 text-xs text-zinc-500">{block.type}</p>
                  </button>
                </div>
              ))}
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, document.blocks.length)}
                className="h-2 rounded-full border border-dashed border-zinc-800 bg-zinc-950/40"
              />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Build History</h2>
              <span className="text-xs text-zinc-500">{buildsLoading ? "Loading..." : builds.length}</span>
            </div>
            <div className="space-y-2">
              {buildsLoading ? (
                <p className="text-sm text-zinc-500">Loading saved builds...</p>
              ) : builds.length === 0 ? (
                <p className="text-sm text-zinc-500">No draft or published snapshots yet.</p>
              ) : (
                builds
                  .slice()
                  .reverse()
                  .map((build) => {
                    const loadable = !!parseStoredBuilderDocument(build.code);
                    return (
                      <div key={build.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{build.label}</p>
                            <p className="mt-1 text-xs text-zinc-500">{new Date(build.createdAt).toLocaleString()}</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${build.published ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>
                            {build.published ? "Live" : "Draft"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadSavedBuild(build)}
                          disabled={!loadable}
                          className="mt-3 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-200 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loadable ? "Load" : "Unsupported"}
                        </button>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void publishExistingBuild(build.id)}
                            disabled={persisting !== null || build.published}
                            className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {build.published ? "Live" : "Publish"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteBuild(build.id)}
                            className="rounded-full border border-red-500/40 px-3 py-1 text-xs text-red-300 transition hover:border-red-400 hover:text-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </section>
        </aside>

        <section className="space-y-4">
          <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/55 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Storefront Preview</p>
                <p className="mt-2 text-sm text-zinc-400">{syncMessage}</p>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p>Status: {syncState}</p>
                <p>Handle: @{previewData.handle || document.meta.handle}</p>
              </div>
            </div>
          </div>

          <BuilderDocumentRenderer document={document} data={previewData} />

          <div className="rounded-[28px] border border-zinc-800 bg-zinc-900/55 px-5 py-4 text-sm text-zinc-400">
            {persistMessage}
          </div>
        </section>

        <aside className="space-y-5 rounded-[28px] border border-zinc-800 bg-zinc-900/55 p-4">
          <section>
            <h2 className="text-sm font-semibold text-white">Page Settings</h2>
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-zinc-500">
                Storefront name
                <input
                  value={document.meta.name}
                  onChange={(event) => updateDocument((current) => ({ ...current, meta: { ...current.meta, name: event.target.value } }))}
                  className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white">Color Controls</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {THEME_FIELDS.map((field) => (
                <label key={field.key} className="block text-xs text-zinc-500">
                  {field.label}
                  <div className="mt-1 flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2">
                    <input
                      type="color"
                      value={document.theme[field.key]}
                      onChange={(event) => updateDocument((current) => ({
                        ...current,
                        theme: { ...current.theme, [field.key]: event.target.value },
                      }))}
                      className="h-8 w-10 rounded border-0 bg-transparent p-0"
                    />
                    <span className="text-sm text-white">{document.theme[field.key]}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Selected Block</h2>
              {selectedBlock ? (
                <button
                  type="button"
                  onClick={() => {
                    updateDocument((current) => ({
                      ...current,
                      blocks: current.blocks.filter((block) => block.id !== selectedBlock.id),
                    }));
                    setSelectedBlockId(null);
                  }}
                  className="rounded-full border border-red-500/40 px-3 py-1 text-xs text-red-300 transition hover:border-red-400 hover:text-red-200"
                >
                  Remove
                </button>
              ) : null}
            </div>

            {!selectedBlock ? (
              <p className="mt-3 text-sm text-zinc-500">Select a block from the page structure to edit its content.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {selectedBlock.type === "profile-header" ? (
                  <>
                    <Field label="Title" value={selectedBlock.title} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { title: string }), title: value }))} />
                    <TextAreaField label="Subtitle" value={selectedBlock.subtitle} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { subtitle: string }), subtitle: value }))} />
                    <Field label="CTA label" value={selectedBlock.ctaLabel} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { ctaLabel: string }), ctaLabel: value }))} />
                    <ToggleField label="Show banner" checked={selectedBlock.showBanner} onChange={(checked) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { showBanner: boolean }), showBanner: checked }))} />
                    <ToggleField label="Show avatar" checked={selectedBlock.showAvatar} onChange={(checked) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { showAvatar: boolean }), showAvatar: checked }))} />
                  </>
                ) : null}

                {selectedBlock.type === "top-menu" ? (
                  <TextAreaField label="Menu items (comma separated)" value={selectedBlock.items.join(", ")} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { items: string[] }), items: value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
                ) : null}

                {selectedBlock.type === "sidebar" ? (
                  <>
                    <Field label="Heading" value={selectedBlock.heading} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { heading: string }), heading: value }))} />
                    <TextAreaField label="Description" value={selectedBlock.description} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { description: string }), description: value }))} />
                    <Field label="CTA label" value={selectedBlock.ctaLabel} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { ctaLabel: string }), ctaLabel: value }))} />
                  </>
                ) : null}

                {selectedBlock.type === "friends-list" ? (
                  <>
                    <Field label="Title" value={selectedBlock.title} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { title: string }), title: value }))} />
                    <NumberField label="Max items" value={selectedBlock.maxItems} min={1} max={12} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { maxItems: number }), maxItems: value }))} />
                  </>
                ) : null}

                {selectedBlock.type === "post-feed" ? (
                  <>
                    <Field label="Title" value={selectedBlock.title} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { title: string }), title: value }))} />
                    <NumberField label="Max items" value={selectedBlock.maxItems} min={1} max={10} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { maxItems: number }), maxItems: value }))} />
                  </>
                ) : null}

                {selectedBlock.type === "product-grid" ? (
                  <>
                    <Field label="Title" value={selectedBlock.title} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { title: string }), title: value }))} />
                    <NumberField label="Max items" value={selectedBlock.maxItems} min={1} max={12} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { maxItems: number }), maxItems: value }))} />
                    <NumberField label="Columns" value={selectedBlock.columns} min={2} max={3} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { columns: 2 | 3 }), columns: value === 2 ? 2 : 3 }))} />
                  </>
                ) : null}

                {selectedBlock.type === "media-widget" ? (
                  <>
                    <Field label="Title" value={selectedBlock.title} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { title: string }), title: value }))} />
                    <Field label="Media URL" value={selectedBlock.embedUrl} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { embedUrl: string }), embedUrl: value }))} />
                    <TextAreaField label="Caption" value={selectedBlock.caption} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { caption: string }), caption: value }))} />
                  </>
                ) : null}

                {selectedBlock.type === "custom-embed" ? (
                  <>
                    <Field label="Title" value={selectedBlock.title} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { title: string }), title: value }))} />
                    <TextAreaField label="Embed HTML" rows={8} value={selectedBlock.html} onChange={(value) => updateSelectedBlock((block) => ({ ...(block as BuilderBlock & { html: string }), html: value }))} />
                  </>
                ) : null}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600" />
    </label>
  );
}

function TextAreaField({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600" />
    </label>
  );
}

function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="block text-xs text-zinc-500">
      {label}
      <input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value) || min)} className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600" />
    </label>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-3 py-3 text-sm text-white">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-zinc-700 bg-zinc-900" />
    </label>
  );
}