import mongoose, { Document, Schema } from "mongoose"

export interface IUser extends Document {
  name?: string
  email: string
  emailVerified: boolean
  image?: string
  role?: string
  lang?: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "user",
  }
)

userSchema.index({ email: 1 })

export const User = mongoose.model<IUser>("user", userSchema)
