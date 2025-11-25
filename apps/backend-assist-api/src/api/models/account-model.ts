import mongoose, { Document, Schema } from "mongoose"

export interface IAccount extends Document {
  userId: string
  accountId: string
  providerId: string
  accessToken?: string
  refreshToken?: string
  accessTokenExpiresAt?: Date
  refreshTokenExpiresAt?: Date
  scope?: string
  idToken?: string
  password?: string
  createdAt: Date
  updatedAt: Date
}

const accountSchema = new Schema<IAccount>(
  {
    userId: {
      type: String,
      required: true,
      ref: "user",
      index: true,
    },
    accountId: {
      type: String,
      required: true,
    },
    providerId: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    accessTokenExpiresAt: {
      type: Date,
    },
    refreshTokenExpiresAt: {
      type: Date,
    },
    scope: {
      type: String,
    },
    idToken: {
      type: String,
    },
    password: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "account",
  }
)

accountSchema.index({ userId: 1, providerId: 1 })
accountSchema.index({ accountId: 1, providerId: 1 }, { unique: true })

export const Account = mongoose.model<IAccount>("account", accountSchema)
