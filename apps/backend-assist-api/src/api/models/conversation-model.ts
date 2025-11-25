import mongoose, { Document, Schema } from "mongoose"

export type Channel =
  | "gmail"
  | "imap"
  | "smtp"
  | "slack"
  | "whatsapp"
  | "webchat"
export type ConversationStatus = "open" | "pending" | "closed"

export interface IConversation extends Document {
  orgId: mongoose.Types.ObjectId
  integrationId: mongoose.Types.ObjectId
  contactId: mongoose.Types.ObjectId

  channel: Channel
  status: ConversationStatus
  priority?: "low" | "normal" | "high" | "urgent"

  assignedMemberId?: string
  tags: string[]

  lastMessageAt?: Date
  lastMessagePreview?: string

  closedAt?: Date
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
      enum: ["email", "chat", "slack", "whatsapp"],
      required: true,
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
  },
  {
    timestamps: true,
    collection: "conversation",
  }
)

// conversationSchema.index({ orgId: 1, inboxId: 1, status: 1, lastMessageAt: -1 })
// conversationSchema.index({ orgId: 1, contactId: 1 })
// conversationSchema.index({ assignedMemberId: 1, status: 1 })
// conversationSchema.index(
//   { integrationId: 1, externalThreadId: 1 },
//   { unique: true, sparse: true }
// )

export const Conversation = mongoose.model<IConversation>(
  "conversation",
  conversationSchema
)
