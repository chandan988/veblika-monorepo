import  mongoose, {Schema, Document } from "mongoose";


export interface IDepartment extends Document {
    name: string;
    code: string;
    organisationId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string;

}


const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true,default:"Administration" },
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

const Department =mongoose.models.Department || mongoose.model<IDepartment>("Department", DepartmentSchema);
export default Department;