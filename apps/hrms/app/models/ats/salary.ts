import  mongoose, {Schema, Document } from "mongoose";


export interface ISalary extends Document {
    salary: Number;
    organisationId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

}


const SalarySchema = new Schema<ISalary>(
  {
    salary: { type: Number, required: true },
    organisationId: {
      type: mongoose.Schema.Types.ObjectId,
        ref: "Organisation",
        required: true,
    },
   
  },
  { timestamps: true }
);

const Salary =mongoose.models.Salary || mongoose.model<ISalary>("Salary", SalarySchema);
export default Salary;