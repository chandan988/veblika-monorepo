"use client"

import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Users, Settings, Shield } from "lucide-react"

export default function MasterPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Master Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage system configuration and resellers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => router.push("/master/resellers")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Resellers</CardTitle>
                <CardDescription className="text-xs">
                  Manage resellers and apps
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View, create, and manage resellers with their associated apps and
              hosts.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
