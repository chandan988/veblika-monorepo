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
  name: string
  status?: "active" | "error" | "expired" | "disconnected"
  credentials?: Record<string, any>
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
      enum: ["active", "error", "expired", "disconnected"],
      default: "active",
    },
  },
  {
    timestamps: true,
    collection: "integration",
  }
)

integrationSchema.index({ orgId: 1, type: 1 })

export const Integration = mongoose.model<IIntegration>(
  "integration",
  integrationSchema
)
