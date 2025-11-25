"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: session, isPending, error } = authClient.useSession()

  useEffect(() => {
    // Don't run auth checks on public routes
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      return
    }

    // Wait for session to load
    if (isPending) return

    // Handle session errors (invalid/expired session despite cookie existing)
    if (error) {
      router.push(`/login?callback=${encodeURIComponent(pathname)}`)
      return
    }

    // If no session and cookie was invalid, middleware already redirected
    // This handles edge cases where cookie exists but session is invalid
    if (!session) {
      router.push(`/login?callback=${encodeURIComponent(pathname)}`)
    }
  }, [session, isPending, error, pathname, router])

  // On public routes, render immediately
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return <>{children}</>
  }

  // Show minimal loading state only on initial load
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    )
  }

  // If there's an error or no session, don't render children
  // (redirect will happen in useEffect)
  if (error || !session) {
    return null
  }

  // User is authenticated and session is valid
  return <>{children}</>
}