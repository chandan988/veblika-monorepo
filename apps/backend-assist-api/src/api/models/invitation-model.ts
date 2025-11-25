import mongoose, { Document, Schema } from "mongoose"

export type InvitationStatus = "pending" | "accepted" | "rejected" | "expired"

export interface IInvitation extends Document {
  organizationId: string
  teamId?: string
  email: string
  role: string | string[]
  status: InvitationStatus
  inviterId: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const invitationSchema = new Schema<IInvitation>(
  {
    organizationId: {
      type: String,
      required: true,
      ref: "organization",
      index: true,
    },
    teamId: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: Schema.Types.Mixed,
      required: true,
      default: "member",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
      index: true,
    },
    inviterId: {
      type: String,
      required: true,
      ref: "user",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "invitation",
  }
)

invitationSchema.index({ organizationId: 1, email: 1, status: 1 })
invitationSchema.index({ email: 1, status: 1 })
invitationSchema.index({ expiresAt: 1 })

export const Invitation = mongoose.model<IInvitation>("invitation", invitationSchema)
