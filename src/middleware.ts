// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value;
  const { pathname } = request.nextUrl;

  console.log("🔒 Middleware:", { pathname, hasToken: !!token });

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Protected routes that require authentication
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/orders");

  // Allow API routes to pass through (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // --- PROTECTED ROUTE LOGIC ---
  if (isProtectedRoute) {
    if (!token) {
      console.log("❌ No token for protected route, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const payload = await verifyToken(token);
      console.log("✅ Valid token for protected route:", payload.email);

      // Add user info to headers for API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId);
      requestHeaders.set("x-user-email", payload.email);
      requestHeaders.set("x-user-role", payload.role);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.log("❌ Invalid token for protected route, redirecting to login");
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
      return response;
    }
  }

  // --- LOGIN PAGE LOGIC ---
  if (pathname === "/login" && token) {
    try {
      await verifyToken(token);
      console.log("✅ Already authenticated, redirecting to dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error) {
      console.log("❌ Invalid token on login page, clearing cookie");
      const response = NextResponse.next();
      response.cookies.delete("auth-token");
      return response;
    }
  }

  // All other routes pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
  runtime: "nodejs",
};
