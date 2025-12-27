"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, User, UserX } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Input } from "@workspace/ui/components/input"
import { useMembers } from "@/hooks/use-members"
import type { Member } from "@/services/member-api"

interface AssignmentDropdownProps {
  /** Current assigned member ID */
  assignedMemberId?: string | null
  /** Callback when assignment changes */
  onAssign: (memberId: string | null) => void
  /** Show compact version (just avatar) */
  compact?: boolean
  /** Disable the dropdown */
  disabled?: boolean
  /** Custom trigger className */
  className?: string
}

export function AssignmentDropdown({
  assignedMemberId,
  onAssign,
  compact = false,
  disabled = false,
  className,
}: AssignmentDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const { data: members = [], isLoading } = useMembers()

  // Find the currently assigned member
  const assignedMember = members.find(
    (member) => member._id === assignedMemberId
  )

  const getInitials = (name?: string) => {
    if (!name) return "?"
    const parts = name.split(" ")
    if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const handleSelect = (memberId: string | null) => {
    onAssign(memberId)
    setOpen(false)
    setSearch("")
  }

  // Filter members by search
  const filteredMembers = members.filter((member) => {
    if (!search) return true
    const name = member.user?.name?.toLowerCase() || ""
    const email = member.user?.email?.toLowerCase() || ""
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase())
  })

  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "h-8 w-8 p-0 hover:bg-muted",
              className
            )}
          >
            {assignedMember ? (
              <Avatar className="h-7 w-7 border border-border/50">
                {assignedMember.user?.image && (
                  <AvatarImage
                    src={assignedMember.user.image}
                    alt={assignedMember.user?.name || "Assigned"}
                  />
                )}
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(assignedMember.user?.name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="h-7 w-7 border border-dashed border-muted-foreground/50">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <UserX className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
          <AssignmentList
            members={filteredMembers}
            assignedMemberId={assignedMemberId}
            isLoading={isLoading}
            search={search}
            onSearchChange={setSearch}
            onSelect={handleSelect}
            getInitials={getInitials}
          />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-[200px] justify-between",
            !assignedMember && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {assignedMember ? (
              <>
                <Avatar className="h-5 w-5">
                  {assignedMember.user?.image && (
                    <AvatarImage
                      src={assignedMember.user.image}
                      alt={assignedMember.user?.name || "Assigned"}
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {getInitials(assignedMember.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{assignedMember.user?.name || "Unknown"}</span>
              </>
            ) : (
              <>
                <User className="h-4 w-4" />
                <span>Unassigned</span>
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <AssignmentList
          members={filteredMembers}
          assignedMemberId={assignedMemberId}
          isLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
          onSelect={handleSelect}
          getInitials={getInitials}
        />
      </PopoverContent>
    </Popover>
  )
}

// Internal component for the assignment list
interface AssignmentListProps {
  members: Member[]
  assignedMemberId?: string | null
  isLoading: boolean
  search: string
  onSearchChange: (search: string) => void
  onSelect: (memberId: string | null) => void
  getInitials: (name?: string) => string
}

function AssignmentList({
  members,
  assignedMemberId,
  isLoading,
  search,
  onSearchChange,
  onSelect,
  getInitials,
}: AssignmentListProps) {
  return (
    <div className="flex flex-col">
      <div className="p-2 border-b">
        <Input
          placeholder="Search members..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8"
        />
      </div>
      <ScrollArea className="h-[250px]">
        <div className="p-1">
          {/* Unassigned option */}
          <button
            onClick={() => onSelect(null)}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-1.5 rounded-sm hover:bg-accent text-sm",
              !assignedMemberId && "bg-accent"
            )}
          >
            <Avatar className="h-6 w-6 border border-dashed border-muted-foreground/50">
              <AvatarFallback className="bg-muted text-muted-foreground">
                <UserX className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
            <span>Unassigned</span>
            <Check
              className={cn(
                "ml-auto h-4 w-4",
                !assignedMemberId ? "opacity-100" : "opacity-0"
              )}
            />
          </button>

          {/* Separator */}
          <div className="my-1 -mx-1 h-px bg-border" />

          {/* Team members */}
          {isLoading ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              {search ? "No members found." : "No team members."}
            </div>
          ) : (
            members.map((member) => (
              <button
                key={member._id}
                onClick={() => onSelect(member._id)}
                className={cn(
                  "flex items-center gap-2 w-full px-2 py-1.5 rounded-sm hover:bg-accent text-sm",
                  assignedMemberId === member._id && "bg-accent"
                )}
              >
                <Avatar className="h-6 w-6">
                  {member.user?.image && (
                    <AvatarImage
                      src={member.user.image}
                      alt={member.user?.name || "Member"}
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {getInitials(member.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 items-start">
                  <span className="truncate text-sm">
                    {member.user?.name || "Unknown"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {member.user?.email}
                  </span>
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4 shrink-0",
                    assignedMemberId === member._id ? "opacity-100" : "opacity-0"
                  )}
                />
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
