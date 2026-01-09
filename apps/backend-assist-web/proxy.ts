import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"]

const publicRoutes: string[] = ["/oauth/callback", "/accept-invite"]

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)
  const { pathname } = request.nextUrl

  // Allow all API routes to pass through
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (sessionCookie && isAuthRoute) {
    // Get all cookies from the request
    const response = NextResponse.redirect(new URL("/", request.url))
    return response
  }

  if (!sessionCookie && !isAuthRoute && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url)
    const response = NextResponse.redirect(loginUrl)

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
}
