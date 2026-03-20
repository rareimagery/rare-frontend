import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DRUPAL_API_URL = process.env.DRUPAL_API_URL;
const DRUPAL_TOKEN = process.env.DRUPAL_TOKEN;
const DRUPAL_API_USER = process.env.DRUPAL_API_USER;
const DRUPAL_API_PASS = process.env.DRUPAL_API_PASS;
const MAINTENANCE_MODE = (process.env.MAINTENANCE_MODE || "false").toLowerCase() === "true";

function isBypassedPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/playground")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname === "/maintenance") return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  return false;
}

function buildAuthHeader(): string | null {
  if (DRUPAL_TOKEN) {
    return `Bearer ${DRUPAL_TOKEN}`;
  }

  if (DRUPAL_API_USER && DRUPAL_API_PASS) {
    // btoa is available in the middleware runtime.
    return `Basic ${btoa(`${DRUPAL_API_USER}:${DRUPAL_API_PASS}`)}`;
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (MAINTENANCE_MODE && !isBypassedPath(pathname)) {
    return NextResponse.rewrite(new URL("/maintenance", request.url));
  }

  const handle = request.nextUrl.pathname.split("/playground/")[1]?.split("/")[0];
  if (!handle) return NextResponse.next();

  if (!DRUPAL_API_URL) {
    return NextResponse.next();
  }

  const authHeader = buildAuthHeader();

  const url = `${DRUPAL_API_URL}/jsonapi/user/user?` +
    `filter[name]=${encodeURIComponent(handle)}` +
    `&fields[user--user]=field_playground_access,name`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.api+json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.next();
    }

    const payload = await response.json();
    const approved = Boolean(payload?.data?.[0]?.attributes?.field_playground_access);

    if (!approved) {
      return NextResponse.redirect(new URL(`/stores/${handle}`, request.url));
    }
  } catch {
    // Fail open if Drupal is temporarily unavailable.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image).*)",
  ],
};
