import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "./lib/auth"

const authRoutes = ["/login", "/signup", "forgot-password", "/reset-password"]
const publicRoutes = []

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/api")) {
    // If it's an API route, skip the middleware for now
    return NextResponse.next()
  }

  const session = await auth.api.getSession({
    query: {
      disableCookieCache: true,
    },
    headers: request.headers,
  })

  //   If auth route and logged in, redirect to home(/)
  if (authRoutes.includes(pathname)) {
    if (session?.user) {
      console.log(pathname, " user logged in, redirecting to /")
      return NextResponse.redirect(new URL("/", request.url))
    } else {
      return NextResponse.next()
    }
  }

  //   If not public route and not logged in, redirect to login
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
}
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
