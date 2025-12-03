"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function IntegrationCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-md bg-muted/50 flex items-center justify-center">
            <Skeleton className="h-10 w-10 rounded-md" />
          </div>
          <div className="flex flex-col flex-1">
            <Skeleton className="h-4 w-36 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </Card>
  )
}
