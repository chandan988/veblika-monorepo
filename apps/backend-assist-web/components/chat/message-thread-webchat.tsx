"use client"

import { useState, useRef, useEffect } from "react"
import { Card } from "@workspace/ui/components/card"
import { Avatar } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { Textarea } from "@workspace/ui/components/textarea"
import { Badge } from "@workspace/ui/components/badge"
import { Send, MoreVertical, User, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import type { Conversation, Message } from "@/types/chat"

interface MessageThreadWebchatProps {
  conversation: Conversation
  messages: Message[]
  onSendMessage: (text: string) => void
  onUpdateConversation?: (updates: Partial<Conversation>) => void
  isLoading?: boolean
  isSending?: boolean
}

export function MessageThreadWebchat({
  conversation,
  messages,
  onSendMessage,
  onUpdateConversation,
  isLoading,
  isSending,
}: MessageThreadWebchatProps) {
  const [messageText, setMessageText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleInputChange = (text: string) => {
    setMessageText(text)
  }

  const handleSend = () => {
    if (messageText.trim() && !isSending) {
      onSendMessage(messageText.trim())
      setMessageText("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleStatusChange = (status: "open" | "pending" | "closed") => {
    onUpdateConversation?.({ status })
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border-2 border-background shadow-sm">
              <div className="flex items-center justify-center h-full w-full bg-linear-to-br from-blue-500 to-blue-600 text-white font-semibold">
                {conversation.contactId?.name?.[0]?.toUpperCase() || (
                  <User className="h-5 w-5" />
                )}
              </div>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base truncate">
                  {conversation.contactId?.name || "Anonymous Visitor"}
                </h3>
                <Badge variant="outline" className="text-xs shrink-0">
                  <MessageSquare className="h-3 w-3 mr-1 text-blue-600" />
                  Web
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground/80 truncate">
                {conversation.contactId?.email || "No email provided"}
              </p>
              {conversation.tags?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  {conversation.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs px-2 py-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {conversation.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{conversation.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={conversation.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="text-sm border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages - Fixed scrollbar */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0 bg-muted/10">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <div className="w-12 h-12 mx-auto mb-3 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-16 w-16 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1 opacity-70">Start the conversation</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message) => {
              const isAgent = message.senderType === "agent"
              const isSystem = message.senderType === "system"

              if (isSystem) {
                return (
                  <div key={message._id} className="flex justify-center">
                    <div className="text-xs text-muted-foreground bg-muted/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      {message.body.text}
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={message._id}
                  className={`flex ${isAgent ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-200`}
                >
                  <div
                    className={`flex gap-2.5 max-w-[75%] ${isAgent ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="h-8 w-8 shrink-0 mt-1">
                      <div
                        className={`flex items-center justify-center h-full w-full ${
                          isAgent
                            ? "bg-primary text-primary-foreground"
                            : "bg-linear-to-br from-blue-500 to-blue-600 text-white"
                        } font-semibold text-sm shadow-sm`}
                      >
                        {isAgent
                          ? "A"
                          : conversation.contactId?.name?.[0]?.toUpperCase() ||
                            "?"}
                      </div>
                    </Avatar>

                    <div className="flex flex-col gap-1">
                      <div
                        className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                          isAgent
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card border border-border rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">
                          {message.body.text}
                        </p>
                      </div>
                      <p
                        className={`text-xs text-muted-foreground/70 px-2 ${
                          isAgent ? "text-right" : "text-left"
                        }`}
                      >
                        {message.createdAt
                          ? format(new Date(message.createdAt), "HH:mm")
                          : "Sending..."}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background shrink-0">
        <div className="flex gap-3 items-end">
          <Textarea
            placeholder={
              conversation.status === "closed"
                ? "Conversation is closed..."
                : "Type your message..."
            }
            value={messageText}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="resize-none min-h-[44px] max-h-32 rounded-xl"
            rows={1}
            disabled={conversation.status === "closed"}
          />
          <Button
            onClick={handleSend}
            disabled={
              !messageText.trim() ||
              isSending ||
              conversation.status === "closed"
            }
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {conversation.status === "closed" && (
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-500" />
            This conversation is closed. Change status to send messages.
          </p>
        )}
        {isSending && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Sending...
          </p>
        )}
      </div>
    </Card>
  )
}
