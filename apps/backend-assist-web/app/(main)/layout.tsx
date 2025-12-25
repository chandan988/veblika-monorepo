import { AuthProvider } from "@/components/auth-provider"
import { TopNavbar } from "@/components/top-navbar"
import { Footer } from "@/components/footer"

// Main layout component
export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <TopNavbar />
        <main className="flex-1 min-h-0 overflow-auto">{children}</main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

