"use client"

import { Flag, ChevronDown } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

export type Priority = "low" | "normal" | "high" | "urgent"

interface PriorityDropdownProps {
  /** Current priority */
  priority: Priority
  /** Callback when priority changes */
  onPriorityChange: (priority: Priority) => void
  /** Disable the dropdown */
  disabled?: boolean
  /** Show compact version */
  compact?: boolean
  /** Custom className */
  className?: string
}

const priorityConfig: Record<
  Priority,
  {
    label: string
    color: string
    bgColor: string
    textColor: string
  }
> = {
  low: {
    label: "Low",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100",
    textColor: "text-blue-700",
  },
  normal: {
    label: "Normal",
    color: "text-gray-600",
    bgColor: "bg-gray-50 hover:bg-gray-100",
    textColor: "text-gray-700",
  },
  high: {
    label: "High",
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    textColor: "text-orange-700",
  },
  urgent: {
    label: "Urgent",
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100",
    textColor: "text-red-700",
  },
}

export function PriorityDropdown({
  priority,
  onPriorityChange,
  disabled = false,
  compact = false,
  className,
}: PriorityDropdownProps) {
  const currentConfig = priorityConfig[priority]

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "h-7 gap-1.5 px-2 text-xs font-medium",
              currentConfig.bgColor,
              currentConfig.textColor,
              className
            )}
          >
            <Flag className="h-3 w-3" />
            {currentConfig.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          {(Object.keys(priorityConfig) as Priority[]).map((priorityOption) => (
            <DropdownMenuItem
              key={priorityOption}
              onClick={() => onPriorityChange(priorityOption)}
              className={cn(
                "cursor-pointer gap-2",
                priority === priorityOption && "bg-accent"
              )}
            >
              <Flag
                className={cn(
                  "h-4 w-4",
                  priorityConfig[priorityOption].color
                )}
              />
              <span className="flex-1">
                {priorityConfig[priorityOption].label}
              </span>
              {priority === priorityOption && (
                <span className="text-xs text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            "h-8 gap-2 border-border/50",
            currentConfig.bgColor,
            className
          )}
        >
          <Flag className={cn("h-4 w-4", currentConfig.color)} />
          <span className={cn("text-sm font-medium", currentConfig.textColor)}>
            {currentConfig.label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.keys(priorityConfig) as Priority[]).map((priorityOption) => (
          <DropdownMenuItem
            key={priorityOption}
            onClick={() => onPriorityChange(priorityOption)}
            className={cn(
              "cursor-pointer gap-2",
              priority === priorityOption && "bg-accent"
            )}
          >
            <Flag
              className={cn("h-4 w-4", priorityConfig[priorityOption].color)}
            />
            <span className="flex-1">
              {priorityConfig[priorityOption].label}
            </span>
            {priority === priorityOption && (
              <span className="text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
