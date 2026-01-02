import  mongoose, {Schema, Document } from "mongoose";


export interface IWorkExperience extends Document {
    experience: string;
    organisationId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

}


const WorkExperienceSchema = new Schema<IWorkExperience>(
  {
    experience: { type: String, required: true },
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
        ref: "Organisation",
        required: true,
    },
   
  },
  { timestamps: true }
);

const WorkExperience =mongoose.models.WorkExperience || mongoose.model<IWorkExperience>("WorkExperience", WorkExperienceSchema);
export default WorkExperience;