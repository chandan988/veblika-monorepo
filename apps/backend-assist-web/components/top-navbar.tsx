"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, MessageSquare, Plus, Settings } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { useMutation, useQuery } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"

const menuItems = [
    { name: "Dashboard", href: "/" },
    { name: "Ticket", href: "/ticket" },
    { name: "Chat", href: "/chat" },
    { name: "Analytics", href: "/analytics" },
    { name: "Contacts", href: "/contacts" },
    { name: "Organisation", href: "/organisation" },
    { name: "Integrations", href: "/integrations" },
    { name: "Knowledge Base", href: "/knowledge-base" },
]

export function TopNavbar() {
    const { data } = useQuery({
        queryKey: ['session'],
        queryFn: () => authClient.getSession()
    })
    const mutation = useMutation({
        mutationFn: async () => {
            await authClient.signOut()
        },
        onSuccess: () => {
            window.location.href = '/sign-in'
        }
    })
    const user = data?.data?.user
    const session = data?.data?.session
    const error = data?.error
    const pathname = usePathname()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-4 gap-6">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">V</span>
                    </div>
                </Link>

                {/* Navigation Menu */}
                <nav className="flex items-center gap-1 flex-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                    ? "text-foreground bg-accent"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="flex items-center gap-3">
                    {user && (
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-medium">{user.name || 'User'}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user?.image || '/avatar.png'} alt={user?.name || 'User'} />
                                    <AvatarFallback>
                                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            {user && (
                                <div className="flex flex-col space-y-1 p-2">
                                    <p className="text-sm font-medium">{user.name || 'User'}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                            )}
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => mutation.mutate()}
                                disabled={mutation.isPending}
                            >
                                {mutation.isPending ? 'Logging out...' : 'Logout'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="px-4 pb-3 md:hidden">
                <input
                    type="search"
                    placeholder="Search"
                    className="w-full px-3 py-2 text-sm border rounded-md"
                />
            </div>
        </header>
    )
}
