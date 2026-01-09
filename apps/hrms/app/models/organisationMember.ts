
import mongoose, {Schema,Document}from "mongoose";

interface IOrganisationMember extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  organisationId: mongoose.Schema.Types.ObjectId;
  role: "ORG_ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";
  status: "ACTIVE" | "INVITED" | "DISABLED";
}

const OrganisationMemberSchema = new Schema<IOrganisationMember>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organisation",
      required: true,
    },
    role: {
      type: String,
      enum: ["ORG_ADMIN", "HR", "MANAGER", "EMPLOYEE"],
      default: "EMPLOYEE",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INVITED", "DISABLED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

export const OrganisationMember =
  mongoose.models.OrganisationMember ||
  mongoose.model<IOrganisationMember>(
    "organisationMember",
    OrganisationMemberSchema
  );
