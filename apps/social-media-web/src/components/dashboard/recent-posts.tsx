"use client"

import * as React from "react"
import { MoreVertical } from "lucide-react"
import { Card } from "@/components/ui/card"

function PostCard({ platform, summary }: { platform: string; summary?: any }) {
  return (
    <Card className="h-full rounded-lg border p-4 min-w-[260px] sm:min-w-[300px] flex-shrink-0 snap-start md:min-w-0 md:w-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className={`h-6 w-6 rounded-md ${platform === "Youtube" ? "bg-red-500" : "bg-green-500"}`}
          />
          <div className="text-sm font-medium">{platform}</div>
        </div>
        <MoreVertical className="text-muted-foreground" />
      </div>

      <div className="mt-3 h-44 md:h-56 w-full rounded-md bg-muted/50" />

      <div className="mt-4 rounded-lg border bg-white p-3 text-sm flex flex-col">
        <div className="font-medium">Summary</div>
        <div className="mt-1 text-xs text-muted-foreground">Last 24 hours</div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground flex-1">
          <div>Likes</div>
          <div className="text-right font-medium text-foreground">17</div>
          <div>Dislikes</div>
          <div className="text-right font-medium text-foreground">17</div>
          <div>Comments</div>
          <div className="text-right font-medium text-foreground">17</div>
          <div>Engagements</div>
          <div className="text-right font-medium text-foreground">17</div>
        </div>
      </div>
    </Card>
  )
}

export function RecentPosts() {
  const posts = ["Youtube", "Whatsapp", "Youtube"]

  return (
    <section>
      <h3 className="text-xl font-semibold mb-4">Recent Posts</h3>

      <div className="-mx-3 px-3 md:mx-0 md:px-0">
        {/* mobile: horizontal snap scroller */}
        <div
          role="list"
          aria-label="Recent posts carousel"
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory md:hidden py-2 touch-pan-x"
        >
          {posts.map((p, idx) => (
            <div role="listitem" key={`${p}-${idx}`} className="w-[260px] sm:w-[300px] first:ml-1 last:mr-1">
              <PostCard platform={p} />
            </div>
          ))}
        </div>

        {/* md+ grid */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-4">
          {posts.map((p, idx) => (
            <PostCard key={`${p}-${idx}`} platform={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default RecentPosts
