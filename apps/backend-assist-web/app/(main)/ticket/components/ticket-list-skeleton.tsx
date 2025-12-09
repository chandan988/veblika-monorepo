"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"

export function TicketListSkeleton() {
    return (
        <div className="space-y-0 divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <div className="flex gap-1">
                            <Skeleton className="h-8 w-8 rounded" />
                            <Skeleton className="h-8 w-8 rounded" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
