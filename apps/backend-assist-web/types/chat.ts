export interface Contact {
    _id: string;
    name?: string;
    email?: string;
}

export interface Message {
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

export interface Conversation {
    _id: string;
    contactId: Contact;
    status: "open" | "pending" | "closed";
    priority: string;
    channel: "webchat" | "gmail";
    lastMessageAt: string;
    lastMessagePreview: string;
    tags: string[];
    assignedMemberId?: string | null;
    sourceMetadata?: {
        subject?: string;
        from?: string;
        to?: string;
    };
    threadId?: string;
}
