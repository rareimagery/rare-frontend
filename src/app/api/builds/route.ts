import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getBuilds, saveBuilds } from "@/lib/drupalBuilds";
import { randomUUID } from "crypto";

function getStoreSlug(token: any): string | null {
  return token.storeSlug || token.xUsername || null;
}

// GET — fetch all saved builds for the authenticated user's store
export async function GET(req: NextRequest) {
  const token = await getToken({ req });
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
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = getStoreSlug(token);
  if (!slug) {
    return NextResponse.json({ error: "No store found" }, { status: 404 });
  }

  const { label, code } = await req.json();
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

  const newBuild = {
    id: randomUUID(),
    label,
    code,
    createdAt: new Date().toISOString(),
  };
  const updated = [...builds, newBuild];
  await saveBuilds(slug, updated);

  return NextResponse.json({ build: newBuild });
}

// PATCH — toggle published state for a build
export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
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
  const updated = builds.map((b) => (b.id === id ? { ...b, published } : b));
  await saveBuilds(slug, updated);

  return NextResponse.json({ ok: true });
}

// DELETE — remove a build by id
export async function DELETE(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = getStoreSlug(token);
  if (!slug) {
    return NextResponse.json({ error: "No store found" }, { status: 404 });
  }

  const { id } = await req.json();
  const builds = await getBuilds(slug);
  const updated = builds.filter((b) => b.id !== id);
  await saveBuilds(slug, updated);

  return NextResponse.json({ ok: true });
}
