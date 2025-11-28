import { AuthProvider } from "@/components/auth-provider"
import { TopNavbar } from "@/components/top-navbar"
import { Footer } from "@/components/footer"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <TopNavbar />
        <main className="flex-1 overflow-hidden p-6">{children}</main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

