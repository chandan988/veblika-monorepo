import mongoose, { Document, Schema } from "mongoose"

export type MessageSenderType = "contact" | "agent" | "bot" | "system"
export type MessageDirection = "inbound" | "outbound"
export type Channel =
  | "gmail"
  | "imap"
  | "smtp"
  | "slack"
  | "whatsapp"
  | "webchat"
export type MessageContentType = "text" | "html" | "markdown"
export type MessageStatus = "sent" | "delivered" | "read" | "failed" | "pending"

export interface IAttachment {
  url: string
  name: string
  type: string
  size: number
}

export interface IMessage extends Document {
  orgId: mongoose.Types.ObjectId
  conversationId: mongoose.Types.ObjectId

  // Sender info
  senderType: MessageSenderType
  senderId?: mongoose.Types.ObjectId | string // Member Id or contact Id

  direction: MessageDirection
  channel: MessageChannel

  body?: Record<any, any>
  attachments: IAttachment[]

  // Status tracking
  status?: MessageStatus
  deliveredAt?: Date
  readAt?: Date

  // Metadata
  metadata?: Record<string, any>
}

const attachmentSchema = new Schema<IAttachment>(
  {
    url: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
)

const messageSchema = new Schema<IMessage>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "organization",
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "conversation",
      required: true,
      index: true,
    },
    senderType: {
      type: String,
      enum: ["contact", "agent", "bot", "system"],
      required: true,
    },
    senderId: {
      type: Schema.Types.Mixed,
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    channel: {
      type: String,
      enum: ["gmail", "imap", "smtp", "slack", "whatsapp", "webchat"],
      required: true,
    },
    body: {
      type: Schema.Types.Mixed,
    },
    attachments: [attachmentSchema],
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed", "pending"],
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: "message",
  }
)

// messageSchema.index({ orgId: 1, conversationId: 1, createdAt: 1 })
// messageSchema.index({ orgId: 1, inboxId: 1, createdAt: -1 })
// messageSchema.index({ externalId: 1 }, { sparse: true })
// messageSchema.index({ externalMessageId: 1 }, { sparse: true })
// messageSchema.index({ senderType: 1, senderId: 1 })

export const Message = mongoose.model<IMessage>("message", messageSchema)
