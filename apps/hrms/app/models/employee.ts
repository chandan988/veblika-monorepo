import mongoose, { Schema } from "mongoose";


export interface IEmployee extends Document {
    basicInformation: {
        EmployeeId: string;
        firstName: string;
        lastName?: string;
        preferredName?: string;
        email: string;
    };
    workInformation: {
        organisationId: string;
        organisation:string;
        branchId: string;
        branch:string;
        departmentId: string;
        department:string;
        designationId: string;
        designation:string;
        sourceOfHiring?: string;
        employmentType?: string;
        employeeStatus?: string;
        dateOfJoining?: Date;
        currentExp?: string;
        totalExp?: string;
    };
    heirarchicalInformation: {
        managerId?: string;
        reportingToId?: string;
    };
    personalInformation: {
        dateOfBirth?: Date;
        gender?: string;
        contactNumber?: string;
        askMeAbout?: string;
        maritalStatus?: string;
        aboutMe?: string;
    };
    identityInformation: {
        panNumber?: string;
        aadharNumber?: string;
        UAN?: string;
    };
    contactInformation: {
        workPhoneNo?: string;
        personalPhoneNo?: string;
        emergencyContactNo?: string;
        presentAddress: {
            addressLine1?: string;
            addressLine2?: string;
            country?: string;
            state?: string;
            city?: string;
            zipCode?: string;
        };
        permanentAddress: {
            addressLine1?: string;
            addressLine2?: string;
            country?: string;
            state?: string;
            city?: string;
            zipCode?: string;
        };

    };
    workExperience: [
        {
            companyName: string;
            jobTitle: string;
            from: Date;
            to: Date;
            jobDescription?: string;
            relevent?: string;
        }
    ];
    educationDetails: [
        {
            instituteName: string;
            degree: string;
            fieldOfStudy: string;
            from: Date;
            to: Date;
            grade?: string;
        }
    ]
    dependentDetails: [
        {
            name: string;
            relationship: string;
            dateOfBirth: Date;
        }
    ]
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}


const EmployeeSchema = new Schema<IEmployee>(
    {
        basicInformation: {
            EmployeeId: { type: String, required: true, unique: true },
            firstName: { type: String, required: true },
            lastName: { type: String, required: false },
            preferredName: { type: String },
            email: { type: String, required: true, unique: true },
        },
        workInformation: {
            organisationId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Organisation",
                required: true,
            },
            organisation:{ type: String, required: true },
            branchId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Branch",
                required: true,
            },
            branch:{ type: String, required: true },
            departmentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Department",
                required: true,
            },
            department:{ type: String, required: true },
            designationId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Designation",
                required: true,
            },
            designation:{ type: String, required: true },
            sourceOfHiring: { type: String },
            employmentType: { type: String, enum: ["FULL_TIME", "PART_TIME", "INTERN", "CONTRACT"], },
            employeeStatus: {
                type: String, 
                enum: ["ACTIVE", "ONBOARDING", "EXITED"],
                default: "ONBOARDING"
            },
            dateOfJoining: { type: Date },
            currentExp: { type: String },
            totalExp: { type: String },
        },
        heirarchicalInformation: {
            managerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Employee",
            },
            reportingToId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Employee",
            },
        },
        personalInformation: {
            dateOfBirth: { type: Date },
            gender: { type: String },
            contactNumber: { type: String },
            askMeAbout: { type: String },
            maritalStatus: { type: String },
            aboutMe: { type: String },
        },
        identityInformation: {
            panNumber: { type: String },
            aadharNumber: { type: String },
            UAN: { type: String },
        },
        contactInformation: {
            workPhoneNo: { type: String },
            personalPhoneNo: { type: String },
            emergencyContactNo: { type: String },
            presentAddress: {
                addressLine1: { type: String },
                addressLine2: { type: String },
                country: { type: String },
                state: { type: String },
                city: { type: String },
                zipCode: { type: String },
            },
            permanentAddress: {
                addressLine1: { type: String },
                addressLine2: { type: String },
                country: { type: String },
                state: { type: String },
                city: { type: String },
                zipCode: { type: String },
            },
        },
        workExperience: [
            {
                companyName: { type: String, required: true },
                jobTitle: { type: String, required: true },
                from: { type: Date, required: true },
                to: { type: Date, required: true },
                jobDescription: { type: String },
                relevent: { type: String },
            }

        ],
        educationDetails: [
            {
                instituteName: { type: String, required: true },
                degree: { type: String, required: true },
                fieldOfStudy: { type: String, required: true },
                from: { type: Date, required: true },
                to: { type: Date, required: true },
                grade: { type: String },
            }
        ],
        dependentDetails: [
            {
                name: { type: String, required: true },
                relationship: { type: String, required: true },
                dateOfBirth: { type: Date, required: true },
            }
        ],
        isActive: { type: Boolean, default: true },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);


const Employee = mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);
export default Employee;