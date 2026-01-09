import mongoose, { Document, Schema } from "mongoose";



export interface IEmploymentStatus extends Document {
    status: string;
    organisationId: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}



const EmploymentStatusSchema = new Schema<IEmploymentStatus>(
    {
        status: { type: String, required: true, unique: true },
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
    },
    { timestamps: true }

);  

const EmploymentStatus = mongoose.models.EmploymentStatus || mongoose.model<IEmploymentStatus>("EmploymentStatus", EmploymentStatusSchema);
export default EmploymentStatus;