import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"]

// Public routes accessible without authentication
const publicRoutes: string[] = ["/oauth/callback", "/accept-invitation"]

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  const { pathname } = request.nextUrl

  // Allow all API routes to pass through
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = 
    pathname === "/" || 
    publicRoutes.some((route) => pathname.startsWith(route))

  // If authenticated and on auth route, redirect to home
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If authenticated and on home page, redirect to dashboard
  if (sessionCookie && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If not authenticated and trying to access protected route, redirect to login
  if (!sessionCookie && !isAuthRoute && !isPublicRoute) {
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000"
    const loginUrl = new URL("/login", authUrl)
    loginUrl.searchParams.set("callback", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
}
