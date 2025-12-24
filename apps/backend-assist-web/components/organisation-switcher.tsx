"use client"

import { useState } from "react"
import { Building2, ChevronDown, Plus, Check, LogOut } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@workspace/ui/components/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@workspace/ui/components/avatar"
import { useOrganisationStore, Organisation } from "@/stores/organisation-store"
import { useOrganisations, useSwitchOrganisation } from "@/hooks/use-organisations"
import { CreateOrganisationModal } from "./create-organisation-modal"

export function OrganisationSwitcher() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const { data: organisations = [], isLoading } = useOrganisations()
    const activeOrganisation = useOrganisationStore((s) => s.activeOrganisation)
    console.log(activeOrganisation, "Active organisaton")
    const switchOrganisation = useSwitchOrganisation()

    const handleSwitchOrganisation = (org: Organisation) => {
        switchOrganisation(org._id)
    }

    const getInitials = (name?: string) => {
        if (!name) return "??"
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "owner":
                return "bg-amber-500/10 text-amber-500"
            case "admin":
                return "bg-blue-500/10 text-blue-500"
            default:
                return "bg-gray-500/10 text-gray-500"
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 px-2 h-9 hover:bg-accent"
                    >
                        {activeOrganisation?.name ? (
                            <>
                                <Avatar className="h-6 w-6">
                                    {activeOrganisation.logo ? (
                                        <AvatarImage
                                            src={activeOrganisation.logo}
                                            alt={activeOrganisation.name}
                                        />
                                    ) : null}
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                        {getInitials(activeOrganisation.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden sm:inline-block font-medium text-sm max-w-[120px] truncate">
                                    {activeOrganisation.name}
                                </span>
                            </>
                        ) : (
                            <>
                                <Building2 className="h-4 w-4" />
                                <span className="hidden sm:inline-block text-sm text-muted-foreground">
                                    {isLoading ? "Loading..." : "Select Organisation"}
                                </span>
                            </>
                        )}
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                        Your Organisations
                    </DropdownMenuLabel>

                    {organisations.length === 0 && !isLoading && (
                        <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                            No organisations yet
                        </div>
                    )}

                    {organisations.map((org) => (
                        <DropdownMenuItem
                            key={org._id}
                            onClick={() => handleSwitchOrganisation(org)}
                            className="flex items-center gap-3 cursor-pointer py-2"
                        >
                            <Avatar className="h-8 w-8">
                                {org.logo ? (
                                    <AvatarImage src={org.logo} alt={org.name} />
                                ) : null}
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {getInitials(org.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{org.name}</p>
                                <p className="text-xs text-muted-foreground">/{org.slug}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${getRoleBadgeColor(
                                        org.role
                                    )}`}
                                >
                                    {org.role}
                                </span>
                                {activeOrganisation?._id === org._id && (
                                    <Check className="h-4 w-4 text-primary" />
                                )}
                            </div>
                        </DropdownMenuItem>
                    ))}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 cursor-pointer text-primary"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Create Organisation</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CreateOrganisationModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />
        </>
    )
}
