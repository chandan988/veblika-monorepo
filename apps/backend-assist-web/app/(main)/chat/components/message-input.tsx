"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Send, Smile, Loader2 } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"

interface MessageInputProps {
  onSendMessage: (text: string) => void
  isSending?: boolean
  isDisabled?: boolean
  disabledMessage?: string
}

export function MessageInput({
  onSendMessage,
  isSending = false,
  isDisabled = false,
  disabledMessage,
}: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
    }
  }, [message])

  const handleSend = () => {
    if (message.trim() && !isSending && !isDisabled) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji: any) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage =
        message.substring(0, start) + emoji.native + message.substring(end)
      setMessage(newMessage)

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(
          start + emoji.native.length,
          start + emoji.native.length
        )
      }, 0)
    }
    setIsEmojiPickerOpen(false)
  }

  const canSend = message.trim() && !isSending && !isDisabled

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm">
      {disabledMessage && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mx-4 mt-2.5 mb-2 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-md border border-amber-200/50 dark:border-amber-800/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {disabledMessage}
        </div>
      )}

      <div className="flex items-end gap-2 p-4">
        {/* Message input container */}
        <div className="flex-1 relative">
          <div
            className={cn(
              "relative rounded-2xl transition-all duration-200",
              isFocused && "ring-2 ring-primary/20"
            )}
          >
            <Textarea
              ref={textareaRef}
              placeholder={
                isDisabled ? "Cannot send messages..." : "Type a message..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isDisabled}
              className={cn(
                "min-h-[42px] max-h-[120px] py-2.5 pl-4 pr-10 resize-none rounded-2xl",
                "bg-muted/60 border-0 focus-visible:ring-0",
                "placeholder:text-muted-foreground/60",
                "transition-all duration-200",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              rows={1}
            />

            {/* Emoji button inside input */}
            <Popover
              open={isEmojiPickerOpen}
              onOpenChange={setIsEmojiPickerOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 bottom-1 h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
                  disabled={isDisabled}
                  type="button"
                >
                  <Smile className="h-[18px] w-[18px]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-full p-0 border-0 shadow-xl"
                align="end"
                side="top"
                sideOffset={8}
              >
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                  previewPosition="none"
                  skinTonePosition="search"
                  searchPosition="sticky"
                  maxFrequentRows={1}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className={cn(
            "h-9 w-9 rounded-xl shrink-0",
            "transition-all duration-200 ease-out",
            canSend ? "scale-100 opacity-100" : "scale-90 opacity-50"
          )}
        >
          {isSending ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin" />
          ) : (
            <Send className="h-[18px] w-[18px]" />
          )}
        </Button>
      </div>
    </div>
  )
}
