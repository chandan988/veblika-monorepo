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
    const cookies = request.cookies.getAll()

    // Find and delete session-related cookies
    cookies.forEach((cookie) => {
      if (
        cookie.name.includes("better-auth") ||
        cookie.name.includes("session")
      ) {
        response.cookies.set({
          name: cookie.name,
          value: "",
          maxAge: 0,
          path: "/",
          domain: cookie.name.startsWith("__Host-")
            ? undefined
            : request.nextUrl.hostname,
        })
      }
    })
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
