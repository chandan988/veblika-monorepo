"use client"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { format } from "date-fns"
import type { Message, Attachment } from "@/types/chat"
import { cn } from "@workspace/ui/lib/utils"
import { CheckCheck, FileIcon, Download, Image as ImageIcon, File, FileText, FileVideo, FileAudio } from "lucide-react"
import { useState } from "react"

interface MessageBubbleProps {
  message: Message
  contactName?: string
  isConsecutive?: boolean
}

// Format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "Unknown size"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Get icon for file type
const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return <File className="h-5 w-5" />
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
  if (mimeType.startsWith("video/")) return <FileVideo className="h-5 w-5" />
  if (mimeType.startsWith("audio/")) return <FileAudio className="h-5 w-5" />
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text"))
    return <FileText className="h-5 w-5" />
  return <File className="h-5 w-5" />
}

// Image attachment component with lightbox
function ImageAttachment({ attachment }: { attachment: Attachment }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (!attachment.url) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <ImageIcon className="h-4 w-4" />
        <span>{attachment.name || "Image"}</span>
        <span className="text-xs">(Not downloaded)</span>
      </div>
    )
  }

  return (
    <>
      <div
        className="relative cursor-pointer group max-w-[200px] rounded-lg overflow-hidden"
        onClick={() => setIsOpen(true)}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={attachment.url}
          alt={attachment.name || "Image attachment"}
          className="w-full h-auto rounded-lg transition-transform group-hover:scale-105"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
            Click to view
          </span>
        </div>
      </div>

      {/* Lightbox */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={attachment.url}
              alt={attachment.name || "Image attachment"}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              className="absolute top-2 right-2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="absolute bottom-2 left-2 right-2 text-center text-white text-sm bg-black/50 rounded-lg p-2">
              {attachment.name}
              {attachment.size && ` • ${formatFileSize(attachment.size)}`}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// File attachment component
function FileAttachment({ attachment }: { attachment: Attachment }) {
  const handleDownload = () => {
    if (attachment.url) {
      window.open(attachment.url, "_blank")
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50",
        "hover:bg-muted/50 transition-colors",
        attachment.url && "cursor-pointer"
      )}
      onClick={handleDownload}
    >
      <div className="flex-shrink-0 p-2 bg-primary/10 text-primary rounded-lg">
        {getFileIcon(attachment.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {attachment.name || "Attachment"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size)}
          {!attachment.isDownloaded && !attachment.url && " • Not downloaded"}
        </p>
      </div>
      {attachment.url && (
        <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
    </div>
  )
}

// Attachments list component
function AttachmentsList({
  attachments,
  isAgent,
}: {
  attachments: Attachment[]
  isAgent: boolean
}) {
  const images = attachments.filter((a) => a.isImage)
  const files = attachments.filter((a) => !a.isImage)

  return (
    <div className="space-y-2 mt-2">
      {/* Image grid */}
      {images.length > 0 && (
        <div
          className={cn(
            "flex flex-wrap gap-2",
            isAgent ? "justify-end" : "justify-start"
          )}
        >
          {images.map((attachment, index) => (
            <ImageAttachment key={index} attachment={attachment} />
          ))}
        </div>
      )}

      {/* Files list */}
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((attachment, index) => (
            <FileAttachment key={index} attachment={attachment} />
          ))}
        </div>
      )}
    </div>
  )
}

export function MessageBubble({
  message,
  contactName,
  isConsecutive = false,
}: MessageBubbleProps) {
  const isAgent = message.senderType === "agent"
  const isSystem = message.senderType === "system"
  const hasAttachments = message.attachments && message.attachments.length > 0
  const hasText = message.body?.text && message.body.text.trim().length > 0

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full font-medium">
          {message.body.text}
        </div>
      </div>
    )
  }

  const getInitials = (name?: string) => {
    if (!name) return "?"
    return name.charAt(0).toUpperCase()
  }

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%] animate-in fade-in-0 slide-in-from-bottom-1 duration-200 group",
        isAgent ? "ml-auto flex-row-reverse" : "mr-auto",
        isConsecutive ? "mt-0.5" : "mt-4"
      )}
    >
      {/* Avatar */}
      {!isConsecutive && !isAgent ? (
        <Avatar className="h-8 w-8 shrink-0 mt-0.5">
          <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-semibold">
            {getInitials(contactName)}
          </AvatarFallback>
        </Avatar>
      ) : (
        !isAgent && <div className="w-8 shrink-0" />
      )}

      <div
        className={cn(
          "flex flex-col gap-0.5",
          isAgent ? "items-end" : "items-start"
        )}
      >
        {/* Message Bubble */}
        {hasText && (
          <div
            className={cn(
              "relative px-3 py-2 text-[13px] leading-relaxed transition-all min-w-20",
              "group-hover:shadow-md",
              isAgent
                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm"
                : "bg-muted/80 text-foreground rounded-2xl rounded-bl-md border border-border/40"
            )}
          >
            <p className="whitespace-pre-wrap wrap-break-word">
              {message.body.text}
            </p>
          </div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <AttachmentsList
            attachments={message.attachments!}
            isAgent={isAgent}
          />
        )}

        {/* Timestamp and Status */}
        <div
          className={cn(
            "flex items-center gap-1 px-2 text-[10px] font-medium",
            isAgent ? "flex-row-reverse" : "flex-row",
            "text-muted-foreground/60"
          )}
        >
          <span>
            {message.createdAt
              ? format(new Date(message.createdAt), "h:mm a")
              : "Sending..."}
          </span>
          {isAgent && message.createdAt && (
            <CheckCheck className="h-3 w-3 text-primary/60" />
          )}
        </div>
      </div>
    </div>
  )
}
