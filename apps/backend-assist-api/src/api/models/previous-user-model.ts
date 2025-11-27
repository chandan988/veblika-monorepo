import mongoose, { Document, Schema } from "mongoose"

export interface IUser extends Document {
  authUserId: string
  email: string
  gmailConnectedEmail?: string
  name?: string
  role?: string
  gmailAccessToken?: string
  gmailRefreshToken?: string
  gmailTokenExpiry?: Date
  gmailHistoryId?: string
  gmailWatchExpiration?: Date
  hasGmailConnected: boolean
}

const userSchema = new Schema<IUser>(
  {
    authUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    gmailConnectedEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      default: "customer",
    },
    gmailAccessToken: String,
    gmailRefreshToken: String,
    gmailTokenExpiry: Date,
    gmailHistoryId: String,
    gmailWatchExpiration: Date,
  },
  {
    timestamps: true,
  }
)

userSchema.virtual("hasGmailConnected").get(function hasGmailConnected(this: IUser) {
  return Boolean(this.gmailAccessToken && this.gmailRefreshToken)
})

export const User = mongoose.model<IUser>("User", userSchema)
