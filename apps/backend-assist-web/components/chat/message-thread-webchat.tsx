"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@workspace/ui/components/card";
import { Avatar } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
import { Send, MoreVertical, User, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { startTyping, stopTyping } from "@/lib/socket-client";
import type { Conversation, Message } from "@/types/chat";

interface MessageThreadWebchatProps {
    conversation: Conversation;
    messages: Message[];
    onSendMessage: (text: string) => void;
    onUpdateConversation?: (updates: Partial<Conversation>) => void;
    isLoading?: boolean;
    isSending?: boolean;
}

export function MessageThreadWebchat({
    conversation,
    messages,
    onSendMessage,
    onUpdateConversation,
    isLoading,
    isSending,
}: MessageThreadWebchatProps) {
    const [messageText, setMessageText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

    return (
        <Card className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b space-y-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <div className="flex items-center justify-center h-full w-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-semibold">
                                {conversation.contactId?.name?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
                            </div>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">
                                    {conversation.contactId?.name || "Anonymous Visitor"}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                    <MessageSquare className="h-3 w-3 mr-1 text-blue-600" />
                                    Web Chat
                                </Badge>
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
                            className="text-sm border rounded-md px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
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

            {/* Messages - Fixed scrollbar */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
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
                                            className={`flex items-center justify-center h-full w-full ${isAgent
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                } font-semibold text-sm`}
                                        >
                                            {isAgent ? "A" : conversation.contactId?.name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    </Avatar>

                                    <div>
                                        <div
                                            className={`rounded-lg px-4 py-2 ${isAgent
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

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t flex-shrink-0">
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
