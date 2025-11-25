import mongoose, { Document, Schema } from "mongoose"

export interface IVerification extends Document {
  identifier: string
  value: string
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

const verificationSchema = new Schema<IVerification>(
  {
    identifier: {
      type: String,
      required: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "verification",
  }
)

verificationSchema.index({ identifier: 1, expiresAt: 1 })

export const Verification = mongoose.model<IVerification>("verification", verificationSchema)
