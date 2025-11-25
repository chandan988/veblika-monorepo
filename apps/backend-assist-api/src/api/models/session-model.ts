import mongoose, { Document, Schema } from "mongoose"

export interface ISession extends Document {
  userId: string
  token: string
  expiresAt: Date
  ipAddress?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: String,
      required: true,
      ref: "user",
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "session",
  }
)

sessionSchema.index({ userId: 1, expiresAt: 1 })
sessionSchema.index({ token: 1 })

export const Session = mongoose.model<ISession>("session", sessionSchema)
