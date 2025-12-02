"use client"
import { useEffect, useState, useRef, useMemo, useCallback } from "react"
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
import { Label } from "@workspace/ui/components/label"
import { User } from "lucide-react"
import { getSocket, connectSocket, disconnectSocket } from "./lib/socket-client"

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
  const [isConnected, setIsConnected] = useState(false)
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
  const hasJoinedRoom = useRef(false)

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
  const loadConversationHistory = useCallback(async () => {
    if (!sessionId || !integrationId) return

    setIsLoadingHistory(true)
    try {
      const url =
        import.meta.env.VITE_BACKEND_API_URL || "http://localhost:8000/"
      const response = await fetch(
        `${url}api/v1/widget/conversation-history?sessionId=${sessionId}&integrationId=${integrationId}`
      )
      if (response.ok) {
        const data = await response.json()
        const history: Message[] = (data.data || []).map(
          (msg: {
            body?: { text?: string }
            senderType?: string
            createdAt?: string
            _id?: string
          }) => ({
            text: msg.body?.text || "",
            sender: msg.senderType === "agent" ? "agent" : "visitor",
            timestamp: new Date(msg.createdAt || Date.now()),
            socketId: msg._id,
          })
        )

        setMessages(history)
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [sessionId, integrationId])

  // Socket connection management - only connect when dialog is open
  useEffect(() => {
    if (!isOpen || !integrationId || !orgId || !sessionId) {
      return
    }

    // Connect socket when dialog opens
    const socket = connectSocket()

    function onConnect() {
      setIsConnected(true)
      
      // Join widget room after connection
      if (!showForm && !hasJoinedRoom.current) {
        socket.emit("widget:join", {
          integrationId,
          orgId,
          sessionId,
          visitorInfo: {
            ...visitorInfo,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
          },
        })
        hasJoinedRoom.current = true
        
        // Load conversation history after joining
        loadConversationHistory()
      }
    }

    function onDisconnect() {
      setIsConnected(false)
      hasJoinedRoom.current = false
    }

    function onWidgetConnected() {
      // Widget successfully connected to room
    }

    function onAgentMessage(data: {
      message?: {
        body?: { text?: string }
        text?: string
        createdAt?: string
        _id?: string
      }
      body?: { text?: string }
      text?: string
      createdAt?: string
      _id?: string
    }) {
      const message = data.message || data
      const newMessage: Message = {
        text: message.body?.text || message.text || "",
        sender: "agent",
        timestamp: new Date(message.createdAt || Date.now()),
        socketId: message._id,
      }

      // Check for duplicate messages
      setMessages((prev) => {
        const isDuplicate = prev.some((m) => m.socketId === newMessage.socketId)
        if (isDuplicate) {
          return prev
        }
        return [...prev, newMessage]
      })

      // Increment unread count if chat is closed
      if (!isOpen) {
        setUnreadCount((prev) => prev + 1)
      }
    }

    function onMessageConfirmed() {
      // Message delivery confirmed
    }

    // Setup event listeners
    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("widget:connected", onWidgetConnected)
    socket.on("agent:message", onAgentMessage)
    socket.on("message:confirmed", onMessageConfirmed)

    // If already connected, trigger connect handler
    if (socket.connected) {
      onConnect()
    }

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("widget:connected", onWidgetConnected)
      socket.off("agent:message", onAgentMessage)
      socket.off("message:confirmed", onMessageConfirmed)
      
      // Disconnect socket when dialog closes to save resources
      disconnectSocket()
      hasJoinedRoom.current = false
    }
  }, [isOpen, integrationId, orgId, sessionId, showForm, visitorInfo, loadConversationHistory])

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (visitorInfo.name && visitorInfo.email && visitorInfo.phone) {
      // Save visitor info to localStorage
      localStorage.setItem(
        `mychat_visitor_${sessionId}`,
        JSON.stringify(visitorInfo)
      )
      setShowForm(false)

      // Join widget room after form submission
      const socket = getSocket()
      if (socket.connected && !hasJoinedRoom.current) {
        socket.emit("widget:join", {
          integrationId,
          orgId,
          sessionId,
          visitorInfo: {
            ...visitorInfo,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
          },
        })
        hasJoinedRoom.current = true
        
        // Load conversation history after joining
        loadConversationHistory()
      }
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
      
      const socket = getSocket()
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
          className="w-[420px] h-[650px] p-0 flex flex-col gap-0 overflow-hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {/* Header */}
          <DialogHeader className="bg-primary text-primary-foreground p-4 shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                  }`}
                />
                <span className="text-base font-semibold">Chat with us</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  {isConnected ? "Online" : "Offline"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsOpen(false)
                  setUnreadCount(0)
                }}
                className="hover:bg-primary-foreground/20 -mr-2"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogTitle>
            
            {!showForm && visitorInfo.name ? (
              <div className="mt-3 pt-3 border-t border-primary-foreground/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{visitorInfo.name}</p>
                    <div className="flex items-center gap-2 text-xs opacity-80 mt-0.5">
                      {visitorInfo.email && (
                        <span className="truncate">{visitorInfo.email}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : !showForm ? null : (
              <p className="text-sm opacity-90 mt-2">
                We typically reply in a few minutes
              </p>
            )}
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
                    onChange={(e) =>
                      setVisitorInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
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
                    onChange={(e) =>
                      setVisitorInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
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
                    onChange={(e) =>
                      setVisitorInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !visitorInfo.name ||
                    !visitorInfo.email ||
                    !visitorInfo.phone
                  }
                >
                  Start Chat
                </Button>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
                <div className="p-4 space-y-3">
                  {isLoadingHistory ? (
                    <div className="text-center text-muted-foreground mt-8">
                      <div className="w-12 h-12 mx-auto mb-2 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm">Loading conversation...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Start a conversation</p>
                      <p className="text-xs mt-1 opacity-70">
                        We're here to help!
                      </p>
                    </div>
                  ) : null}
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.sender === "visitor" ? "justify-end" : "justify-start"
                      } animate-in slide-in-from-bottom-2 duration-200`}
                    >
                      <div className={`flex items-end gap-2 max-w-[80%] ${
                        msg.sender === "visitor" ? "flex-row-reverse" : "flex-row"
                      }`}>
                        {msg.sender === "agent" ? (
                          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0 mb-5">
                            A
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0 mb-5">
                            Y
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 shadow-sm ${
                              msg.sender === "visitor"
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted border border-border rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm leading-relaxed wrap-break-word">{msg.text}</p>
                          </div>
                          <p className={`text-xs text-muted-foreground px-2 ${
                            msg.sender === "visitor" ? "text-right" : "text-left"
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t shrink-0 bg-background">
                <div className="flex items-center gap-2">
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
