import type React from "react";
import {
  MoreHorizontal,
  Info,
  Plus,
  ArrowUpRight,
  Youtube,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ChannelRow = {
  name: string;
  total: number | string;
  changePct?: number;
  newGained: number | string;
  posts: number | string;
  reach: number | string;
  engagements: number | string;
};

type PlatformSectionProps = {
  icon: React.ReactNode;
  name: string;
  rows: ChannelRow[];
  totalLabel: string; // e.g., "Total Followers/ Subscribers Count"
  newLabel: string; // e.g., "New Followers/ Subscribers Gained"
  postsLabel: string; // e.g., "NO. OF POSTS/ Videos"
};

function HeaderPill() {
  return (
    <Button variant="secondary" size="sm" className="h-8 gap-2">
      <Info className="h-4 w-4" aria-hidden="true" />
      <span className="text-sm">Overviews for the past 30 days</span>
    </Button>
  );
}

function Kebab() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground"
      aria-label="More options"
    >
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  );
}

function Growth({ changePct }: { changePct?: number }) {
  if (changePct == null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-chart-2">
      {changePct > 0 ? `+${changePct}%` : `${changePct}%`}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  );
}

function ColumnHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-sm font-medium text-muted-foreground">{children}</div>
  );
}

function RowContainer({
  children,
  className,
  roundedTop,
  roundedBottom,
}: {
  children: React.ReactNode;
  className?: string;
  roundedTop?: boolean;
  roundedBottom?: boolean;
}) {
  return (
    <div
      className={cn(
        // Mobile: stacked two column layout (label + value), md+: full row grid
        "grid grid-cols-2 md:grid-cols-6 items-start md:items-center bg-card",
        "data-[rounded=top]:rounded-t-lg data-[rounded=bottom]:rounded-b-lg",
        "gap-x-4 gap-y-0 md:gap-0 border",
        className
      )}
      data-rounded={roundedTop ? "top" : roundedBottom ? "bottom" : undefined}
      role="row"
    >
      {children}
    </div>
  );
}

function Cell({
  children,
  index,
  label,
}: {
  children: React.ReactNode;
  index: number;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "px-4 py-3 md:px-6 md:py-4",
        // on md+ show vertical separators between columns
        index !== 0 ? "md:border-l" : undefined,
        // on mobile, separate stacked items with top border when not the first
        index !== 0 ? "border-t md:border-t-0" : undefined
      )}
      role="cell"
    >
      {label ? (
        <div className="mb-1 text-xs text-muted-foreground md:hidden">
          {label}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function PlatformSection({
  icon,
  name,
  rows,
  totalLabel,
  newLabel,
  postsLabel,
}: PlatformSectionProps) {
  return (
    <Card className="border shadow-none gap-0 py-1 rounded-xl">
      <div className="flex items-start justify-between px-6 pt-4">
        <div className="flex items-center gap-3">
          <div aria-hidden="true">{icon}</div>
          <h3 className="text-lg font-semibold">{name}</h3>
        </div>
        <Kebab />
      </div>

      {/* Column headers */}
      <div className="mt-6 px-6">
        <div className="hidden md:grid md:grid-cols-6 ">
          <ColumnHeader>Channels</ColumnHeader>
          <ColumnHeader>
            <span className="block text-xs">Total Followers/</span>
            <span className="block text-xs">Subscribers Count</span>
          </ColumnHeader>
          <ColumnHeader>
            <span className="block text-xs">New Followers/</span>
            <span className="block text-xs">Subscribers Gained</span>
          </ColumnHeader>
          <ColumnHeader>
            <span className="block text-xs">NO. OF POSTS/</span>
            <span className="block text-xs">Videos</span>
          </ColumnHeader>
          <ColumnHeader>
            {" "}
            <span className="text-xs">Reach</span>
          </ColumnHeader>
          <ColumnHeader>
            {" "}
            <span className="text-xs">Engagements</span>
          </ColumnHeader>
        </div>
      </div>

      {/* Rows */}
      <div className="mt-3 px-6 pb-6">
        <div className="flex flex-col gap-0">
          {rows.map((r, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === rows.length - 1;
            return (
              <RowContainer
                key={r.name + idx}
                roundedTop={isFirst}
                roundedBottom={isLast}
              >
                <Cell index={0} label="Channels">
                  <div className="text-sm">{r.name}</div>
                </Cell>
                <Cell index={1} label={totalLabel}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{r.total}</span>
                    <Growth changePct={r.changePct} />
                  </div>
                </Cell>
                <Cell index={2} label={newLabel}>
                  <span className="text-sm">{r.newGained}</span>
                </Cell>
                <Cell index={3} label={postsLabel}>
                  <span className="text-sm">{r.posts}</span>
                </Cell>
                <Cell index={4} label="Reach">
                  <span className="text-sm">{r.reach}</span>
                </Cell>
                <Cell index={5} label="Engagements">
                  <span className="text-sm">{r.engagements}</span>
                </Cell>
              </RowContainer>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

export function BrandHealth() {
  const rows: ChannelRow[] = [
    {
      name: "Audfest",
      total: 7,
      changePct: 25,
      newGained: 0,
      posts: 0,
      reach: 0,
      engagements: 0,
    },
    {
      name: "Audfest",
      total: 7,
      changePct: 25,
      newGained: 0,
      posts: 0,
      reach: 0,
      engagements: 0,
    },
  ];

  return (
    <Card className="rounded-2xl shadow-none gap-2 border">
      <div className="flex items-center flex-col md:flex-row justify-between px-4 md:px-6">
        <h2 className="text-xl font-semibold">Brand health</h2>
        <HeaderPill />
      </div>

      <div className="space-y-4 px-2 md:px-2 pt-0">
        <PlatformSection
          icon={<Youtube className="h-6 w-6 text-destructive" />}
          name="Youtube"
          rows={rows}
          totalLabel="Total Followers/ Subscribers Count"
          newLabel="New Followers/ Subscribers Gained"
          postsLabel="NO. OF POSTS/ Videos"
        />

        <PlatformSection
          icon={<MessageCircle className="h-6 w-6 text-chart-2" />}
          name="Whatsapp"
          rows={rows}
          totalLabel="Total Followers/ Subscribers Count"
          newLabel="New Followers/ Subscribers Gained"
          postsLabel="NO. OF POSTS/ Videos"
        />

        <div className="pt-2">
          <Button variant="secondary" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add more channels
          </Button>
        </div>
      </div>
    </Card>
  );
}
