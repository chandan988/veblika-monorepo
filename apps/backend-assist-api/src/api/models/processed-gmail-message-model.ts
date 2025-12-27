import mongoose, { Document, Schema } from "mongoose"

/**
 * Processed Gmail Message model for idempotency
 * Prevents duplicate processing of the same Gmail message
 * Automatically expires after 7 days to keep the collection manageable
 */
export interface IProcessedGmailMessage extends Document {
  gmailMessageId: string
  emailAddress: string
  processedAt: Date
  orgId: mongoose.Types.ObjectId
  conversationId?: mongoose.Types.ObjectId
  messageId?: mongoose.Types.ObjectId
}

const processedGmailMessageSchema = new Schema<IProcessedGmailMessage>(
  {
    gmailMessageId: {
      type: String,
      required: true,
      index: true,
    },
    emailAddress: {
      type: String,
      required: true,
      index: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      // TTL index - automatically delete after 7 days
      expires: 60 * 60 * 24 * 7, // 7 days in seconds
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "organization",
      required: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "conversation",
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "message",
    },
  },
  {
    timestamps: true,
    collection: "processed_gmail_message",
  }
)

// Compound unique index for idempotency check
processedGmailMessageSchema.index(
  { gmailMessageId: 1, emailAddress: 1 },
  { unique: true }
)

export const ProcessedGmailMessage = mongoose.model<IProcessedGmailMessage>(
  "processed_gmail_message",
  processedGmailMessageSchema
)
