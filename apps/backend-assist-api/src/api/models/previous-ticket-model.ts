import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketAttachment {
  filename?: string
  originalName?: string
  mimetype?: string
  size?: number
  attachmentId?: string
}

export interface ITicket extends Document {
  title: string
  description: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  category?: string
  assignedTo?: string
  customerId?: string
  customerEmail?: string
  requesterName?: string
  requesterEmail?: string
  createdBy?: string
  tags?: string[]
  attachments?: ITicketAttachment[]
  source?: "manual" | "gmail" | "api"
  sourceMetadata?: Record<string, unknown>
  externalBody?: string
  externalBodyFormat?: "text" | "html"
  createdAt: Date
  updatedAt: Date
}

const attachmentSchema = new Schema<ITicketAttachment>(
  {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    attachmentId: String,
  },
  { _id: false }
)

const ticketSchema = new Schema<ITicket>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      trim: true,
    },
    assignedTo: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      trim: true,
    },
    requesterName: {
      type: String,
      trim: true,
    },
    requesterEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    customerId: {
      type: String,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    attachments: [attachmentSchema],
    source: {
      type: String,
      enum: ["manual", "gmail", "api"],
      default: "manual",
    },
    sourceMetadata: {
      type: Schema.Types.Mixed,
    },
    externalBody: String,
    externalBodyFormat: {
      type: String,
      enum: ["text", "html"],
      default: "text",
    },
  },
  {
    timestamps: true,
  }
)

// Indexes
// ticketSchema.index({ status: 1, priority: 1 });
// ticketSchema.index({ customerId: 1 });
// ticketSchema.index({ customerEmail: 1 });
// ticketSchema.index({ createdAt: -1 });

export const Ticket = mongoose.model<ITicket>("Ticket", ticketSchema)
