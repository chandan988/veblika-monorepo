import mongoose, { Document, Schema } from "mongoose"

export interface IMember extends Document {
  organizationId: string
  userId: string
  role: string | string[]
  invitedBy?: string
  createdAt: Date
  updatedAt: Date
}

const memberSchema = new Schema<IMember>(
  {
    organizationId: {
      type: String,
      required: true,
      ref: "organization",
      index: true,
    },
    userId: {
      type: String,
      required: true,
      ref: "user",
      index: true,
    },
    role: {
      type: Schema.Types.Mixed,
      required: true,
      default: "member",
    },
    invitedBy: String,
  },
  {
    timestamps: true,
    collection: "member",
  }
)

memberSchema.index({ organizationId: 1, userId: 1 }, { unique: true })
memberSchema.index({ userId: 1 })

export const Member = mongoose.model<IMember>("member", memberSchema)
