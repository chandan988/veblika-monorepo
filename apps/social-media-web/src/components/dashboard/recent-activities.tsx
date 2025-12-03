"use client";

import * as React from "react";
import { Edit, Tag, Plus, Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Activity = {
  id: string;
  userName: string;
  avatar?: string;
  network?: string;
  img?: string;
  caption?: string;
  tags?: string[];
  createdAt?: string;
  time?: string;
};

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="md:flex md:items-start md:gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {activity.avatar ? (
              <AvatarImage src={activity.avatar} alt={activity.userName} />
            ) : (
              <AvatarFallback>{activity.userName?.slice(0, 2)}</AvatarFallback>
            )}
          </Avatar>
        </div>

        <div className="mt-3 md:mt-0 md:flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium">{activity.userName}</div>
            </div>

            <div className="ml-2 hidden md:block">
              <button
                aria-label="Edit"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-muted/50 text-muted-foreground hover:bg-muted"
              >
                <Edit className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-3 h-44 md:h-36 w-full rounded-md bg-muted/50 overflow-hidden">
            <img
              src={activity.img}
              className="h-full w-full object-cover rounded-md"
              alt=""
            />
          </div>

          <textarea
            readOnly
            value={activity.caption ?? ""}
            className="mt-3 w-full rounded-md border p-2 text-sm focus:outline-none"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(activity.tags ?? []).map((t) => (
              <span
                key={t}
                className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-700"
              >
                {t}
              </span>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm">
                <Plus className="size-4" />
                Add a note
              </button>
              <button className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-3 py-1 text-sm text-white">
                <Send className="size-4" />
                Post now
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div>Created: {activity.createdAt ?? "Today, 3 October"}</div>
            <div>{activity.time ?? "4:43 PM"}</div>
          </div>
        </div>

        {/* edit button for small screens */}
        <div className="mt-3 md:hidden">
          <button
            aria-label="Edit"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-muted/50 text-muted-foreground hover:bg-muted"
          >
            <Edit className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecentActivities({ className }: { className?: string }) {
  const [tab, setTab] = React.useState<"queue" | "drafts" | "approvals">(
    "queue"
  );

  const activities: Activity[] = [
    {
      id: "1",
      userName: "Username",
      caption: "the caption for the post",
      img: "https://i.pinimg.com/1200x/15/67/ff/1567fffcc5c0acc93549aacf9cda3b10.jpg",
      tags: ["some tag"],
    },
    {
      id: "2",
      userName: "Username",
      caption: "the caption for the post",
      img: "https://i.pinimg.com/1200x/c0/f0/9c/c0f09c09f8c7f143361f9a6a61e21eb5.jpg",
      tags: ["some tag"],
    },
  ];

  return (
    <div className={cn("rounded-lg border bg-white p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Activities</h3>
        <div className="text-muted-foreground">⋯</div>
      </div>

      <div className="mt-4 border-b">
        <nav className="flex gap-6">
          <button
            onClick={() => setTab("queue")}
            className={cn(
              "relative pb-3 text-sm",
              tab === "queue" && "text-orange-600"
            )}
          >
            Queue
            {tab === "queue" && (
              <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-orange-500" />
            )}
            <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white text-xs">
              1
            </span>
          </button>

          <button onClick={() => setTab("drafts")} className="text-sm">
            Drafts{" "}
            <span className="ml-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted/50 text-xs">
              0
            </span>
          </button>

          <button onClick={() => setTab("approvals")} className="text-sm">
            Approvals
          </button>
        </nav>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {activities.map((a) => (
          <ActivityCard key={a.id} activity={a} />
        ))}
      </div>
    </div>
  );
}

export default RecentActivities;
