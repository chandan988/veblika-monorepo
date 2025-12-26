"use client"

import { Check, ChevronDown, Circle, Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Badge } from "@workspace/ui/components/badge"

type ConversationStatus = "open" | "pending" | "closed"

interface StatusDropdownProps {
  /** Current status */
  status: ConversationStatus
  /** Callback when status changes */
  onStatusChange: (status: ConversationStatus) => void
  /** Disable the dropdown */
  disabled?: boolean
  /** Show as badge style or button style */
  variant?: "badge" | "button"
  /** Custom trigger className */
  className?: string
}

const statusConfig: Record<
  ConversationStatus,
  {
    label: string
    icon: typeof Circle
    color: string
    badgeVariant: "default" | "secondary" | "destructive" | "outline"
  }
> = {
  open: {
    label: "Open",
    icon: Circle,
    color: "text-green-600",
    badgeVariant: "default",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    badgeVariant: "secondary",
  },
  closed: {
    label: "Closed",
    icon: CheckCircle2,
    color: "text-muted-foreground",
    badgeVariant: "outline",
  },
}

export function StatusDropdown({
  status,
  onStatusChange,
  disabled = false,
  variant = "badge",
  className,
}: StatusDropdownProps) {
  const currentConfig = statusConfig[status]
  const StatusIcon = currentConfig.icon

  if (variant === "badge") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Badge
            variant={currentConfig.badgeVariant}
            className={cn(
              "cursor-pointer hover:opacity-80 transition-opacity gap-1 pr-1",
              disabled && "cursor-not-allowed opacity-50",
              className
            )}
          >
            <StatusIcon className={cn("h-3 w-3", currentConfig.color)} />
            {currentConfig.label}
            <ChevronDown className="h-3 w-3 ml-0.5" />
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {(Object.keys(statusConfig) as ConversationStatus[]).map(
            (statusKey) => {
              const config = statusConfig[statusKey]
              const Icon = config.icon
              return (
                <DropdownMenuItem
                  key={statusKey}
                  onClick={() => onStatusChange(statusKey)}
                  className="flex items-center gap-2"
                >
                  <Icon className={cn("h-4 w-4", config.color)} />
                  <span>{config.label}</span>
                  {statusKey === status && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </DropdownMenuItem>
              )
            }
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
        >
          <StatusIcon className={cn("h-4 w-4", currentConfig.color)} />
          {currentConfig.label}
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(Object.keys(statusConfig) as ConversationStatus[]).map(
          (statusKey) => {
            const config = statusConfig[statusKey]
            const Icon = config.icon
            return (
              <DropdownMenuItem
                key={statusKey}
                onClick={() => onStatusChange(statusKey)}
                className="flex items-center gap-2"
              >
                <Icon className={cn("h-4 w-4", config.color)} />
                <span>{config.label}</span>
                {statusKey === status && (
                  <Check className="h-4 w-4 ml-auto" />
                )}
              </DropdownMenuItem>
            )
          }
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
