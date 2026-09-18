import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static files and internal Next.js requests bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const isAuthPage = pathname === "/login";
  const isUnauthorizedPage = pathname === "/unauthorized";

  // Redirect authenticated user away from login page to dashboard
  if (isAuthPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Allow unauthorized access error page
  if (isUnauthorizedPage) {
    return NextResponse.next();
  }

  // Protect root and dashboard routes from unauthenticated users
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role;

  // Strict Role-Based Route Guards:
  // 1. Administration-Only routes
  const adminOnlyRoutes = ["/settings", "/audit-logs", "/teachers"];
  const isAdminRoute = adminOnlyRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAdminRoute && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/teachers/:path*",
    "/classes/:path*",
    "/attendance/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/audit-logs/:path*",
    "/login",
    "/unauthorized",
  ],
};
