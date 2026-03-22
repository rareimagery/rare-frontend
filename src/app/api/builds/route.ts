import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getToken } from "next-auth/jwt";
import type { JWT } from "next-auth/jwt";
import { getBuilds, saveBuildsDetailed } from "@/lib/drupalBuilds";
import { randomUUID } from "crypto";

type StoreJWT = JWT & {
  storeSlug?: string | null;
  xUsername?: string | null;
  handle?: string | null;
};

type StoredBuild = {
  id: string;
  label: string;
  code: string;
  createdAt: string;
  published?: boolean;
};

function normalizeStoreSlug(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/^@+/, "").toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function getStoreSlug(token: StoreJWT): string | null {
  return (
    normalizeStoreSlug(token.storeSlug) ||
    normalizeStoreSlug(token.xUsername) ||
    normalizeStoreSlug(token.handle) ||
    null
  );
}

// GET — fetch all saved builds for the authenticated user's store
export async function GET(req: NextRequest) {
  const token = (await getToken({ req })) as StoreJWT | null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = getStoreSlug(token);
  if (!slug) {
    return NextResponse.json({ error: "No store found" }, { status: 404 });
  }

  const builds = await getBuilds(slug);
  return NextResponse.json({ builds });
}

// POST — save a new build
export async function POST(req: NextRequest) {
  const token = (await getToken({ req })) as StoreJWT | null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = getStoreSlug(token);
  if (!slug) {
    return NextResponse.json({ error: "No store found" }, { status: 404 });
  }

  const { label, code, published } = await req.json();
  if (!label || !code) {
    return NextResponse.json(
      { error: "label and code required" },
      { status: 400 }
    );
  }

  const builds = await getBuilds(slug);

  if (builds.length >= 20) {
    return NextResponse.json(
      { error: "Build limit reached (max 20). Delete some first." },
      { status: 400 }
    );
  }

  const newBuild: StoredBuild = {
    id: randomUUID(),
    label,
    code,
    createdAt: new Date().toISOString(),
    published: published === true,
  };

  const updated = published === true
    ? [...(builds as StoredBuild[]).map((b) => ({ ...b, published: false })), newBuild]
    : [...(builds as StoredBuild[]), newBuild];
  const result = await saveBuildsDetailed(slug, updated);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Failed to persist build" },
      { status: result.status || 500 }
    );
  }

  revalidatePath(`/stores/${slug}`);

  return NextResponse.json({ build: newBuild, builds: updated });
}

// PATCH — toggle published state for a build
export async function PATCH(req: NextRequest) {
  const token = (await getToken({ req })) as StoreJWT | null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = getStoreSlug(token);
  if (!slug) {
    return NextResponse.json({ error: "No store found" }, { status: 404 });
  }

  const { id, published } = await req.json();
  if (!id || typeof published !== "boolean") {
    return NextResponse.json(
      { error: "id and published (boolean) required" },
      { status: 400 }
    );
  }

  const builds = await getBuilds(slug);
  const updated = (builds as StoredBuild[]).map((b) => {
    if (published) {
      return b.id === id ? { ...b, published: true } : { ...b, published: false };
    }
    return b.id === id ? { ...b, published: false } : b;
  });
  const result = await saveBuildsDetailed(slug, updated);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Failed to update publish state" },
      { status: result.status || 500 }
    );
  }

  revalidatePath(`/stores/${slug}`);

  return NextResponse.json({ ok: true });
}

// DELETE — remove a build by id
export async function DELETE(req: NextRequest) {
  const token = (await getToken({ req })) as StoreJWT | null;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = getStoreSlug(token);
  if (!slug) {
    return NextResponse.json({ error: "No store found" }, { status: 404 });
  }

  const { id } = await req.json();
  const builds = await getBuilds(slug);
  const updated = (builds as StoredBuild[]).filter((b) => b.id !== id);
  const result = await saveBuildsDetailed(slug, updated);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || "Failed to delete build" },
      { status: result.status || 500 }
    );
  }

  revalidatePath(`/stores/${slug}`);

  return NextResponse.json({ ok: true });
}
