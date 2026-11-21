import { NextResponse, type NextRequest } from "next/server";

/**
 * Fast redirect to sign-in for app routes when there is no session cookie.
 * (The API remains the source of truth; an expired cookie is handled client-side.)
 */
export function proxy(req: NextRequest) {
  if (!req.cookies.has("sb_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/library/:path*", "/item/:path*", "/ask/:path*", "/settings/:path*", "/capture"],
};
