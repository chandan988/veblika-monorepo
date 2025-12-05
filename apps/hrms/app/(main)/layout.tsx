import "@workspace/ui/globals.css"
import { Providers } from "@/components/providers"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { AppHeader } from "@/components/app-header"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </Providers>
  )
}
