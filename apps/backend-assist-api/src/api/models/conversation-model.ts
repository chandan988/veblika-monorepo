import mongoose, { Document, Schema } from "mongoose"

export type Channel =
  | "gmail"
  | "imap"
  | "smtp"
  | "slack"
  | "whatsapp"
  | "webchat"
export type ConversationStatus = "open" | "pending" | "closed"
export type ClosedReason = 
  | "resolved" 
  | "spam" 
  | "duplicate" 
  | "no_response" 
  | "customer_request" 
  | "merged" 
  | "other"

export interface IConversation extends Document {
  orgId: mongoose.Types.ObjectId
  integrationId: mongoose.Types.ObjectId
  contactId: mongoose.Types.ObjectId

  channel: Channel
  status: ConversationStatus
  priority?: "low" | "normal" | "high" | "urgent"
  threadId?: string

  // Assignment tracking
  assignedMemberId?: string
  assignedBy?: string
  assignedAt?: Date
  
  tags: string[]

  lastMessageAt?: Date
  lastMessagePreview?: string

  // Closure tracking
  closedAt?: Date
  closedBy?: string
  closedReason?: ClosedReason
  
  sourceMetadata?: Record<string, any>
}

const conversationSchema = new Schema<IConversation>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "organization",
      required: true,
      index: true,
    },
    integrationId: {
      type: Schema.Types.ObjectId,
      ref: "integration",
      required: true,
      index: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "contact",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["gmail","webchat"],
      required: true,
    },
    threadId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "pending", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },
    assignedMemberId: {
      type: String,
      ref: "member",
      index: true,
    },
    assignedBy: {
      type: String,
      ref: "member",
    },
    assignedAt: {
      type: Date,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    lastMessageAt: {
      type: Date,
    },
    lastMessagePreview: {
      type: String,
    },
    closedAt: {
      type: Date,
    },
    closedBy: {
      type: String,
      ref: "member",
    },
    closedReason: {
      type: String,
      enum: ["resolved", "spam", "duplicate", "no_response", "customer_request", "merged", "other"],
    },
    sourceMetadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: "conversation",
  }
)

conversationSchema.index({ orgId: 1, contactId: 1 })
conversationSchema.index({ assignedMemberId: 1, status: 1 })
conversationSchema.index({ orgId: 1, channel: 1, threadId: 1 }, { unique: true, sparse: true })

export const Conversation = mongoose.model<IConversation>(
  "conversation",
  conversationSchema
)
