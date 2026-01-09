import mongoose, { Document, Schema } from "mongoose";



export interface IHiringSource extends Document {
    source: string;
    organisationId: string;
    createdAt: Date;
    updatedAt: Date;
}


const HiringSourceSchema = new Schema<IHiringSource>(
    {
        source: { type: String, required: true, unique: true },
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },
       
    },
    { timestamps: true }

);  

const HiringSource = mongoose.models.HiringSource || mongoose.model<IHiringSource>("HiringSource", HiringSourceSchema);
export default HiringSource;