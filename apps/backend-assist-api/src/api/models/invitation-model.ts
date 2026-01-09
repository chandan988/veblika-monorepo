import mongoose, { Document, Schema } from "mongoose"

export type InvitationStatus = "pending" | "accepted" | "rejected" | "expired"

export interface IInvitation extends Document {
  email: string
  orgId: mongoose.Types.ObjectId
  roleId: mongoose.Types.ObjectId
  invitedBy: mongoose.Types.ObjectId // memberId
  status: "pending" | "accepted" | "expired"
  userExists: boolean
  expiresAt: Date
  createdAt: Date
  acceptedAt?: Date
}

const invitationSchema = new Schema<IInvitation>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "organization",
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "role",
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "member",
      required: true,
    },
    status: {
      type: String,
    },
    userExists: {
      type: Boolean,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "invitation",
  }
)

export const Invitation = mongoose.model<IInvitation>(
  "invitation",
  invitationSchema
)
