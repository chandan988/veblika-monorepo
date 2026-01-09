import  mongoose, {Schema, Document } from "mongoose";


export interface IIndustry extends Document {
    industry: string;
    organisationId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}


const IndustrySchema = new Schema<IIndustry>(
  {
    industry: { type: String, required: true },
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
        ref: "Organisation",
        required: true,
    },
   
  },
  { timestamps: true }
);

const Industry =mongoose.models.Industry || mongoose.model<IIndustry>("Industry", IndustrySchema);
export default Industry;