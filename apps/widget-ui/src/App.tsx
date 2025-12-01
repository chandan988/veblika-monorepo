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
import { Label } from "@workspace/ui/components/label"
import { socket } from "./lib/socket-client"

type Message = {
  text: string
  sender: "visitor" | "agent"
  timestamp: Date
  socketId?: string
}

type VisitorInfo = {
  name: string
  email: string
  phone: string
}

export default function App() {
  const searchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  )
  const integrationId = searchParams.get("integrationId")
  const orgId = searchParams.get("orgId")
  const sessionId = searchParams.get("sessionId")
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(socket.connected)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  
  // Load visitor info from localStorage if exists
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo>(() => {
    const saved = localStorage.getItem(`mychat_visitor_${sessionId}`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return { name: "", email: "", phone: "" }
      }
    }
    return { name: "", email: "", phone: "" }
  })
  
  // Show form only if no visitor info saved
  const [showForm, setShowForm] = useState(() => {
    const saved = localStorage.getItem(`mychat_visitor_${sessionId}`)
    return !saved
  })
  
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

  // Load conversation history from backend
  const loadConversationHistory = async () => {
    if (!sessionId || !integrationId) return
    
    setIsLoadingHistory(true)
    try {
      const response = await fetch(
        `http://localhost:8000/api/widget/conversation-history?sessionId=${sessionId}&integrationId=${integrationId}`
      )
      if (response.ok) {
        const data = await response.json()
        const history: Message[] = (data.data || []).map((msg: any) => ({
          text: msg.body?.text || "",
          sender: msg.senderType === "agent" ? "agent" : "visitor",
          timestamp: new Date(msg.createdAt || Date.now()),
          socketId: msg._id,
        }))
        setMessages(history)
        console.log("✅ Loaded conversation history:", history.length, "messages")
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    function onConnect() {
      setIsConnected(true)
      // Join widget room only if visitor info is submitted
      if (!showForm) {
        socket.emit("widget:join", {
          integrationId,
          orgId,
          sessionId,
          visitorInfo
        })
        // Load conversation history on connect
        loadConversationHistory()
      }
    }

    function onDisconnect() {
      setIsConnected(false)
    }

    function onWidgetConnected(data: any) {
      console.log("Widget connected:", data)
    }

    function onAgentMessage(data: any) {
      console.log("🔥 Agent message received:", data)
      console.log("🔥 Current sessionId:", sessionId)
      console.log("🔥 Socket connected:", isConnected)
      
      const message = data.message || data
      const newMessage: Message = {
        text: message.body?.text || message.text || "",
        sender: "agent",
        timestamp: new Date(message.createdAt || Date.now()),
        socketId: message._id,
      }
      
      // Check for duplicate messages
      setMessages((prev) => {
        const isDuplicate = prev.some(m => m.socketId === newMessage.socketId)
        if (isDuplicate) {
          console.log("⚠️ Duplicate message detected, skipping")
          return prev
        }
        console.log("✅ Adding new agent message to widget")
        return [...prev, newMessage]
      })

      // Increment unread count if chat is closed
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1)
      }
    }

    function onMessageConfirmed(data: any) {
      console.log("Message confirmed:", data)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("widget:connected", onWidgetConnected)
    socket.on("agent:message", onAgentMessage)
    socket.on("message:confirmed", onMessageConfirmed)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("widget:connected", onWidgetConnected)
      socket.off("agent:message", onAgentMessage)
      socket.off("message:confirmed", onMessageConfirmed)
    }
  }, [isOpen, integrationId, orgId, sessionId, showForm, visitorInfo])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (visitorInfo.name && visitorInfo.email && visitorInfo.phone) {
      // Save visitor info to localStorage
      localStorage.setItem(`mychat_visitor_${sessionId}`, JSON.stringify(visitorInfo))
      setShowForm(false)
      
      // Join widget room after form submission
      socket.emit("widget:join", {
        integrationId,
        orgId,
        sessionId,
        visitorInfo: {
          ...visitorInfo,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        }
      })
      
      // Load conversation history
      loadConversationHistory()
    }
  }

  const sendMessage = () => {
    if (input.trim()) {
      const newMessage: Message = {
        text: input,
        sender: "visitor",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMessage])
      socket.emit("visitor:message", {
        integrationId,
        orgId,
        sessionId,
        message: { text: input },
        visitorInfo: {
          ...visitorInfo,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
        },
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
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform"
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
          <DialogHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
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

          {/* Contact Form or Messages */}
          {showForm ? (
            <div className="flex-1 p-6 flex flex-col justify-center">
              <div className="text-center mb-6">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold mb-2">Welcome! 👋</h3>
                <p className="text-sm text-muted-foreground">
                  Please provide your details to start chatting
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={visitorInfo.name}
                    onChange={(e) => setVisitorInfo(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={visitorInfo.email}
                    onChange={(e) => setVisitorInfo(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={visitorInfo.phone}
                    onChange={(e) => setVisitorInfo(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!visitorInfo.name || !visitorInfo.email || !visitorInfo.phone}
                >
                  Start Chat
                </Button>
              </form>
            </div>
          ) : (
            <>
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
                      className={`flex flex-col ${msg.sender === "visitor" ? "items-end" : "items-start"
                        } animate-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div className="flex items-end gap-2 max-w-[85%]">
                        {msg.sender === "agent" && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                            A
                          </div>
                        )}
                        <div>
                          <Card
                            className={`p-3 ${msg.sender === "visitor"
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted border-muted"
                              }`}
                          >
                            <p className="text-sm break-all">{msg.text}</p>
                          </Card>
                          <p className="text-xs text-muted-foreground mt-1 px-1">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                        {msg.sender === "visitor" && (
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-xs font-bold shrink-0">
                            You
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t shrink-0 bg-background">
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
                    className="shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
