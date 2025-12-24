import mongoose from "mongoose";


export interface IOrganisation extends mongoose.Document {
    logo: string;
    orgCode: string;
    address?: {
        country?: string;
        state?: string;
        city?: string;
    };
    plan?: "FREE" | "BASIC" | "PRO";
    isActive?: boolean;
    website?: string;
    orgType?: string;
    contactPerson: string;
    name: string;
    email: string;
    phone?: string;
    createdAt: Date;
    updatedAt: Date;
}


const organisationSchema = new mongoose.Schema<IOrganisation>({
    name: { type: String, required: true },
    orgCode: { type: String, unique: true },   // ZOHO-style code
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: String,
    logo: String,
    address: {
        country: String,
        state: String,
        city: String,
    },

    plan: {
        type: String,
        enum: ["FREE", "BASIC", "PRO"],
        default: "FREE"
    },

    isActive: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true,
        versionKey: false,
        collection: "organisation",
    }
);
export const Organisation = mongoose.model<IOrganisation>(
    "organisation",
    organisationSchema
);
