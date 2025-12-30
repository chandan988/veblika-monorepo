"use client"

import { useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@workspace/ui/components/sonner"
import { AbilityProvider } from "@/components/ability-provider"
import { PermissionsLoader } from "@/components/permissions-loader"

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PermissionsLoader />
      {children}
      <Toaster />
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="white"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <AbilityProvider>
          <AppShell>{children}</AppShell>
        </AbilityProvider>
      </NextThemesProvider>
    </QueryClientProvider>
  )
}
