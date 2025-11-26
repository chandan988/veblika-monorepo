import { TopNavbar } from "@/components/top-navbar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <TopNavbar />
      <main className="container mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
