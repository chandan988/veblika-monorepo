import mongoose, { Document, Schema } from "mongoose"

export interface IOrganization extends Document {
  name: string
  slug: string
  logo?: string
  resellerId: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    resellerId: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logo: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: "organization",
  }
)

organizationSchema.index({ slug: 1 })

export const Organization = mongoose.model<IOrganization>("organization", organizationSchema)
