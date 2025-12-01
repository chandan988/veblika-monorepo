"use client";

import { Avatar } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Clock, Mail } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Conversation } from "@/types/chat";

interface ConversationItemGmailProps {
    conversation: Conversation;
    isSelected: boolean;
    onSelect: () => void;
}

export function ConversationItemGmail({
    conversation,
    isSelected,
    onSelect,
}: ConversationItemGmailProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "open":
                return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
            case "closed":
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
        }
    };

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${isSelected
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "hover:bg-muted/50 border-transparent"
                }`}
        >
            <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                    <div className="flex items-center justify-center h-full w-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold">
                        {conversation.contactId?.name?.[0]?.toUpperCase() ||
                            conversation.contactId?.email?.[0]?.toUpperCase() || "?"}
                    </div>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                        <p className="font-medium truncate text-sm">
                            {conversation.contactId?.name || conversation.contactId?.email || "Unknown Sender"}
                        </p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                        </span>
                    </div>

                    {/* Gmail Subject Line */}
                    {conversation.sourceMetadata?.subject && (
                        <p className="text-sm font-medium truncate mb-1">
                            {conversation.sourceMetadata.subject}
                        </p>
                    )}

                    <p className="text-sm text-muted-foreground truncate mb-2">
                        {conversation.lastMessagePreview || "No messages yet"}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`text-xs ${getStatusColor(conversation.status)}`}>
                            {conversation.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                            <Mail className="h-3 w-3" />
                            <span>Gmail</span>
                        </div>
                        {conversation.tags?.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </button>
    );
}
