import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "./lib/config/site";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Normalize hostname (strip port for local dev e.g. localhost:3000)
  const currentHost = hostname.replace(/:\d+$/, "");

  // Prevent rewriting for root domain and www
  const isRoot =
    currentHost === "localhost" ||
    currentHost === "127.0.0.1" ||
    currentHost === siteConfig.domain ||
    currentHost === `www.${siteConfig.domain}` ||
    currentHost === "shopper.in" ||
    currentHost === `www.shopper.in` ||
    currentHost === "shopper.site" ||
    currentHost === `www.shopper.site`;

  const path = url.pathname;

  // On a store's own address (roxtenn.shopper.in), links written as /s/roxtenn/... are tidied
  // to /... so the browser shows roxtenn.shopper.in/products/x rather than repeating the name.
  if (!isRoot) {
    const sub = currentHost.split(".")[0];
    const prefix = `/s/${sub}`;
    if (sub && sub !== "www" && (path === prefix || path.startsWith(`${prefix}/`))) {
      url.pathname = path.slice(prefix.length) || "/";
      return NextResponse.redirect(url, 307);
    }
  }

  // If path already starts with /s/, /dashboard, /register, /gallery, or /orders, don't rewrite
  if (
    path.startsWith("/s/") ||
    path.startsWith("/dashboard") ||
    path.startsWith("/register") ||
    path.startsWith("/gallery") ||
    path.startsWith("/orders")
  ) {
    return NextResponse.next();
  }

  // Extract subdomain if on a subdomain (e.g. storename.shopper.in, storename.oursite.in or storename.localhost)
  if (!isRoot) {
    const subdomain = currentHost.split(".")[0];
    if (subdomain && subdomain !== "www") {
      // Rewrite to storefront route /s/[subdomain]
      url.pathname = `/s/${subdomain}${path === "/" ? "" : path}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}
