"use client"

import { useMemo, useState } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { Toaster } from "@workspace/ui/components/sonner"
import { AuthProvider } from "./auth-provider"
import { useNotifications } from "@/hooks/use-notifications"
import { EmailPreviewModal } from "@/components/notifications/email-preview-modal"

function AppShell({ children }: { children: React.ReactNode }) {
  useNotifications()
  return (
    <>
      {children}
      <EmailPreviewModal />
      <Toaster />
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const googleClientId = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "", [])

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          enableColorScheme
        >
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </NextThemesProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  )
}
