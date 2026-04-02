import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const password = process.env.DASHBOARD_PASSWORD;

  // Skip auth if no password is set or for API routes
  if (!password || request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("akwaaba-auth");
  if (authCookie?.value === password) {
    return NextResponse.next();
  }

  // Check if this is a login attempt
  if (request.nextUrl.pathname === "/login") {
    return NextResponse.next();
  }

  // Redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|akwaaba-logo.png|akwaaba-logo.svg|login).*)"],
};
