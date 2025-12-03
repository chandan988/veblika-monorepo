"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@workspace/ui/components/card";
import { Avatar } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Badge } from "@workspace/ui/components/badge";
import { Send, MoreVertical, User, X, Mail, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface Message {
  _id: string;
  senderType: "contact" | "agent" | "bot" | "system";
  senderId?: string;
  body: {
    text?: string;
    html?: string;
  };
  createdAt?: string;
  status?: string;
}

interface Contact {
  _id: string;
  name?: string;
  email?: string;
}

interface Conversation {
  _id: string;
  contactId: Contact;
  status: "open" | "pending" | "closed";
  channel: string;
  tags: string[];
  sourceMetadata?: {
    subject?: string;
    from?: string;
    to?: string;
  };
  threadId?: string;
}

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onUpdateConversation?: (updates: Partial<Conversation>) => void;
  isLoading?: boolean;
  isSending?: boolean;
  typingUsers?: string[];
}

export function MessageThread({
  conversation,
  messages,
  onSendMessage,
  onUpdateConversation,
  isLoading,
  isSending,
  typingUsers = [],
}: MessageThreadProps) {
  const [messageText, setMessageText] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (text: string) => {
    setMessageText(text);
  };

  const handleSend = () => {
    if (messageText.trim() && !isSending) {
      onSendMessage(messageText.trim());
      setMessageText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStatusChange = (status: "open" | "pending" | "closed") => {
    onUpdateConversation?.({ status });
  };

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className="h-16 w-64 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary font-semibold">
                {conversation.contactId?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
              </div>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {conversation.contactId?.name || "Anonymous Visitor"}
                </h3>
                {conversation.channel === "gmail" ? (
                  <Badge variant="outline" className="text-xs">
                    <Mail className="h-3 w-3 mr-1 text-red-600" />
                    Gmail
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1 text-blue-600" />
                    Web Chat
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {conversation.contactId?.email || "No email provided"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={conversation.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="text-sm border rounded-md px-3 py-1.5 bg-background"
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Gmail Subject Line */}
        {conversation.channel === "gmail" && conversation.sourceMetadata?.subject && (
          <div className="bg-muted/50 rounded-lg p-3 border">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground mb-1">Subject</p>
                <p className="text-sm font-medium">{conversation.sourceMetadata.subject}</p>
                {conversation.threadId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Thread ID: {conversation.threadId}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {conversation.tags?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {conversation.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => {
            const isAgent = message.senderType === "agent";
            const isSystem = message.senderType === "system";

            if (isSystem) {
              return (
                <div key={message._id} className="flex justify-center">
                  <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {message.body.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={message._id}
                className={`flex ${isAgent ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isAgent ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <div
                      className={`flex items-center justify-center h-full w-full ${
                        isAgent ? "bg-primary text-primary-foreground" : "bg-muted"
                      } font-semibold text-sm`}
                    >
                      {isAgent ? "A" : conversation.contactId?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  </Avatar>

                  <div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isAgent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.body.text}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 px-1">
                      {message.createdAt
                        ? format(new Date(message.createdAt), "HH:mm")
                        : "Sending..."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="flex gap-2 items-center">
                <Avatar className="h-8 w-8">
                  <div className="flex items-center justify-center h-full w-full bg-muted font-semibold text-sm">
                    {conversation.contactId?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={messageText}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="resize-none"
            rows={3}
            disabled={conversation.status === "closed"}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending || conversation.status === "closed"}
            size="icon"
            className="h-auto"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {conversation.status === "closed" && (
          <p className="text-xs text-muted-foreground mt-2">
            This conversation is closed. Reopen it to send messages.
          </p>
        )}
      </div>
    </Card>
  );
}
