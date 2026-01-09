"use client"

import { AuthProvider } from "@/components/auth-provider"
import { TopNavbar } from "@/components/top-navbar"
import { Footer } from "@/components/footer"
import { OrganizationEmptyState } from "@/components/organization-empty-state"
import { OrganizationOnboarding } from "@/components/organization-onboarding"
import { useOrganisationStore } from "@/stores/organisation-store"
import { useSession } from "@/hooks/use-session"
import { useOrganisations } from "@/hooks/use-organisations"

// Main layout content component
function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const user = session?.data?.user
  const { data: organisations = [], isLoading } = useOrganisations()
  const activeOrganisation = useOrganisationStore((s) => s.activeOrganisation)
  const isLoaded = useOrganisationStore((s) => s.isLoaded)

  // Show loading state while fetching
  if (isLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // No organizations exist - show onboarding
  if (organisations.length === 0) {
    return <OrganizationOnboarding userRole={user?.role} />
  }

  // Has organizations but none selected - show empty state
  if (!activeOrganisation || !activeOrganisation.name) {
    return <OrganizationEmptyState />
  }

  // All good - show the actual content
  return <>{children}</>
}

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
        <main className="flex-1 min-h-0 overflow-auto">
          <MainLayoutContent>{children}</MainLayoutContent>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}

