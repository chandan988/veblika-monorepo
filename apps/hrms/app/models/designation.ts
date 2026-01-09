import  mongoose, {Schema, Document } from "mongoose";


export interface IDesignation extends Document {
    name: string;
    level: Number;
    organisationId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string;

}


const DesignationSchema = new Schema<IDesignation>(
  {
    name: { type: String, required: true },
    level: { type: Number, required: true,  },
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

const Designation =mongoose.models.Designation || mongoose.model<IDesignation>("Designation", DesignationSchema);
export default Designation;