export interface Contact {
    _id: string;
    name?: string;
    email?: string;
}

export interface Attachment {
    url?: string; // S3 URL where the file is stored
    name?: string; // Original filename
    type?: string; // MIME type
    size?: number; // File size in bytes
    attachmentId?: string; // Gmail attachment ID
    s3Key?: string; // S3 object key
    thumbnailUrl?: string; // Thumbnail URL for images
    isImage?: boolean; // Quick check for image type
    isDownloaded?: boolean; // Whether attachment has been downloaded to S3
}

export interface Message {
    _id: string;
    senderType: "contact" | "agent" | "bot" | "system";
    senderId?: string;
    body: {
        text?: string;
        html?: string;
    };
    attachments?: Attachment[];
    createdAt?: string;
    status?: string;
}

export type Priority = "low" | "normal" | "high" | "urgent";

export interface Conversation {
    _id: string;
    contactId: Contact;
    status: "open" | "pending" | "closed";
    priority: Priority;
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
