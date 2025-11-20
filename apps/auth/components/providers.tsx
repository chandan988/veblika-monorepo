"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { GoogleOAuthProvider } from "@react-oauth/google"
import { Toaster } from "@workspace/ui/components/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        {children}
        <Toaster />
      </NextThemesProvider>
    </GoogleOAuthProvider>
  )
}
