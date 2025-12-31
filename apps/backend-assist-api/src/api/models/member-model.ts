import mongoose, { Document, Schema } from "mongoose"

export interface IMember extends Document {
  _id: mongoose.Types.ObjectId
  organizationId: Schema.Types.ObjectId
  userId: Schema.Types.ObjectId
  roleId: Schema.Types.ObjectId // Reference to the Role document
  isOwner: boolean // If true, has full access (manage all)
  extraPermissions: string[] // Additional permissions beyond role
  invitedBy?: string
  createdAt: Date
  updatedAt: Date
}

// Populated member interface for use with CASL
export interface IMemberPopulated extends Omit<IMember, "roleId"> {
  roleId: {
    _id: mongoose.Types.ObjectId
    name: string
    slug: string
    permissions: string[]
    isDefault: boolean
    isSystem: boolean
  } | null
}

// Member with user information from auth service
export interface IMemberWithUserInfo {
  _id: string
  organizationId: string
  userId:string
  user: {
    _id: string
    name: string
    email: string
    image?: string
  }
  roleId: string
  isOwner: boolean
  extraPermissions: string[]
  createdAt: Date
  updatedAt: Date
}

const memberSchema = new Schema<IMember>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "organization",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "role",
      required: true,
    },
    isOwner: {
      type: Boolean,
      required: true,
      default: false,
    },
    extraPermissions: {
      type: [String],
      required: true,
      default: [],
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
memberSchema.index({ organizationId: 1, isOwner: 1 })

export const Member = mongoose.model<IMember>("member", memberSchema)


