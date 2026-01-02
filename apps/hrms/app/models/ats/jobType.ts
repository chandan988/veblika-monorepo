import  mongoose, {Schema, Document } from "mongoose";


export interface IJobType extends Document {
    type: string;
    organisationId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}


const JobTypeSchema = new Schema<IJobType>(
  {
    type: { type: String, required: true },
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
        ref: "Organisation",
        required: true,
    },
   
  },
  { timestamps: true }
);

const JobType =mongoose.models.JobType || mongoose.model<IJobType>("JobType", JobTypeSchema);
export default JobType;