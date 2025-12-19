
import mongoose, {Document} from "mongoose"

export interface IEmployee extends Document{
    orgId: mongoose.Types.ObjectId
    firstName: string
    lastName: string
    email: string
    phone: string
    position: string
    department: string
    dateOfJoining: Date
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}