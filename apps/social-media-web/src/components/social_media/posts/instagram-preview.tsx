"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function InstagramPreview() {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">Instagram Preview</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" aria-label="More info" />
              </TooltipTrigger>
              <TooltipContent side="right">This is a preview of your post.</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex min-h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-6 text-center">
          <img src="/instagram-post-preview.jpg" alt="Instagram post preview placeholder" className="opacity-70" />
          <p className="text-muted-foreground">See your post&apos;s preview here</p>
        </div>
      </CardContent>
    </Card>
  )
}
