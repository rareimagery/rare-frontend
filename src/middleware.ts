import { NextRequest, NextResponse } from "next/server";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "rareimagery.net";

const IGNORED_SUBDOMAINS = new Set(["www", "api", ""]);

export function middleware(request: NextRequest) {
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
    IGNORED_SUBDOMAINS.has(subdomain) ||
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
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
