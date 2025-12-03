import { NextRequest, NextResponse } from "next/server"

const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"]

// http://localhost:3000/oauth2/callback
const publicRoutes: string[] = ["/oauth/callback","/accept-invitation"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log("Middleware pathname:", pathname)

  // Allow all API routes to pass through
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Check for better-auth session cookie
  // better-auth typically uses a cookie named "better-auth.session_token" or similar
  // Check for common better-auth cookie names
  const sessionCookie = 
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("session_token")?.value ||
    request.cookies.get("better-auth.session")?.value ||
    request.cookies.get("__better-auth.session")?.value

  const hasSession = !!sessionCookie
  console.log("Middleware session:", hasSession ? "authenticated" : "not authenticated")

  // If user is authenticated and trying to access auth routes, redirect to home
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If user is not authenticated and trying to access protected routes, redirect to login
  if (!hasSession && !isAuthRoute && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callback", pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log("Middleware: allowing request to proceed")

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
}
