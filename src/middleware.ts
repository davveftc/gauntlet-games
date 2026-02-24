import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/admin");

  const auth = await checkAdminAuth(request);

  // API routes: return JSON errors
  if (isApiRoute) {
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Admin is authenticated — proceed
    return NextResponse.next();
  }

  // Page routes (/admin): pass auth status via headers so the page can decide what to show
  const response = NextResponse.next();
  response.headers.set("x-admin-authenticated", auth.isAuthenticated ? "true" : "false");
  response.headers.set("x-admin-authorized", auth.isAdmin ? "true" : "false");
  response.headers.set("x-admin-email", auth.email || "");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
