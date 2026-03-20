import { NextRequest, NextResponse } from "next/server";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "rareimagery.net";
const DRUPAL_API_URL = process.env.DRUPAL_API_URL;
const DRUPAL_TOKEN = process.env.DRUPAL_TOKEN;
const DRUPAL_API_USER = process.env.DRUPAL_API_USER;
const DRUPAL_API_PASS = process.env.DRUPAL_API_PASS;
const MAINTENANCE_MODE = (process.env.MAINTENANCE_MODE || "false").toLowerCase() === "true";

const RESERVED_SUBDOMAINS = new Set([
  "console",
  "www",
  "api",
  "admin",
  "app",
  "mail",
  "support",
  "help",
  "blog",
  "login",
  "",
]);

function isBypassedPath(pathname: string): boolean {
  if (pathname.startsWith("/playground")) return true;
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
    return `Basic ${btoa(`${DRUPAL_API_USER}:${DRUPAL_API_PASS}`)}`;
  }

  return null;
}

async function enforcePlaygroundAccess(request: NextRequest, pathname: string): Promise<NextResponse | null> {
  const handle = pathname.split("/playground/")[1]?.split("/")[0];
  if (!handle || !DRUPAL_API_URL) return null;

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

    if (!response.ok) return null;
    const payload = await response.json();
    const approved = Boolean(payload?.data?.[0]?.attributes?.field_playground_access);
    if (!approved) {
      return NextResponse.redirect(new URL(`/stores/${handle}`, request.url));
    }
  } catch {
    return null;
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (MAINTENANCE_MODE && !isBypassedPath(pathname)) {
    return NextResponse.rewrite(new URL("/maintenance", request.url));
  }

  if (pathname.startsWith("/playground/")) {
    const guarded = await enforcePlaygroundAccess(request, pathname);
    if (guarded) return guarded;
  }

  const hostname = request.headers.get("host") || "";
  const hostnameWithoutPort = hostname.split(":")[0];

  // Skip rewrite for localhost / IP addresses during development
  if (
    hostnameWithoutPort === "localhost" ||
    hostnameWithoutPort === "127.0.0.1" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostnameWithoutPort)
  ) {
    return NextResponse.next();
  }

  // Extract subdomain
  const subdomain = hostnameWithoutPort
    .replace(`.${BASE_DOMAIN}`, "")
    .toLowerCase();

  // Skip if there is no real subdomain
  if (
    RESERVED_SUBDOMAINS.has(subdomain) ||
    subdomain === hostnameWithoutPort // no subdomain was stripped
  ) {
    return NextResponse.next();
  }

  // Rewrite to the creator store page
  const url = request.nextUrl.clone();
  url.pathname = `/stores/${subdomain}${url.pathname === "/" ? "" : url.pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static assets.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.well-known/).*)",
  ],
};
