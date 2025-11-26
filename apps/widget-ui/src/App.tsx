"use client"
import { useEffect, useState, useRef, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Badge } from "@workspace/ui/components/badge"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Card } from "@workspace/ui/components/card"
import { socket } from "./lib/socket-client"

type Message = {
  text: string
  sender: "visitor" | "admin"
  timestamp: Date
  socketId?: string
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [unreadCount, setUnreadCount] = useState(0)
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  )
  const sessionId = searchParams.get("websiteId")
  const tenantId = searchParams.get("tenantId")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  // Send dimension updates to parent window
  useEffect(() => {
    if (window.parent !== window) {
      if (isOpen) {
        // Modal open dimensions
        window.parent.postMessage(
          {
            type: "MYCHAT_RESIZE",
            width: 420,
            height: 680,
          },
          "*"
        )
      } else {
        // Modal closed dimensions (just the floating button)
        window.parent.postMessage(
          {
            type: "MYCHAT_RESIZE",
            width: 80,
            height: 80,
          },
          "*"
        )
      }
    }
  }, [isOpen])

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
      // Join tenant room
      socket.emit("join:tenant", { sessionId, tenantId, userType: "visitor" })
    }

    function onDisconnect() {
      setIsConnected(false)
    }

    function onAdminMessage(data: any) {
      console.log("Admin Message received:", data)
      const newMessage: Message = {
        text: data.message,
        sender: "admin",
        timestamp: new Date(data.timestamp),
        socketId: data.socketId,
      }
      setMessages((prev) => [...prev, newMessage])

      // Increment unread count if chat is closed
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1)
      }
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("admin:message", onAdminMessage)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("admin:message", onAdminMessage)
    }
  }, [isOpen, sessionId, tenantId])

  const sendMessage = () => {
    if (input.trim()) {
      const newMessage: Message = {
        text: input,
        sender: "visitor",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
      socket.emit("visitor:message", {
        tenantId,
        message: input,
        sessionId,
      })
      setInput("")
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform relative"
        aria-label="Open chat"
      >
        <MessageCircle className="w-7 h-7" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Chat Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="w-[420px] h-[650px]"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <DialogHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                    }`}
                  />
                  <span>Chat with us</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {isConnected ? "Online" : "Offline"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-primary-foreground/20"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
            <p className="text-sm opacity-90 mt-1">
              We typically reply in a few minutes
            </p>
          </DialogHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground mt-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Start a conversation</p>
                  <p className="text-xs mt-1 opacity-70">We're here to help!</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.sender === "visitor" ? "items-end" : "items-start"
                  } animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className="flex items-end gap-2 max-w-[85%]">
                    {msg.sender === "admin" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                        A
                      </div>
                    )}
                    <div>
                      <Card
                        className={`p-3 ${
                          msg.sender === "visitor"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted border-muted"
                        }`}
                      >
                        <p className="text-sm break-words">{msg.text}</p>
                      </Card>
                      <p className="text-xs text-muted-foreground mt-1 px-1">
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                    {msg.sender === "visitor" && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold flex-shrink-0">
                        You
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t flex-shrink-0 bg-background">
            <div className="flex gap-2">
              <Input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                autoComplete="off"
                disabled={!isConnected}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || !isConnected}
                size="icon"
                aria-label="Send message"
                className="flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
