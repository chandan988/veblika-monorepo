import mongoose, { Schema, Document } from "mongoose";


export interface IJobOpeningStatus extends Document {
    status: string;
    organisationId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

}


const BranchSchema = new Schema<IJobOpeningStatus>(
    {
        status: { type: String, required: true },
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },

    },
    { timestamps: true }
);

const JobOpeningStatus = mongoose.models.JobOpeningStatus || mongoose.model<IJobOpeningStatus>("JobOpeningStatus", BranchSchema);
export default JobOpeningStatus;