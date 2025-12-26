"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"
import { Settings, Users, Shield, Building2 } from "lucide-react"
import { PermissionGuard } from "@/components/permission-guard"

const settingsNav = [
  {
    title: "General",
    href: "/settings",
    icon: Settings,
    permission: "organisation:view",
  },
  {
    title: "Team Members",
    href: "/settings/members",
    icon: Users,
    permission: "member:view",
  },
  {
    title: "Roles & Permissions",
    href: "/settings/roles",
    icon: Shield,
    permission: "role:view",
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-8">
        <Building2 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Organisation Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-64 shrink-0">
          <ul className="space-y-1">
            {settingsNav.map((item) => (
              <PermissionGuard key={item.href} permission={item.permission}>
                <li>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                </li>
              </PermissionGuard>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}
