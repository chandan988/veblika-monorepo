import mongoose, { Document, Schema } from "mongoose"

export interface IContact extends Document {
  orgId: mongoose.Types.ObjectId
  name?: string
  email: string
  phone: string
  slackId: string
  whatsappId?: string
  source?: string
}

const contactSchema = new Schema<IContact>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    slackId: {
      type: String,
    },
    whatsappId: {
      type: String,
    },
    source: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "contact",
  }
)

// Compound unique index: one contact per email per organization
contactSchema.index({ orgId: 1, email: 1 }, { unique: true, sparse: true })

export const Contact = mongoose.model<IContact>("contact", contactSchema)
