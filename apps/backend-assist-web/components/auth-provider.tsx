"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useCurrentUrl } from "@/hooks/use-current-url"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  const { fullUrl } = useCurrentUrl()

  useEffect(() => {
    // Wait for session to load
    if (isPending) return

    // If no session exists, redirect to login with callback
    if (!session) {
      const currentUrl = encodeURIComponent(fullUrl)
      //  todo : keep the url in env file
      router.push("/login")
    }
  }, [session, isPending, router, fullUrl])

  // Show loading state while checking session
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

  // User is authenticated, render children
  return <>{children}</>
}
