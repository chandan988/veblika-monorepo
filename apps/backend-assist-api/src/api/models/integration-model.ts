import mongoose, { Document, Schema } from "mongoose"

export type Channel =
  | "gmail"
  | "imap"
  | "smtp"
  | "slack"
  | "whatsapp"
  | "webchat"

export interface IIntegration extends Document {
  orgId: mongoose.Types.ObjectId
  channel: Channel
  provider?: string
  name: string
  status?: "connected" | "disconnected" | "error" | "expired" | "active"
  credentials?: {
    accessToken?: string
    refreshToken?: string
    expiryDate?: Date
    [key: string]: any
  }
  channelEmail?: string
}

const integrationSchema = new Schema<IIntegration>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "organization",
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["gmail", "imap", "smtp", "slack", "whatsapp", "webchat"],
      required: true,
    },
    provider: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    credentials: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["connected", "disconnected", "error", "expired", "active"],
      default: "connected",
    },
    channelEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "integration",
  }
)

integrationSchema.index({ orgId: 1, channel: 1, channelEmail: 1 }, { unique: false })

export const Integration = mongoose.model<IIntegration>(
  "integration",
  integrationSchema
)
