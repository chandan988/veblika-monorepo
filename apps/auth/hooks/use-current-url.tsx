"use client"
import { useMemo } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export function useCurrentUrl() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const fullUrl = useMemo(() => {
    if (typeof window === "undefined") return ""

    const url = new URL(pathname, window.location.origin)
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value)
    })

    return url.href
  }, [pathname, searchParams])

  return {
    fullUrl,
    href: typeof window !== "undefined" ? window.location.href : "",
  }
}
