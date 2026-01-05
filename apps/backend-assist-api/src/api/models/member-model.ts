import mongoose, { Document, Schema } from "mongoose"

export interface IMember extends Document {
  _id: mongoose.Types.ObjectId
  orgId: Schema.Types.ObjectId
  userId: Schema.Types.ObjectId
  roleId: Schema.Types.ObjectId // Reference to the Role document
  isOwner: boolean // If true, has full access (manage all)
  extraPermissions: string[] // Additional permissions beyond role
  metadata?: Record<string, any>
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
  orgId: string
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
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const memberSchema = new Schema<IMember>(
  {
    orgId: {
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
    invitedBy: {
      type:Schema.Types.ObjectId,
      ref:"member",
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    collection: "member",
  }
)

memberSchema.index({ orgId: 1, userId: 1 }, { unique: true })
memberSchema.index({ userId: 1 })
memberSchema.index({ orgId: 1, isOwner: 1 })

export const Member = mongoose.model<IMember>("member", memberSchema)


