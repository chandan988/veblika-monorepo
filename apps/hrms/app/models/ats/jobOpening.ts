import mongoose, { Document } from "mongoose";


export interface IJobOpening extends Document {
    title: string;
    organisationId: mongoose.Types.ObjectId;
    organisation: string;
    targetDate: Date;
    openedDate: Date;
    jobOpeningStatus: string;
    jobType: string;
    industry: string;
    workExperience: string;
    salary: string;
    requiredSkills: string[];
    country?: string;
    state?: string;
    city?: string;
    zipCode?: string;
    isRemote?: boolean;
    description: string;
    requirements: string;
    benefits: string;
    noOfPositions: number;
    attachments?: Array<{
        key: string;
        url: string;
        fileName: string;
        mimeType: string;
        size: number;
        uploadedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const JobOpeningSchema = new mongoose.Schema<IJobOpening>(
    {
        title: { type: String, required: true },
        organisationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organisation", required: true },
        organisation: { type: String, required: true },
        targetDate: { type: Date, required: true },
        openedDate: { type: Date, required: true },
        jobOpeningStatus: { type: String, required: true },
        jobType: { type: String, required: true },
        industry: { type: String, required: true },
        workExperience: { type: String, required: true },
        salary: { type: String, required: true },
        requiredSkills: { type: [String], required: true },
        country: { type: String, required: false },
        state: { type: String, required: false },
        city: { type: String, required: false },
        zipCode: { type: String, required: false },
        isRemote: { type: Boolean, required: true, default: false },
        description: { type: String, required: true },  
        requirements: { type: String, required: true },
        benefits: { type: String, required: true },
        noOfPositions: { type: Number, required: true },
        attachments: [{
            key: { type: String, required: true },
            url: { type: String, required: true },
            fileName: { type: String, required: true },
            mimeType: { type: String, required: true },
            size: { type: Number, required: true },
            uploadedAt: { type: Date, default: Date.now }
        }],
    },
    { timestamps: true }
);
const JobOpening = mongoose.models.JobOpening || mongoose.model<IJobOpening>("JobOpening", JobOpeningSchema);
export default JobOpening;
