import mongoose, { Document, Schema } from "mongoose"

export interface IContact extends Document {
  orgId: mongoose.Types.ObjectId
  name?: string
  email: string
  phone: string
  slackId: string
  whatsappId?: string
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
  },
  {
    timestamps: true,
    collection: "contact",
  }
)

export const Contact = mongoose.model<IContact>("contact", contactSchema)
