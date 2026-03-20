import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getConsoleProfiles, getConsoleProfilesByEmail } from "@/lib/drupal";

const COOKIE_NAME = "ri_active_store_id";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const requestedStoreId = String(body?.storeId || "").trim();
  if (!requestedStoreId) {
    return NextResponse.json({ error: "storeId is required" }, { status: 400 });
  }

  const xUsername = (session as any).xUsername || (session as any).storeSlug || null;

  let stores = xUsername ? await getConsoleProfiles(xUsername) : [];
  if (!stores.length && session.user?.email) {
    stores = await getConsoleProfilesByEmail(session.user.email);
  }

  const ownsRequestedStore = stores.some((store) => store.storeId === requestedStoreId);
  if (!ownsRequestedStore) {
    return NextResponse.json({ error: "Store not available for this account" }, { status: 403 });
  }

  const res = NextResponse.json({ success: true, activeStoreId: requestedStoreId });
  res.cookies.set(COOKIE_NAME, requestedStoreId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
