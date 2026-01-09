"use client"

import { Building2, ChevronDown } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useState, useRef, useEffect } from "react"
import { OrganisationSwitcher } from "./organisation-switcher"

export function OrganizationEmptyState() {
  const [showSwitcher, setShowSwitcher] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (showSwitcher && triggerRef.current) {
      triggerRef.current.click()
      setShowSwitcher(false)
    }
  }, [showSwitcher])

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-500 delay-150">
          <Building2 className="w-10 h-10 text-primary" />
        </div>

        {/* Heading */}
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-700 delay-300">
          <h1 className="text-3xl font-bold tracking-tight">
            Select Your Organization
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose an organization to get started with your workspace
          </p>
        </div>

        {/* Description */}
        <div className="bg-muted/50 rounded-lg p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
          <p className="text-sm text-muted-foreground">
            You have access to multiple organizations. Please select one from
            the organization switcher to continue.
          </p>
        </div>

        {/* Action Button */}
        <div className="animate-in fade-in slide-in-from-bottom-1 duration-700 delay-700">
          <div className="inline-block">
            <OrganisationSwitcher />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Click the organization switcher above to select an organization
          </p>
        </div>
      </div>
    </div>
  )
}
