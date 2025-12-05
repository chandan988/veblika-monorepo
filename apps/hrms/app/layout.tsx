import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { AppHeader } from "@/components/app-header"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "HRMS App",
  description: "Human Resource Management System Application",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div>{children}</div>
      </body>
    </html>
  )
}
