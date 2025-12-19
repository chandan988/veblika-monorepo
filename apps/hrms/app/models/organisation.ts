import mongoose, { Schema,Document } from "mongoose"

export interface IOrganization extends Document {
    name: string
    email: string
    phone: string
    logo?: string
    website?: string
    address: {
        country: string
        state: string
        city: string
    }
    plan: "FREE" | "BASIC" | "PRO"  
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}


const OrganizationSchema = new Schema<IOrganization>({
    name: { type: String, required: true },
    email: {type: String, required: true},
    phone: {type: String, required: true},
    logo: {type: String},
    website: {type: String},
    address: {
        country: {type: String},
        state: {type: String},
        city: {type: String},
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
}, { timestamps: true,versionKey:false })



export const organization= mongoose.model<IOrganization>("organization", OrganizationSchema)
