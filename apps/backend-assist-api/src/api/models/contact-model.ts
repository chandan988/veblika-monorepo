import mongoose, { Document, Schema } from "mongoose"

export interface IContact extends Document {
  orgId: mongoose.Types.ObjectId
  name?: string
  email: string
  phone: string
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
    source: {
      type: String,
      trim: true,
      lowercase: true,
      enum: ["gmail", "webchat", ""],
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
