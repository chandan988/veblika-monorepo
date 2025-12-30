import  mongoose, {Schema, Document } from "mongoose";


export interface IBranch extends Document {
    name: string;
    code: string;
    organisationId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string;

}


const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
        ref: "Organisation",
        required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Branch =mongoose.models.Branch || mongoose.model<IBranch>("Branch", BranchSchema);
export default Branch;