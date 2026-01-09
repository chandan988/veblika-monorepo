"use client"

import { Check, ChevronDown } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Label } from "@workspace/ui/components/label"

export type ClosedReason = 
  | "resolved" 
  | "spam" 
  | "duplicate" 
  | "no_response" 
  | "customer_request" 
  | "merged" 
  | "other"

interface ClosedReasonDropdownProps {
  /** Current closed reason */
  value?: ClosedReason
  /** Callback when reason changes */
  onChange: (reason: ClosedReason) => void
  /** Disable the dropdown */
  disabled?: boolean
  /** Show label */
  showLabel?: boolean
  /** Custom className */
  className?: string
  /** Required field */
  required?: boolean
}

const reasonConfig: Record<ClosedReason, { label: string; description?: string }> = {
  resolved: {
    label: "Resolved",
    description: "Issue was fixed and customer is satisfied",
  },
  spam: {
    label: "Spam",
    description: "Marked as spam or irrelevant",
  },
  duplicate: {
    label: "Duplicate",
    description: "Duplicate of another ticket",
  },
  no_response: {
    label: "No Response",
    description: "Customer did not respond",
  },
  customer_request: {
    label: "Customer Request",
    description: "Customer requested to close",
  },
  merged: {
    label: "Merged",
    description: "Merged with another ticket",
  },
  other: {
    label: "Other",
    description: "Other reason",
  },
}

export function ClosedReasonDropdown({
  value,
  onChange,
  disabled = false,
  showLabel = true,
  className,
  required = false,
}: ClosedReasonDropdownProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <Label htmlFor="closed-reason">
          Closed Reason {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      <Select
        value={value}
        onValueChange={(val) => onChange(val as ClosedReason)}
        disabled={disabled}
      >
        <SelectTrigger id="closed-reason" className="w-full">
          <SelectValue placeholder="Select reason for closing" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(reasonConfig) as ClosedReason[]).map((reasonKey) => {
            const config = reasonConfig[reasonKey]
            return (
              <SelectItem key={reasonKey} value={reasonKey}>
                <div className="flex flex-col">
                  <span className="font-medium">{config.label}</span>
                  {config.description && (
                    <span className="text-xs text-muted-foreground">
                      {config.description}
                    </span>
                  )}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}

export function getClosedReasonLabel(reason?: ClosedReason): string {
  if (!reason) return "No reason specified"
  return reasonConfig[reason]?.label || reason
}

export function getClosedReasonConfig(reason?: ClosedReason) {
  if (!reason) return null
  return reasonConfig[reason]
}
