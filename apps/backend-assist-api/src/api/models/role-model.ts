import mongoose, { Document, Schema } from "mongoose"

export interface IRole extends Document {
  _id: mongoose.Types.ObjectId
  orgId: Schema.Types.ObjectId
  name: string
  slug: string
  description?: string
  permissions: string[]
  isDefault: boolean // True for seeded roles (Owner, Admin, Agent, Viewer)
  isSystem: boolean // True for system roles that cannot be deleted
  createdBy?: Schema.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const roleSchema = new Schema<IRole>(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "organization",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    permissions: {
      type: [String],
      required: true,
      default: [],
    },
    isDefault: {
      type: Boolean,
      required: true,
      default: false,
    },
    isSystem: {
      type: Boolean,
      required: true,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  {
    timestamps: true,
    collection: "role",
  }
)

// Compound unique index: role slug must be unique within an organisation
roleSchema.index({ orgId: 1, slug: 1 }, { unique: true })

// Index for querying default roles
roleSchema.index({ orgId: 1, isDefault: 1 })

export const Role = mongoose.model<IRole>("role", roleSchema)
