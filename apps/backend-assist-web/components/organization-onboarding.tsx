"use client"

import { Building2, Sparkles, Users, ArrowRight } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useState } from "react"
import { CreateOrganisationModal } from "./create-organisation-modal"

interface OrganizationOnboardingProps {
  userRole?: string
}

export function OrganizationOnboarding({
  userRole,
}: OrganizationOnboardingProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const canCreateOrg = userRole === "admin" || userRole === "reseller"

  return (
    <>
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Animated Icon */}
          <div className="relative mx-auto w-24 h-24 animate-in zoom-in duration-500">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-bounce">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <h1 className="text-4xl font-bold tracking-tight">
              {canCreateOrg
                ? "Welcome! Let's Get Started"
                : "Welcome to Backend Assist"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {canCreateOrg
                ? "Create your first organization to start managing your team and resources"
                : "You need to be part of an organization to get started"}
            </p>
          </div>

          {canCreateOrg ? (
            <>
              {/* Steps */}
              <div className="grid gap-4 text-left max-w-md mx-auto">
                {[
                  {
                    icon: Building2,
                    title: "Create Organization",
                    description: "Set up your workspace with a unique name",
                    delay: "delay-300",
                  },
                  {
                    icon: Users,
                    title: "Invite Team Members",
                    description: "Collaborate with your team effectively",
                    delay: "delay-500",
                  },
                  {
                    icon: Sparkles,
                    title: "Start Building",
                    description: "Access all features and start your journey",
                    delay: "delay-700",
                  },
                ].map((step, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors animate-in fade-in slide-in-from-left-4 duration-700 ${step.delay}`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1">
                        {step.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-900">
                <Button
                  size="lg"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="group"
                >
                  Create Your First Organization
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <p className="text-xs text-muted-foreground mt-4">
                  You can always create more organizations later
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Non-admin message */}
              <div className="max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-400">
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">
                      No Organization Access Yet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      You don't have access to any organizations yet. Please
                      contact your administrator to get invited to an
                      organization.
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Need help? Contact your system administrator</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {canCreateOrg && (
        <CreateOrganisationModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />
      )}
    </>
  )
}
