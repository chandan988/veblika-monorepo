"use client";

import { useRef, useEffect } from "react";
import { Card } from "@workspace/ui/components/card";
import { Avatar } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { MoreVertical, User, Mail, ExternalLink, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { Conversation, Message } from "@/types/chat";

interface MessageThreadGmailProps {
    conversation: Conversation;
    messages: Message[];
    onUpdateConversation?: (updates: Partial<Conversation>) => void;
    isLoading?: boolean;
}

export function MessageThreadGmail({
    conversation,
    messages,
    onUpdateConversation,
    isLoading,
}: MessageThreadGmailProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
                            <div className="flex items-center justify-center h-full w-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold">
                                {conversation.contactId?.name?.[0]?.toUpperCase() ||
                                    conversation.contactId?.email?.[0]?.toUpperCase() ||
                                    <User className="h-5 w-5" />}
                            </div>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">
                                    {conversation.contactId?.name || conversation.contactId?.email || "Unknown Sender"}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                    <Mail className="h-3 w-3 mr-1 text-red-600" />
                                    Gmail
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

                {/* Gmail Subject Line */}
                {conversation.sourceMetadata?.subject && (
                    <div className="bg-muted/50 rounded-lg p-3 border">
                        <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Subject</p>
                                <p className="text-sm font-medium">{conversation.sourceMetadata.subject}</p>
                                {conversation.threadId && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Thread ID: {conversation.threadId}
                                    </p>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" className="flex-shrink-0">
                                <ExternalLink className="h-4 w-4" />
                            </Button>
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
                                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                } font-semibold text-sm`}
                                        >
                                            {isAgent
                                                ? "A"
                                                : conversation.contactId?.name?.[0]?.toUpperCase() ||
                                                conversation.contactId?.email?.[0]?.toUpperCase() ||
                                                "?"}
                                        </div>
                                    </Avatar>

                                    <div>
                                        <div
                                            className={`rounded-lg px-4 py-2 ${isAgent
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                                }`}
                                        >
                                            {message.body.html ? (
                                                <div
                                                    className="text-sm prose prose-sm max-w-none dark:prose-invert"
                                                    dangerouslySetInnerHTML={{ __html: message.body.html }}
                                                />
                                            ) : (
                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                    {message.body.text}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 px-1">
                                            {message.createdAt
                                                ? format(new Date(message.createdAt), "PPp")
                                                : "Unknown time"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* No Reply Section - Gmail doesn't support replies yet */}
            <div className="p-4 border-t flex-shrink-0 bg-muted/20">
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Gmail conversations are read-only</p>
                        <p className="text-xs mt-1">
                            To reply to this email, please use your Gmail account directly.
                            Reply functionality will be available in a future update.
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
