"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

import { AtSign, Bell, Calendar, ChevronDown, Hash, ImageIcon, Music, Plus, Smile } from "lucide-react"

export function CreatePostForm() {
  const MAX = 2200
  const [tab, setTab] = React.useState<"post" | "reel" | "story">("post")
  const [text, setText] = React.useState("")
  const remaining = Math.max(0, MAX - text.length)

  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage alt="Profile avatar" src="/diverse-profile-avatars.png" />
              <AvatarFallback>PP</AvatarFallback>
            </Avatar>
            {/* instagram badge */}
            <span
              aria-hidden
              className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold"
            >
              ig
            </span>
          </div>
          <div>
            <p className="text-sm font-medium leading-none">Create Post</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 bg-transparent">
              Add Tags <ChevronDown className="h-4 w-4" aria-hidden />
              <span className="sr-only">Open add tags menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>Campaign</DropdownMenuItem>
            <DropdownMenuItem>Product</DropdownMenuItem>
            <DropdownMenuItem>Location</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Segmented tabs */}
        <div className="flex items-center gap-4">
          <Segmented
            value={tab}
            onValueChange={(v) => setTab(v as any)}
            items={[
              { value: "post", label: "Post" },
              { value: "reel", label: "Reel" },
              { value: "story", label: "Story" },
            ]}
          />
        </div>

        {/* Composer area with upload tile */}
        <div className="relative rounded-lg border bg-background">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What would you like to share?"
            className="min-h-56 resize-none border-0 focus-visible:ring-0"
          />
          {/* drag & drop tile */}
          <div className="pointer-events-none absolute left-4 top-4">
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-md border border-dashed bg-muted/50 text-center">
              <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" aria-hidden />
              <p className="text-xs text-muted-foreground">
                {"Drag & drop"}
                <br />
                {"or "}
                <span className="text-foreground font-medium">{"select a"}</span>
                <br />
                {"file"}
              </p>
            </div>
          </div>

          {/* toolbar */}
          <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
            <div className="flex items-center gap-1.5">
              <IconButton icon={<Plus className="h-4 w-4" />} label="Add" />
              <IconButton icon={<AtSign className="h-4 w-4" />} label="Mention" />
              <IconButton icon={<Smile className="h-4 w-4" />} label="Emoji" />
              <IconButton icon={<Hash className="h-4 w-4" />} label="Hashtag" />
            </div>
            <div className="text-xs">
              <span
                className={cn(
                  "inline-flex rounded-md border px-2 py-0.5",
                  remaining === 0 && "text-destructive border-destructive",
                )}
              >
                {remaining}
              </span>
            </div>
          </div>
        </div>

        {/* Stickers & notify */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground">Add Stickers</Label>
            <Button variant="secondary" size="sm" className="gap-2">
              <Music className="h-4 w-4" aria-hidden />
              Music
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-foreground">
                <Bell className="h-4 w-4" aria-hidden /> Notify Me
                <ChevronDown className="h-4 w-4" aria-hidden />
                <span className="sr-only">Open notify options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem>When scheduled</DropdownMenuItem>
              <DropdownMenuItem>When published</DropdownMenuItem>
              <DropdownMenuItem>On failures</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* First comment */}
        <div className="space-y-1">
          <Label htmlFor="first-comment" className="text-sm">
            First Comment
          </Label>
          <Input id="first-comment" placeholder="Add first comment" />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* When to post */}
        <div className="w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full sm:w-auto justify-between sm:justify-start gap-2">
                <Calendar className="h-4 w-4" aria-hidden />
                When to Post
                <span className="sr-only">Open schedule menu</span>
                <Separator orientation="vertical" className="mx-2 hidden sm:inline-flex" />
                <span className="text-muted-foreground">Next Available</span>
                <ChevronDown className="h-4 w-4 ml-1" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuItem>Next Available</DropdownMenuItem>
              <DropdownMenuItem>Choose Date & Time…</DropdownMenuItem>
              <DropdownMenuItem>Best Time Today</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Actions */}
        <div className="flex w-full sm:w-auto items-center gap-2">
          <Button variant="secondary" className="w-full sm:w-auto">
            Save as Draft
          </Button>

          {/* schedule primary with split-caret */}
          <div className="flex">
            <Button className="rounded-r-none">Schedule Post</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="rounded-l-none px-2" aria-label="More scheduling options">
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem>Schedule & auto-publish</DropdownMenuItem>
                <DropdownMenuItem>Schedule & manual publish</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

function IconButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={label}>
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function Segmented({
  value,
  onValueChange,
  items,
}: {
  value: string
  onValueChange: (v: string) => void
  items: { value: string; label: string }[]
}) {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} className="flex flex-wrap items-center gap-4">
      {items.map((it) => (
        <label key={it.value} className="flex cursor-pointer select-none items-center gap-2">
          <RadioGroupItem value={it.value} id={`seg-${it.value}`} />
          <span className="text-sm">{it.label}</span>
        </label>
      ))}
    </RadioGroup>
  )
}
